/**
 * PayNearMe Webhook Handler
 * 
 * Receives notifications when cash payments are completed at retail locations.
 * 
 * Events:
 * - payment.completed: Cash payment was successful
 * - payment.failed: Payment failed (rare)
 * - order.expired: Barcode expired without payment
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import {
  verifyPayNearMeWebhook,
  parsePayNearMeWebhook,
} from '@/lib/services/paynearme.service';
import { creditLandlordWallet } from '@/lib/services/wallet.service';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-paynearme-signature') || '';

    // Verify webhook signature (skip in development if not configured)
    const isValid = verifyPayNearMeWebhook(body, signature);
    if (!isValid && process.env.NODE_ENV === 'production') {
      console.error('Invalid PayNearMe webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = parsePayNearMeWebhook(body);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    console.log('PayNearMe webhook received:', payload.event_type, payload.order_identifier);

    switch (payload.event_type) {
      case 'payment.completed':
        await handlePaymentCompleted(payload);
        break;

      case 'payment.failed':
        await handlePaymentFailed(payload);
        break;

      case 'order.expired':
        await handleOrderExpired(payload);
        break;

      default:
        console.log('Unhandled PayNearMe event:', payload.event_type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('PayNearMe webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentCompleted(payload: {
  order_identifier: string;
  confirmation_number: string;
  amount_paid: number;
  paid_at: string;
  retail_location?: { name: string; address: string };
}) {
  const { order_identifier, confirmation_number, amount_paid, paid_at, retail_location } = payload;

  // Find the cash payment
  const cashPayment = await prisma.cashPayment.findUnique({
    where: { referenceId: order_identifier },
    include: {
      tenant: true,
      property: {
        include: {
          landlord: true,
        },
      },
    },
  });

  if (!cashPayment) {
    console.error('Cash payment not found:', order_identifier);
    return;
  }

  if (cashPayment.status === 'completed') {
    console.log('Cash payment already processed:', order_identifier);
    return;
  }

  // Update cash payment status
  await prisma.cashPayment.update({
    where: { id: cashPayment.id },
    data: {
      status: 'completed',
      confirmationNumber: confirmation_number,
      processedAt: new Date(paid_at),
    },
  });

  // Mark the rent payment as paid
  await prisma.rentPayment.update({
    where: { id: cashPayment.paymentIntentId },
    data: {
      status: 'paid',
      paidAt: new Date(paid_at),
      paymentMethod: 'cash',
      metadata: {
        cashPaymentId: cashPayment.id,
        confirmationNumber: confirmation_number,
        paidVia: 'paynearme',
        retailLocation: retail_location?.name || 'Retail Location',
        amountPaid: amount_paid,
      },
    },
  });

  // Credit landlord wallet (minus the fee which goes to PayNearMe)
  const landlordId = cashPayment.property.landlord?.id;
  if (landlordId) {
    await creditLandlordWallet({
      landlordId,
      amount: Number(cashPayment.amount), // Rent amount without fee
      paymentMethod: 'cash',
      description: `Cash payment from ${cashPayment.tenant.name || 'Tenant'}`,
      referenceId: cashPayment.id,
      metadata: {
        type: 'cash_payment',
        confirmationNumber: confirmation_number,
        retailLocation: retail_location?.name,
      },
    });
  }

  // Create notification for tenant
  await prisma.notification.create({
    data: {
      userId: cashPayment.tenantId,
      type: 'payment',
      title: 'Cash Payment Received',
      message: `Your cash payment of $${Number(cashPayment.amount).toFixed(2)} has been received. Confirmation: ${confirmation_number}`,
      actionUrl: '/user/profile/rent-receipts',
    },
  });

  // Create notification for landlord
  if (cashPayment.property.landlord?.ownerUserId) {
    await prisma.notification.create({
      data: {
        userId: cashPayment.property.landlord.ownerUserId,
        type: 'payment',
        title: 'Cash Rent Payment Received',
        message: `${cashPayment.tenant.name || 'Tenant'} paid $${Number(cashPayment.amount).toFixed(2)} in cash at ${retail_location?.name || 'a retail location'}.`,
        actionUrl: '/admin/products',
      },
    });
  }

  revalidatePath('/user/profile/rent-receipts');
  revalidatePath('/admin/products');

  console.log('Cash payment processed successfully:', order_identifier);
}

async function handlePaymentFailed(payload: {
  order_identifier: string;
}) {
  const { order_identifier } = payload;

  await prisma.cashPayment.updateMany({
    where: {
      referenceId: order_identifier,
      status: 'pending',
    },
    data: {
      status: 'failed',
    },
  });

  console.log('Cash payment marked as failed:', order_identifier);
}

async function handleOrderExpired(payload: {
  order_identifier: string;
}) {
  const { order_identifier } = payload;

  await prisma.cashPayment.updateMany({
    where: {
      referenceId: order_identifier,
      status: 'pending',
    },
    data: {
      status: 'expired',
    },
  });

  console.log('Cash payment marked as expired:', order_identifier);
}

// Allow GET for webhook verification (some providers require this)
export async function GET(req: NextRequest) {
  const challenge = req.nextUrl.searchParams.get('challenge');
  if (challenge) {
    return NextResponse.json({ challenge });
  }
  return NextResponse.json({ status: 'ok' });
}
