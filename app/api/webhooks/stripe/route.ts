import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { updateOrderToPaid } from '@/lib/actions/order-actions';
import { prisma } from '@/db/prisma';
import { SUBSCRIPTION_TIERS, SubscriptionTier } from '@/lib/config/subscription-tiers';
import { NotificationService } from '@/lib/services/notification-service';

/**
 * Stripe Webhook Handler
 * 
 * DIRECT PAYMENT MODEL:
 * - Rent payments go directly to landlord's Connect account
 * - No wallet crediting needed - landlord receives funds immediately
 * - We just update payment status and send notifications
 */

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

  // Handle successful charges
  if (event.type === 'charge.succeeded') {
    const charge = event.data.object as Stripe.Charge;
    const amountPaid = charge.amount / 100;
    const now = new Date();
    const paymentMethodType = charge.payment_method_details?.type || 'unknown';

    // Handle rent payments (new partial payment logic)
    const rentPaymentId = charge.metadata?.rentPaymentId;
    const paymentIntentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id;

    if (rentPaymentId) {
      try {
        await prisma.$transaction(async (tx) => {
          const rentPayment = await tx.rentPayment.findUnique({
            where: { id: rentPaymentId },
            include: { lease: { include: { unit: { include: { property: { include: { landlord: { include: { owner: true } } } } } } } }, tenant: true }
          });

          if (!rentPayment) {
            throw new Error(`RentPayment with ID ${rentPaymentId} not found.`);
          }

          // 1. Create the transaction record
          await tx.paymentTransaction.create({
            data: {
              rentPaymentId: rentPayment.id,
              amount: amountPaid,
              status: 'succeeded',
              method: paymentMethodType,
              referenceId: charge.id,
            },
          });

          // 2. Update the RentPayment itself
          const newAmountPaid = Number(rentPayment.amountPaid) + amountPaid;
          const totalAmountDue = Number(rentPayment.amount);
          
          let newStatus = rentPayment.status;
          if (newAmountPaid >= totalAmountDue) {
            newStatus = 'paid';
          } else if (newAmountPaid > 0) {
            newStatus = 'partially_paid';
          }

          await tx.rentPayment.update({
            where: { id: rentPaymentId },
            data: {
              amountPaid: newAmountPaid,
              status: newStatus,
              paidAt: newStatus === 'paid' ? now : null, // Only set paidAt when fully paid
              paymentMethod: paymentMethodType,
            },
          });

          // 3. Send notification
          const landlord = rentPayment.lease.unit.property.landlord;
          if (landlord?.owner?.id && landlord.id) {
            await NotificationService.createNotification({
              userId: landlord.owner.id,
              type: 'payment',
              title: 'Rent Payment Received',
              message: `Partial payment of ${formatCurrency(amountPaid)} received from ${rentPayment.tenant.name}. Total paid: ${formatCurrency(newAmountPaid)} of ${formatCurrency(totalAmountDue)}.`,
              actionUrl: `/admin/analytics`,
              metadata: { paymentId: rentPayment.id, leaseId: rentPayment.leaseId },
              landlordId: landlord.id,
            });
          }
        });
      } catch (error) {
         console.error('Error processing partial rent payment:', error);
         // Return 500 to signal Stripe to retry the webhook
         return NextResponse.json({ message: 'Failed to process partial payment webhook' }, { status: 500 });
      }
    } else if (paymentIntentId) {
      // Fallback for older logic or payments not using the new flow
      await prisma.rentPayment.updateMany({
        where: { stripePaymentIntentId: paymentIntentId },
        data: { status: 'paid', paidAt: now, paymentMethod: paymentMethodType },
      });
    }

    // Handle e-commerce orders
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

    return NextResponse.json({
      message: 'Webhook processed: charge.succeeded',
    });
  }

  // Handle payment processing (ACH takes time)
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

  // Handle failed payments
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

  // Handle subscription events
  if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription;
    const landlordId = subscription.metadata?.landlordId;
    const tier = (subscription.metadata?.tier || 'starter') as SubscriptionTier;
    const affiliateCode = subscription.metadata?.affiliateCode;

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

      // Handle affiliate commission for new subscriptions
      if (event.type === 'customer.subscription.created' && affiliateCode) {
        try {
          const affiliate = await prisma.affiliate.findUnique({
            where: { code: affiliateCode },
          });

          if (affiliate && affiliate.status === 'active') {
            const existingReferral = await prisma.affiliateReferral.findUnique({
              where: { landlordId },
            });

            if (!existingReferral) {
              let commissionAmount = 0;
              let subscriptionPrice = 0;
              
              if (tier === 'starter') {
                commissionAmount = Number(affiliate.commissionBasic);
                subscriptionPrice = 19.99;
              } else if (tier === 'pro') {
                commissionAmount = Number(affiliate.commissionPro);
                subscriptionPrice = 39.99;
              } else if (tier === 'enterprise') {
                commissionAmount = Number(affiliate.commissionEnterprise);
                subscriptionPrice = 79.99;
              }

              if (commissionAmount > 0) {
                const pendingUntil = new Date();
                pendingUntil.setDate(pendingUntil.getDate() + 30);

                await prisma.affiliateReferral.create({
                  data: {
                    affiliateId: affiliate.id,
                    landlordId,
                    subscriptionTier: tier,
                    subscriptionPrice,
                    commissionAmount,
                    commissionStatus: 'pending',
                    pendingUntil,
                  },
                });

                await prisma.affiliate.update({
                  where: { id: affiliate.id },
                  data: {
                    totalSignups: { increment: 1 },
                    totalEarnings: { increment: commissionAmount },
                    pendingEarnings: { increment: commissionAmount },
                  },
                });
              }
            }
          }
        } catch (affiliateError) {
          console.error('Error processing affiliate commission:', affiliateError);
        }
      }
    }

    return NextResponse.json({
      message: `Webhook processed: ${event.type}`,
    });
  }

  // Handle subscription cancellation
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription;
    const landlordId = subscription.metadata?.landlordId;

    if (landlordId) {
      await prisma.landlordSubscription.update({
        where: { landlordId },
        data: {
          status: 'canceled',
          canceledAt: new Date(),
          tier: 'starter',
          unitLimit: 24,
          freeBackgroundChecks: false,
          freeEvictionChecks: false,
          freeEmploymentVerification: false,
        },
      });

      await prisma.landlord.update({
        where: { id: landlordId },
        data: {
          subscriptionTier: 'starter',
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
          toTier: 'starter',
          stripeEventId: event.id,
        },
      });
    }

    return NextResponse.json({
      message: 'Webhook processed: customer.subscription.deleted',
    });
  }

  // Handle successful invoice payments (subscription renewals)
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

  // Handle failed invoice payments
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
    
    // Find landlord or contractor by Connect account ID
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

      console.log(`Landlord Connect account ${account.id} updated: ${newStatus}`);
    }

    // Also check contractors
    const contractor = await prisma.contractor.findFirst({
      where: { stripeConnectAccountId: account.id },
    });

    if (contractor) {
      const isPaymentReady = account.payouts_enabled || false;
      
      await prisma.contractor.update({
        where: { id: contractor.id },
        data: { isPaymentReady },
      });

      console.log(`Contractor Connect account ${account.id} updated: paymentReady=${isPaymentReady}`);
    }

    return NextResponse.json({
      message: 'Webhook processed: account.updated',
    });
  }

  // Handle transfer events (for contractor payments)
  if (event.type === 'transfer.created') {
    const transfer = event.data.object as Stripe.Transfer;
    
    if (transfer.metadata?.type === 'contractor_payout') {
      console.log(`Contractor transfer created: ${transfer.id} for ${transfer.amount / 100}`);
    }

    return NextResponse.json({
      message: 'Webhook processed: transfer.created',
    });
  }

  return NextResponse.json({
    message: 'Webhook event not handled: ' + event.type,
  });
}
