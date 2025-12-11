import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { updateOrderToPaid } from '@/lib/actions/order-actions';
import { prisma } from '@/db/prisma';

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const signature = req.headers.get('stripe-signature') as string;

  const event = await Stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET as string
  );

  // Handle charge.succeeded for card payments and settled ACH payments
  if (event.type === 'charge.succeeded') {
    const charge = event.data.object as Stripe.Charge;

    if (charge.metadata?.orderId) {
      await updateOrderToPaid({
        orderId: charge.metadata.orderId,
        paymentResult: {
          id: charge.id,
          status: 'COMPLETED',
          email_address: charge.billing_details.email!,
          pricePaid: (charge.amount / 100).toFixed(),
        },
      });
    }

    const paymentIntentIdRaw = charge.payment_intent;
    const paymentIntentId =
      typeof paymentIntentIdRaw === 'string'
        ? paymentIntentIdRaw
        : paymentIntentIdRaw?.id;

    if (paymentIntentId) {
      const now = new Date();
      
      // Get payment method details from the charge
      const paymentMethodType = charge.payment_method_details?.type || 'unknown';
      const convenienceFee = charge.metadata?.convenienceFee 
        ? parseFloat(charge.metadata.convenienceFee) / 100 
        : 0;

      await prisma.rentPayment.updateMany({
        where: {
          stripePaymentIntentId: paymentIntentId,
        },
        data: {
          status: 'paid',
          paidAt: now,
          paymentMethod: paymentMethodType,
          convenienceFee: convenienceFee,
        },
      });
    }

    return NextResponse.json({
      message: 'Webhook processed: charge.succeeded',
    });
  }

  // Handle payment_intent.processing for ACH payments (takes 5-7 days)
  if (event.type === 'payment_intent.processing') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    if (paymentIntent.metadata?.type === 'rent_payment') {
      await prisma.rentPayment.updateMany({
        where: {
          stripePaymentIntentId: paymentIntent.id,
        },
        data: {
          status: 'processing',
        },
      });
    }

    return NextResponse.json({
      message: 'Webhook processed: payment_intent.processing',
    });
  }

  // Handle payment_intent.payment_failed for ACH failures
  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    if (paymentIntent.metadata?.type === 'rent_payment') {
      await prisma.rentPayment.updateMany({
        where: {
          stripePaymentIntentId: paymentIntent.id,
        },
        data: {
          status: 'failed',
        },
      });
    }

    return NextResponse.json({
      message: 'Webhook processed: payment_intent.payment_failed',
    });
  }

  return NextResponse.json({
    message: 'Webhook event not handled: ' + event.type,
  });
}
