import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/db/prisma';
import { compare } from './lib/encrypt';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';

export const { handlers, auth, signIn, signOut } = NextAuth({
  pages: {
    signIn: '/sign-in',
    error: '/sign-in',
    // No `newUser` override: we want the explicit `callbackUrl` to win for
    // flows like "Apply Now" so tenants land on the application wizard, not
    // the generic role-selection page. Users without `onboardingCompleted`
    // are routed to onboarding by the home/dashboard pages on demand.
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // No custom cookie domain needed - using path-based routing, not subdomains
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Removed allowDangerousEmailAccountLinking for security
      // Users must verify email ownership before linking accounts
    }),
    CredentialsProvider({
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' },
      },
      async authorize(credentials) {
        if (credentials == null) return null;

        // Find user in database
        const user = await prisma.user.findFirst({
          where: {
            email: credentials.email as string,
          },
        });

        // Check if user exists and if the password matches
        if (user && user.password) {
          const isMatch = await compare(
            credentials.password as string,
            user.password
          );

          // If password is correct, return user
          if (isMatch) {
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
            };
          }
        }
        // If user does not exist or password does not match return null
        return null;
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    // Handle sign-in - allow OAuth and credentials
    async signIn({ user, account }) {
      // Always allow OAuth sign-ins
      if (account?.provider === 'google') {
        return true;
      }
      // Allow credentials sign-in
      if (account?.provider === 'credentials') {
        return true;
      }
      return true;
    },
    async session({ session, user, trigger, token }) {
      // Set the user ID from the token
      session.user.id = token.sub;
      session.user.role = token.role;
      session.user.name = token.name;
      session.user.onboardingCompleted = token.onboardingCompleted;

      const dbUser = await prisma.user.findUnique({
        where: { id: token.sub },
        select: { 
          role: true,
          phoneVerified: true, 
          phoneNumber: true,
          address: true,
          shippingAddress: true,
          billingAddress: true,
          image: true,
          onboardingCompleted: true,
        },
      });

      if (dbUser) {
        session.user.role = dbUser.role;
        session.user.phoneVerified = dbUser.phoneVerified;
        session.user.phoneNumber = dbUser.phoneNumber;
        session.user.address = dbUser.address;
        session.user.shippingAddress = dbUser.shippingAddress;
        session.user.billingAddress = dbUser.billingAddress;
        session.user.image = dbUser.image || undefined;
        session.user.onboardingCompleted = dbUser.onboardingCompleted;
      }

      // If there is an update, set the user name
      if (trigger === 'update') {
        session.user.name = user.name;
      }

      return session;
    },
    async jwt({ token, user, trigger, session }) {
      // Assign user fields to token
      if (user) {
        token.id = user.id;
        token.role = user.role;

        // Fetch onboarding status from database
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { onboardingCompleted: true },
        });
        token.onboardingCompleted = dbUser?.onboardingCompleted ?? false;

        // If user has no name then use the email
        if (user.name === 'NO_NAME') {
          token.name = user.email!.split('@')[0];

          // Update database to reflect the token name
          await prisma.user.update({
            where: { id: user.id },
            data: { name: token.name },
          });
        }

        if (trigger === 'signIn' || trigger === 'signUp') {
          // Transfer session cart to user in a server action
          // This avoids using next/headers in the auth config
          if (user.id) {
            try {
              const { transferSessionCartToUser } = await import('./lib/actions/auth.actions');
              await transferSessionCartToUser(user.id);
            } catch (error) {
              console.error('Failed to transfer session cart:', error);
            }

            // Fire trial reminder check — non-blocking, won't delay sign-in
            const role = user.role ?? token.role;
            if (role === 'landlord' || role === 'property_manager' || role === 'admin') {
              import('./lib/services/trial-reminder.service')
                .then(({ checkLandlordTrialReminder }) => checkLandlordTrialReminder(user.id!))
                .catch(() => {});
            } else if (role === 'contractor') {
              import('./lib/services/trial-reminder.service')
                .then(({ checkContractorTrialReminder }) => checkContractorTrialReminder(user.id!))
                .catch(() => {});
            }
          }
        }
      }

      // Handle session updates - refresh role and onboardingCompleted from database
      if (trigger === 'update') {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true, onboardingCompleted: true, name: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.onboardingCompleted = dbUser.onboardingCompleted;
          if (session?.user?.name) {
            token.name = session.user.name;
          }
        }
      }

      return token;
    },
  },
  events: {
    // Capture every sign-in to the audit log + login-attempt table — covers
    // credentials (including the auto sign-in performed right after signup)
    // as well as OAuth providers like Google, which otherwise never hit our
    // /api/auth/credentials-signin route.
    async signIn({ user, account, isNewUser }) {
      try {
        const { logAuthEvent } = await import('./lib/security/audit-logger');
        await logAuthEvent('AUTH_LOGIN', {
          userId: user?.id,
          email: user?.email ?? undefined,
          success: true,
          role: (user as any)?.role,
        });
      } catch (error) {
        console.error('auth events.signIn: audit log failed', error);
      }

      try {
        const { recordLoginAttempt } = await import('./lib/security/login-attempts');
        await recordLoginAttempt({
          email: user?.email ?? null,
          userId: user?.id ?? null,
          success: true,
          reason: 'ok',
        });
      } catch (error) {
        console.error('auth events.signIn: loginAttempt write failed', error);
      }

      // First-time OAuth signups otherwise slip past notifyNewSignup, which
      // is why the super-admin didn't get an email when the bypass happened.
      if (isNewUser) {
        try {
          const { notifyNewSignup } = await import('./lib/services/admin-notifications');
          await notifyNewSignup({
            name: user?.name ?? 'Unknown',
            email: user?.email ?? 'unknown@local',
            role: (user as any)?.role ?? 'user',
            signupMethod: account?.provider === 'google' ? 'Google' : 'OAuth',
          });
        } catch (error) {
          console.error('auth events.signIn: notifyNewSignup failed', error);
        }
      }
    },
  },
});
