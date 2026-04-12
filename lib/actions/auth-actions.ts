'use server';

import { prisma } from '@/db/prisma';
import { cookies } from 'next/headers';

export async function transferSessionCartToUser(userId: string) {
  try {
    const cookiesObject = await cookies();
    const sessionCartId = cookiesObject.get('sessionCartId')?.value;

    if (sessionCartId) {
      const sessionCart = await prisma.cart.findFirst({
        where: { sessionCartId },
      });

      if (sessionCart) {
        // Delete current user cart
        await prisma.cart.deleteMany({
          where: { userId },
        });

        // Assign new cart
        await prisma.cart.update({
          where: { id: sessionCart.id },
          data: { userId },
        });
      }
    }
  } catch (error) {
    console.error('Error transferring session cart:', error);
  }
}
