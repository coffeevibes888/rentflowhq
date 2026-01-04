import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import SubscriptionSelectionClient from './subscription-selection-client';

export const metadata: Metadata = {
  title: 'Choose Your Plan | Property Flow HQ',
  description: 'Select the perfect plan for your property management needs',
};

export default async function LandlordSubscriptionPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  return <SubscriptionSelectionClient userName={session.user.name || 'there'} />;
}
