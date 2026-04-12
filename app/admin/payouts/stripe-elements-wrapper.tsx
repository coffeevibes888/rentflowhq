'use client';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import SavedPayoutMethods from './saved-payout-methods';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function StripeElementsWrapper() {
  return (
    <Elements stripe={stripePromise}>
      <SavedPayoutMethods />
    </Elements>
  );
}

