'use server';

import {
  shippingAddressSchema,
  signInFormSchema,
  signUpFormSchema,
  paymentMethodSchema,
  updateUserSchema,
  updateAddressSchema,
  savedPaymentMethodSchema,
} from '../validators';
import { auth, signIn, signOut } from '@/auth';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { hash } from '../encrypt';
import { prisma } from '@/db/prisma';
import { formatError } from '../utils';
import { ShippingAddress } from '@/types';
import { z } from 'zod';
import { PAGE_SIZE } from '../constants';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { getMyCart } from './cart.actions';
import { sendVerificationEmailToken } from './auth.actions';
import { redirect } from 'next/navigation';
import { getOrCreateCurrentLandlord } from './landlord.actions';
import { getSubdomainRedirectUrl } from '../utils/subdomain-redirect';
import { notifyNewSignup } from '../services/admin-notifications';
import { logAuthEvent } from '@/lib/security/audit-logger';
import { redeemBetaCodeForNewUser } from './beta-tester.actions';

// Sign in the user with credentials
export async function signInWithCredentials(
  prevState: unknown,
  formData: FormData
) {
  try {
    const user = signInFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    // Check if user exists
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { id: true, role: true, emailVerified: true },
    });

    if (!dbUser) {
      return { success: false, message: 'Invalid email or password' };
    }

    // Allow sign-in even if email not verified (verify later pattern)
    // Critical actions will be blocked in the app, not at sign-in

    // Sign in the user
    const result = await signIn('credentials', {
      ...user,
      redirect: false,
    });

    if (!result || result.error) {
      return { success: false, message: 'Invalid email or password' };
    }

    // Check if there's a specific callback URL provided (and it's not just '/')
    const rawCallbackUrl = formData.get('callbackUrl');
    const callbackUrl =
      typeof rawCallbackUrl === 'string' && 
      rawCallbackUrl.trim().startsWith('/') && 
      rawCallbackUrl.trim() !== '/'
        ? rawCallbackUrl.trim()
        : null;

    // If there's a specific callback URL, use it; otherwise use role-based redirect
    const redirectUrl = callbackUrl 
      ? callbackUrl 
      : await getSubdomainRedirectUrl(
          dbUser.role,
          dbUser.id
        );

    redirect(redirectUrl);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    return { success: false, message: 'Invalid email or password' };
  }
}

// Sign user out
export async function signOutUser() {
  // Get current session for audit logging
  const session = await auth();
  
  // get current users cart and delete it so it does not persist to next user
  const currentCart = await getMyCart();

  if (currentCart?.id) {
    await prisma.cart.delete({ where: { id: currentCart.id } });
  } else {
    console.warn('No cart found for deletion.');
  }

  // Log logout to audit trail
  if (session?.user?.id) {
    logAuthEvent('AUTH_LOGOUT', {
      userId: session.user.id,
      email: session.user.email || undefined,
      success: true,
    }).catch(console.error);
  }

  await signOut();
}

