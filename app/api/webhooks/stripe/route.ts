import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { updateOrderToPaid } from '@/lib/actions/order-actions';
import { prisma } from '@/db/prisma';
import { SUBSCRIPTION_TIERS, SubscriptionTier } from '@/lib/config/subscription-tiers';
import { NotificationService } from '@/lib/services/notification-service';
import { creditLandlordWallet } from '@/lib/services/wallet.service';

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const signature = req.headers.get('stripe-signature') as string;

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret || !signature) {
    return NextResponse.json({ message: 'Missing Stripe webhook configuration' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = Stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch {
    return NextResponse.json({ message: 'Invalid Stripe webhook signature' }, { status: 400 });
  }

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
      
      const paymentMethodType = charge.payment_method_details?.type || 'unknown';
      const convenienceFee = charge.metadata?.convenienceFee 
        ? parseFloat(charge.metadata.convenienceFee) / 100 
        : 0;

      const updatedPayments = await prisma.rentPayment.findMany({
        where: {
          stripePaymentIntentId: paymentIntentId,
        },
        include: {
          lease: {
            include: {
              unit: {
                include: {
                  property: {
                    include: {
                      landlord: {
                        include: {
                          owner: {
                            select: { id: true },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          tenant: {
            select: { id: true, name: true },
          },
        },
      });

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

      // Notify landlord about successful payment
      for (const payment of updatedPayments) {
        const landlordId = payment.lease.unit.property.landlordId;
        const landlord = payment.lease.unit.property.landlord;
        
        if (landlord?.owner?.id && landlordId) {
          await NotificationService.createNotification({
            userId: landlord.owner.id,
            type: 'payment',
            title: 'Rent Payment Received',
            message: `Payment of $${payment.amount.toFixed(2)} received from ${payment.tenant.name} for ${payment.lease.unit.property.name} - ${payment.lease.unit.name}`,
            actionUrl: `/admin/analytics`,
            metadata: { paymentId: payment.id, leaseId: payment.leaseId },
            landlordId,
          });

          // Credit landlord wallet
          await creditLandlordWallet({
            landlordId,
            amount: Number(payment.amount),
            paymentMethod: paymentMethodType,
            description: `Rent payment from ${payment.tenant.name || 'Tenant'}`,
            referenceId: payment.id,
            metadata: {
              type: 'rent_payment',
              leaseId: payment.leaseId,
              unitName: payment.lease.unit.name,
              propertyName: payment.lease.unit.property.name,
            },
          });
        }
      }
    }

    return NextResponse.json({
      message: 'Webhook processed: charge.succeeded',
    });
  }

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

  if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription;
    const landlordId = subscription.metadata?.landlordId;
    const tier = (subscription.metadata?.tier || 'free') as SubscriptionTier;

    if (landlordId) {
      const tierConfig = SUBSCRIPTION_TIERS[tier];

      await prisma.landlordSubscription.upsert({
        where: { landlordId },
        create: {
          landlordId,
          tier,
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id,
          stripePriceId: subscription.items.data[0]?.price?.id,
          status: subscription.status,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          unitLimit: tierConfig.unitLimit === Infinity ? 999999 : tierConfig.unitLimit,
          freeBackgroundChecks: tierConfig.features.freeBackgroundChecks,
          freeEvictionChecks: tierConfig.features.freeEvictionChecks,
          freeEmploymentVerification: tierConfig.features.freeEmploymentVerification,
        },
        update: {
          tier,
          stripeSubscriptionId: subscription.id,
          stripePriceId: subscription.items.data[0]?.price?.id,
          status: subscription.status,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          unitLimit: tierConfig.unitLimit === Infinity ? 999999 : tierConfig.unitLimit,
          freeBackgroundChecks: tierConfig.features.freeBackgroundChecks,
          freeEvictionChecks: tierConfig.features.freeEvictionChecks,
          freeEmploymentVerification: tierConfig.features.freeEmploymentVerification,
        },
      });

      await prisma.landlord.update({
        where: { id: landlordId },
        data: {
          subscriptionTier: tier,
          stripeSubscriptionId: subscription.id,
          subscriptionStatus: subscription.status,
          freeBackgroundChecks: tierConfig.features.freeBackgroundChecks,
          freeEmploymentVerification: tierConfig.features.freeEmploymentVerification,
        },
      });

      await prisma.subscriptionEvent.create({
        data: {
          landlordId,
          eventType: event.type === 'customer.subscription.created' ? 'upgrade' : 'updated',
          toTier: tier,
          stripeEventId: event.id,
          metadata: {
            subscriptionId: subscription.id,
            status: subscription.status,
          },
        },
      });
    }

    return NextResponse.json({
      message: `Webhook processed: ${event.type}`,
    });
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription;
    const landlordId = subscription.metadata?.landlordId;

    if (landlordId) {
      await prisma.landlordSubscription.update({
        where: { landlordId },
        data: {
          status: 'canceled',
          canceledAt: new Date(),
          tier: 'free',
          unitLimit: 24,
          freeBackgroundChecks: false,
          freeEvictionChecks: false,
          freeEmploymentVerification: false,
        },
      });

      await prisma.landlord.update({
        where: { id: landlordId },
        data: {
          subscriptionTier: 'free',
          subscriptionStatus: 'canceled',
          freeBackgroundChecks: false,
          freeEmploymentVerification: false,
        },
      });

      await prisma.subscriptionEvent.create({
        data: {
          landlordId,
          eventType: 'canceled',
          fromTier: subscription.metadata?.tier,
          toTier: 'free',
          stripeEventId: event.id,
        },
      });
    }

    return NextResponse.json({
      message: 'Webhook processed: customer.subscription.deleted',
    });
  }

  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as Stripe.Invoice;
    
    if (invoice.subscription && invoice.metadata?.landlordId) {
      await prisma.subscriptionEvent.create({
        data: {
          landlordId: invoice.metadata.landlordId,
          eventType: 'renewed',
          amount: invoice.amount_paid / 100,
          stripeEventId: event.id,
          metadata: {
            invoiceId: invoice.id,
            subscriptionId: invoice.subscription,
          },
        },
      });
    }

    return NextResponse.json({
      message: 'Webhook processed: invoice.payment_succeeded',
    });
  }

  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice;
    
    if (invoice.subscription && invoice.metadata?.landlordId) {
      const landlordId = invoice.metadata.landlordId;

      await prisma.landlordSubscription.update({
        where: { landlordId },
        data: { status: 'past_due' },
      });

      await prisma.landlord.update({
        where: { id: landlordId },
        data: { subscriptionStatus: 'past_due' },
      });

      await prisma.subscriptionEvent.create({
        data: {
          landlordId,
          eventType: 'payment_failed',
          stripeEventId: event.id,
          metadata: {
            invoiceId: invoice.id,
            subscriptionId: invoice.subscription,
          },
        },
      });
    }

    return NextResponse.json({
      message: 'Webhook processed: invoice.payment_failed',
    });
  }

  // Handle Stripe Connect account updates
  if (event.type === 'account.updated') {
    const account = event.data.object as Stripe.Account;
    
    // Find landlord by Connect account ID
    const landlord = await prisma.landlord.findFirst({
      where: { stripeConnectAccountId: account.id },
    });

    if (landlord) {
      const isOnboarded = account.details_submitted || false;
      const canReceivePayouts = account.payouts_enabled || false;
      const newStatus = isOnboarded ? (canReceivePayouts ? 'active' : 'pending_verification') : 'pending';

      await prisma.landlord.update({
        where: { id: landlord.id },
        data: { stripeOnboardingStatus: newStatus },
      });

      console.log(`Connect account ${account.id} updated: ${newStatus}`);
    }

    return NextResponse.json({
      message: 'Webhook processed: account.updated',
    });
  }

  return NextResponse.json({
    message: 'Webhook event not handled: ' + event.type,
  });
}
