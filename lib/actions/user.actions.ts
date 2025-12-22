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

    // Sign in the user
    const result = await signIn('credentials', {
      ...user,
      redirect: false,
    });

    if (!result || result.error) {
      return { success: false, message: 'Invalid email or password' };
    }

    // Get the authenticated user to determine redirect
    const authenticatedUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { id: true, role: true },
    });

    if (!authenticatedUser) {
      return { success: false, message: 'User not found' };
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
          authenticatedUser.role,
          authenticatedUser.id
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
  // get current users cart and delete it so it does not persist to next user
  const currentCart = await getMyCart();

  if (currentCart?.id) {
    await prisma.cart.delete({ where: { id: currentCart.id } });
  } else {
    console.warn('No cart found for deletion.');
  }
  await signOut();
}

// Sign up user
export async function signUpUser(prevState: unknown, formData: FormData) {
  try {
    const user = signUpFormSchema.parse({
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword'),
    });

    const plainPassword = user.password;

    user.password = await hash(user.password);

    const fromProperty = formData.get('fromProperty') === 'true' || Boolean(formData.get('propertySlug'));

    const rawRole = formData.get('role');
    const roleValue = fromProperty
      ? 'tenant'
      : rawRole === 'tenant' || rawRole === 'landlord' || rawRole === 'property_manager'
        ? (rawRole as string)
        : 'tenant';

    const createdUser = await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        password: user.password,
        role: roleValue,
      },
    });

    await sendVerificationEmailToken(user.email);

    await signIn('credentials', {
      email: user.email,
      password: plainPassword,
      redirect: false,
    });

    // Check if user came from a property application flow
    const propertySlug = formData.get('propertySlug');
    
    // If tenant signed up from a property, redirect them back to the application page
    if (roleValue === 'tenant' && propertySlug && typeof propertySlug === 'string' && propertySlug.trim().length > 0) {
      // Redirect back to the application page with the property slug
      redirect(`/application?property=${encodeURIComponent(propertySlug.trim())}`);
    }

    // Check if user came from pricing page with a plan
    const planParam = formData.get('plan');
    if ((roleValue === 'landlord' || roleValue === 'property_manager') && planParam && typeof planParam === 'string') {
      // If they selected a paid plan, redirect to subscription checkout
      if (planParam !== 'free') {
        redirect(`/admin/settings/subscription?upgrade=${planParam}`);
      } else {
        // Free plan - go to admin dashboard
        redirect('/admin/overview');
      }
    }

    const rawCallbackUrl = formData.get('callbackUrl');
    if (rawCallbackUrl && typeof rawCallbackUrl === 'string' && rawCallbackUrl.trim().length > 0) {
      redirect(rawCallbackUrl);
    }

    // For sign-up, use subdomain redirect logic but send to onboarding for landlords
    const redirectUrl = await getSubdomainRedirectUrl(roleValue, createdUser.id);
    
    // Override for landlords - send to onboarding instead of admin dashboard
    if ((roleValue === 'landlord' || roleValue === 'property_manager') && redirectUrl === '/admin/overview') {
      redirect('/onboarding/role');
    }
    
    // For tenants, check if they need onboarding before going to their page
    if (roleValue === 'tenant' && redirectUrl.includes('/user')) {
      redirect('/user/profile');
    }
    
    redirect(redirectUrl || '/');
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

export async function setUserRoleAndLandlordIntake(data: {
  role: 'tenant' | 'landlord';
  unitsEstimateRange?: '0-10' | '11-50' | '51-200' | '200+';
  ownsProperties?: boolean;
  managesForOthers?: boolean;
  useSubdomain?: boolean;
}) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated' };
    }

    const userId = session.user.id as string;

    await prisma.user.update({
      where: { id: userId },
      data: { role: data.role },
    });

    if (data.role === 'landlord') {
      const landlordResult = await getOrCreateCurrentLandlord();

      if (!landlordResult.success) {
        return {
          success: false,
          message: landlordResult.message || 'Unable to initialize landlord workspace',
        };
      }

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
        },
      });
    }

    return { success: true, message: 'Onboarding preferences saved' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}