// Sign up user
export async function signUpUser(prevState: unknown, formData: FormData) {
  try {
    const user = signUpFormSchema.parse({
      name: formData.get('name'),
      email: formData.get('email'),
      phoneNumber: formData.get('phoneNumber'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword'),
      betaCode: formData.get('betaCode'),
    });

    const plainPassword = user.password;

    user.password = await hash(user.password);

    // Normalize phone to E.164 (+15551234567) so SMS service can use it
    // without re-parsing. Strips formatting characters and prefixes +1 for
    // 10-digit US numbers.
    const phoneDigits = user.phoneNumber.replace(/\D/g, '');
    const normalizedPhone =
      phoneDigits.length === 10
        ? `+1${phoneDigits}`
        : phoneDigits.length === 11 && phoneDigits.startsWith('1')
        ? `+${phoneDigits}`
        : phoneDigits.startsWith('+')
        ? user.phoneNumber
        : `+${phoneDigits}`;

    const fromProperty = formData.get('fromProperty') === 'true' || Boolean(formData.get('propertySlug'));

    const rawRole = formData.get('role');
    
    // Supported roles: user, tenant, landlord, property_manager, contractor, homeowner, agent
    const validRoles = ['user', 'tenant', 'landlord', 'property_manager', 'contractor', 'homeowner', 'agent'];
    let roleValue = fromProperty
      ? 'tenant'
      : rawRole && validRoles.includes(rawRole as string)
        ? (rawRole as string)
        : 'user';

    // ── Beta code pre-validation ───────────────────────────────────────────
    // If a code was provided, look it up before creating the user. This lets
    // us infer the role (pm vs contractor) from the program audience and
    // skip onboarding cleanly downstream.
    let betaProgram: Awaited<ReturnType<typeof prisma.betaProgram.findUnique>> | null = null;
    if (user.betaCode && user.betaCode.length > 0) {
      betaProgram = await prisma.betaProgram.findUnique({
        where: { code: user.betaCode.toUpperCase() },
      });
      if (!betaProgram || !betaProgram.isActive) {
        return { success: false, message: `Invalid beta code: ${user.betaCode}` };
      }
      if (betaProgram.expiresAt && betaProgram.expiresAt < new Date()) {
        return { success: false, message: 'That beta code has expired.' };
      }
      if (betaProgram.redeemedCount >= betaProgram.maxRedemptions) {
        return {
          success: false,
          message: `That beta code is fully redeemed (${betaProgram.maxRedemptions}/${betaProgram.maxRedemptions} spots used).`,
        };
      }
      // Match user role to program audience for clarity in the dashboard
      if (betaProgram.audience === 'pm') roleValue = 'landlord';
      else if (betaProgram.audience === 'contractor') roleValue = 'contractor';
    }

    const createdUser = await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        phoneNumber: normalizedPhone,
        password: user.password,
        role: roleValue,
        // Beta testers skip onboarding entirely (they redeemed a code so we
        // know what they want; no need to walk through the role picker).
        // Property applicants also skip — they've declared intent already.
        onboardingCompleted: fromProperty || !!betaProgram,
        // Enable 2FA by default for landlords and property managers
        twoFactorEnabled: roleValue === 'landlord' || roleValue === 'property_manager',
      },
    });

    // Notify admin of new signup (non-blocking)
    notifyNewSignup({
      name: user.name,
      email: user.email,
      role: roleValue,
      signupMethod: betaProgram ? `Beta (${betaProgram.code})` : 'Email',
    }).catch(console.error);

    // Send verification email (non-blocking)
    sendVerificationEmailToken(user.email).catch(console.error);

    // Log signup event
    logAuthEvent('AUTH_SIGNUP', {
      userId: createdUser.id,
      email: user.email,
      role: roleValue,
      success: true,
    }).catch(console.error);

    // ── Redeem beta code in the same flow ───────────────────────────────────
    // We do this AFTER the user is created so the BetaTester record can link
    // back to the new userId. We do NOT block signup if redemption fails —
    // the user can retry from /admin/beta-testers or /contractor-dashboard/beta-testers.
    if (betaProgram) {
      try {
        await redeemBetaCodeForNewUser({
          userId: createdUser.id,
          program: betaProgram,
          name: user.name,
        });
      } catch (e) {
        // Soft-fail — log it, the user can still finish signup.
        console.error('[signUp] beta redeem failed', e);
      }
    }

    // Sign in automatically and redirect to onboarding/subscription flow
    const callbackUrl = formData.get('callbackUrl') as string | null;

    // Beta testers go straight to their dashboard — no onboarding, no plan picker.
    const betaRedirect =
      betaProgram?.audience === 'pm'
        ? '/admin/overview'
        : betaProgram?.audience === 'contractor'
        ? '/contractor-dashboard'
        : null;

    await signIn('credentials', {
      email: user.email,
      password: plainPassword,
      redirect: true,
      redirectTo: betaRedirect || callbackUrl || '/onboarding',
    });

    // This return won't be reached due to redirect, but needed for type safety
    return {
      success: true,
      message: betaProgram
        ? `Welcome to the beta! ${betaProgram.freeMonths} months free unlocked.`
        : 'Account created successfully!',
    };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    return { success: false, message: formatError(error) };
  }
}

// Get user by the ID
export async function getUserById(userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId },
  });
  if (!user) throw new Error('User not found');
  return user;
}

