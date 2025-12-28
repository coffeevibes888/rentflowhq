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
      allowDangerousEmailAccountLinking: true,
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
              const { transferSessionCartToUser } = await import('./lib/actions/auth-actions');
              await transferSessionCartToUser(user.id);
            } catch (error) {
              console.error('Failed to transfer session cart:', error);
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
});
