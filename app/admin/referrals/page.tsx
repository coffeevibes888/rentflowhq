import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import ReferralDashboard from '@/components/admin/referral-dashboard';

export const metadata = {
  title: 'Referral Program',
  description: 'Earn rewards by referring other landlords',
};

export default async function ReferralsPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  // Get landlord for this user
  const landlord = await prisma.landlord.findFirst({
    where: { ownerUserId: session.user.id },
    select: { id: true },
  });

  if (!landlord) {
    redirect('/onboarding');
  }

  return (
    <div className='container mx-auto py-8 px-4 max-w-4xl'>
      <ReferralDashboard landlordId={landlord.id} />
    </div>
  );
}