// Update the user's address
export async function updateUserAddress(data: ShippingAddress) {
  try {
    const session = await auth();

    const currentUser = await prisma.user.findFirst({
      where: { id: session?.user?.id },
    });

    if (!currentUser) throw new Error('User not found');

    const address = shippingAddressSchema.parse(data);

    await prisma.user.update({
      where: { id: currentUser.id },
      data: { shippingAddress: address },
    });

    revalidatePath('/shipping-address');

    return {
      success: true,
      message: 'User updated successfully',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Update user's payment method
export async function updateUserPaymentMethod(
  data: z.infer<typeof paymentMethodSchema>
) {
  try {
    const session = await auth();
    const currentUser = await prisma.user.findFirst({
      where: { id: session?.user?.id },
    });

    if (!currentUser) throw new Error('User not found');

    const paymentMethod = paymentMethodSchema.parse(data);

    await prisma.user.update({
      where: { id: currentUser.id },
      data: { paymentMethod: paymentMethod.type },
    });

    return {
      success: true,
      message: 'User updated successfully',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Update the user profile
export async function updateProfile(user: { name: string; email: string }) {
  try {
    const session = await auth();

    const currentUser = await prisma.user.findFirst({
      where: {
        id: session?.user?.id,
      },
    });

    if (!currentUser) throw new Error('User not found');

    await prisma.user.update({
      where: {
        id: currentUser.id,
      },
      data: {
        name: user.name,
      },
    });

    return {
      success: true,
      message: 'User updated successfully',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Get all the users
export async function getAllUsers({
  limit = PAGE_SIZE,
  page,
  query,
}: {
  limit?: number;
  page: number;
  query: string;
}) {
  const queryFilter: Prisma.UserWhereInput =
    query && query !== 'all'
      ? {
          name: {
            contains: query,
            mode: 'insensitive',
          } as Prisma.StringFilter,
        }
      : {};

  const data = await prisma.user.findMany({
    where: {
      ...queryFilter,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: (page - 1) * limit,
    select: {
      id: true,
      name: true,
      email: true,
      phoneNumber: true,
      role: true,
      image: true,
    },
  });

  const dataCount = await prisma.user.count();

  return {
    data,
    totalPages: Math.ceil(dataCount / limit),
  };
}

// Delete a user
export async function deleteUser(id: string) {
  try {
    await prisma.user.delete({ where: { id } });

    revalidatePath('/admin/users');

    return {
      success: true,
      message: 'User deleted successfully',
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

// Update a user
export async function updateUser(user: z.infer<typeof updateUserSchema>) {
  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: user.name,
        role: user.role,
        // Phone is optional from the admin form. Empty string means "clear it",
        // null means "leave alone". Treat both as clear here.
        phoneNumber: user.phoneNumber ? user.phoneNumber : null,
      },
    });

    revalidatePath('/admin/users');

    return {
      success: true,
      message: 'User updated successfully',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Update user address
export async function updateUserProfileAddress(
  data: z.infer<typeof updateAddressSchema>
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated' };
    }

    const validatedAddress = updateAddressSchema.parse(data);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { address: validatedAddress },
    });

    revalidatePath('/user/profile');

    return {
      success: true,
      message: 'Address updated successfully',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Update user avatar
export async function updateUserAvatar(imageUrl: string) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated' };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: imageUrl },
    });

    revalidatePath('/user/profile');

    return {
      success: true,
      message: 'Avatar updated successfully',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Save payment method (Stripe tokenized)
export async function addSavedPaymentMethod(
  data: z.infer<typeof savedPaymentMethodSchema>
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated' };
    }

    const validatedData = savedPaymentMethodSchema.parse(data);

    if (validatedData.isDefault) {
      await prisma.savedPaymentMethod.updateMany({
        where: { userId: session.user.id },
        data: { isDefault: false },
      });
    }

    const paymentMethod = await prisma.savedPaymentMethod.create({
      data: {
        userId: session.user.id,
        stripePaymentMethodId: validatedData.stripePaymentMethodId,
        type: validatedData.type,
        cardholderName: validatedData.cardholderName,
        last4: validatedData.last4,
        expirationDate: validatedData.expirationDate,
        brand: validatedData.brand,
        billingAddress: validatedData.billingAddress,
        isDefault: validatedData.isDefault,
        isVerified: true,
      },
    });

    revalidatePath('/user/profile');

    return {
      success: true,
      message: 'Payment method saved successfully!',
      paymentMethodId: paymentMethod.id,
    };
  } catch (error) {
    console.error('Error saving payment method:', error);
    const message = formatError(error);
    return { success: false, message: message || 'Failed to save payment method' };
  }
}

// Get saved payment methods
export async function getSavedPaymentMethods() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, methods: [], message: 'Not authenticated' };
    }

    const methods = await prisma.savedPaymentMethod.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      methods,
      message: '',
    };
  } catch (error) {
    return { success: false, methods: [], message: formatError(error) };
  }
}

// Delete saved payment method
export async function deleteSavedPaymentMethod(paymentMethodId: string) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated' };
    }

    const paymentMethod = await prisma.savedPaymentMethod.findUnique({
      where: { id: paymentMethodId },
    });

    if (!paymentMethod || paymentMethod.userId !== session.user.id) {
      return { success: false, message: 'Payment method not found' };
    }

    await prisma.savedPaymentMethod.delete({
      where: { id: paymentMethodId },
    });

    revalidatePath('/user/profile');

    return {
      success: true,
      message: 'Payment method deleted successfully',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Verify payment method
export async function verifyPaymentMethod(token: string) {
  try {
    const verificationToken =
      await prisma.paymentMethodVerificationToken.findUnique({
        where: { token },
      });

    if (!verificationToken) {
      return { success: false, message: 'Invalid or expired token' };
    }

    if (verificationToken.expires < new Date()) {
      await prisma.paymentMethodVerificationToken.delete({
        where: { id: verificationToken.id },
      });
      return { success: false, message: 'Token has expired' };
    }

    await prisma.savedPaymentMethod.update({
      where: { id: verificationToken.paymentMethodId },
      data: { isVerified: true },
    });

    await prisma.paymentMethodVerificationToken.delete({
      where: { id: verificationToken.id },
    });

    return { success: true, message: 'Payment method verified successfully' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Update shipping address
export async function updateShippingAddress(
  data: z.infer<typeof updateAddressSchema>
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated' };
    }

    const validatedAddress = updateAddressSchema.parse(data);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { shippingAddress: validatedAddress },
    });

    revalidatePath('/user/profile');

    return {
      success: true,
      message: 'Shipping address updated successfully',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Update billing address
export async function updateBillingAddress(
  data: z.infer<typeof updateAddressSchema>
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated' };
    }

    const validatedAddress = updateAddressSchema.parse(data);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { billingAddress: validatedAddress },
    });

    revalidatePath('/user/profile');

    return {
      success: true,
      message: 'Billing address updated successfully',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Get saved payment method by ID (Stripe tokenized)
export async function getSavedPaymentMethodById(paymentMethodId: string) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, method: null, message: 'Not authenticated' };
    }

    const method = await prisma.savedPaymentMethod.findUnique({
      where: { id: paymentMethodId },
    });

    if (!method || method.userId !== session.user.id) {
      return { success: false, method: null, message: 'Payment method not found' };
    }

    return {
      success: true,
      method,
      message: '',
    };
  } catch (error) {
    return { success: false, method: null, message: formatError(error) };
  }
}

