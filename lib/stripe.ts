import Stripe from 'stripe';

export const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || process.env.STRIPE_TEST_SECRET_KEY || '',
  {
    apiVersion: '2025-02-24.acacia',
    typescript: true,
  }
);