// Update saved payment method
export async function updateSavedPaymentMethod(
  paymentMethodId: string,
  data: z.infer<typeof savedPaymentMethodSchema>
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated' };
    }

    const paymentMethod = await prisma.savedPaymentMethod.findUnique({
      where: { id: paymentMethodId },
    });

    if (!paymentMethod || paymentMethod.userId !== session.user.id) {
      return { success: false, message: 'Payment method not found' };
    }

    const validatedData = savedPaymentMethodSchema.parse(data);

    if (validatedData.isDefault) {
      await prisma.savedPaymentMethod.updateMany({
        where: { userId: session.user.id },
        data: { isDefault: false },
      });
    }

    await prisma.savedPaymentMethod.update({
      where: { id: paymentMethodId },
      data: {
        cardholderName: validatedData.cardholderName,
        isDefault: validatedData.isDefault,
      },
    });

    revalidatePath('/user/profile');

    return {
      success: true,
      message: 'Payment method updated successfully',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function updatePhoneNumber(phoneNumber: string) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated' };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { phoneNumber },
    });

    revalidatePath('/user/profile');

    return {
      success: true,
      message: 'Phone number updated successfully',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Roles that cannot be changed through onboarding - these are privileged system roles
const PROTECTED_ROLES = ['superAdmin', 'admin'];

export async function setUserRoleAndLandlordIntake(data: {
  role: 'tenant' | 'landlord' | 'homeowner';
  unitsEstimateRange?: '0-10' | '11-50' | '51-200' | '200+';
  ownsProperties?: boolean;
  managesForOthers?: boolean;
  useSubdomain?: boolean;
  // Homeowner-specific fields
  homeType?: string;
  interestedServices?: string[];
  projectTimeline?: string;
}) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated' };
    }

    const userId = session.user.id as string;

    // Check if user has a protected role that cannot be changed via onboarding
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, emailVerified: true, email: true },
    });

    if (currentUser && PROTECTED_ROLES.includes(currentUser.role)) {
      return { 
        success: false, 
        message: `Cannot change role for ${currentUser.role} accounts through onboarding. Please contact support if you need to change your account type.` 
      };
    }

    // NOTE: We intentionally do NOT require a verified email here. Email
    // verification used to hard-block the role picker, which created a
    // dead-end for fresh signups who had not yet clicked the verification
    // link (especially on mobile where switching apps loses the form state).
    // The real abuse gate is now the subscription picker — the user can't
    // reach /admin without either a Stripe customer record (card on file)
    // or a legitimate in-window trial granted via this conscious role
    // selection. Email verification is nudged from settings instead.
    // Still kick off a verification email so they have a one-click link
    // waiting in their inbox.
    if (data.role === 'landlord' && currentUser && !currentUser.emailVerified) {
      try {
        await sendVerificationEmailToken(currentUser.email);
      } catch {}
    }

    await prisma.user.update({
      where: { id: userId },
      data: { 
        role: data.role,
        onboardingCompleted: true,
        // Enable 2FA by default for landlords
        ...(data.role === 'landlord' && { twoFactorEnabled: true }),
      },
    });

    if (data.role === 'landlord') {
      const landlordResult = await getOrCreateCurrentLandlord();

      if (!landlordResult.success) {
        return {
          success: false,
          message: landlordResult.message || 'Unable to initialize landlord workspace',
        };
      }

      // Set trial dates (14 days from now)
      const trialStartDate = new Date();
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 14);

      let unitsEstimateMin: number | null = null;
      let unitsEstimateMax: number | null = null;

      switch (data.unitsEstimateRange) {
        case '0-10':
          unitsEstimateMin = 0;
          unitsEstimateMax = 10;
          break;
        case '11-50':
          unitsEstimateMin = 11;
          unitsEstimateMax = 50;
          break;
        case '51-200':
          unitsEstimateMin = 51;
          unitsEstimateMax = 200;
          break;
        case '200+':
          unitsEstimateMin = 200;
          unitsEstimateMax = null;
          break;
        default:
          break;
      }

      await prisma.landlord.update({
        where: { id: landlordResult.landlord.id },
        data: {
          unitsEstimateMin: unitsEstimateMin ?? undefined,
          unitsEstimateMax: unitsEstimateMax ?? undefined,
          ownsProperties: data.ownsProperties ?? false,
          managesForOthers: data.managesForOthers ?? false,
          useSubdomain: data.useSubdomain ?? true,
          // Set trial dates
          trialStartDate,
          trialEndDate,
          trialStatus: 'trialing',
          subscriptionStatus: 'trialing',
        },
      });
    }
    
    if (data.role === 'homeowner') {
      // Create or update homeowner profile
      const existingHomeowner = await prisma.homeowner.findUnique({
        where: { userId },
      });
      
      if (existingHomeowner) {
        await prisma.homeowner.update({
          where: { userId },
          data: {
            homeType: data.homeType,
            interestedServices: data.interestedServices || [],
            projectTimeline: data.projectTimeline,
          },
        });
      } else {
        await prisma.homeowner.create({
          data: {
            userId,
            homeType: data.homeType,
            interestedServices: data.interestedServices || [],
            projectTimeline: data.projectTimeline,
          },
        });
      }
    }

    return { success: true, message: 'Onboarding preferences saved' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}
