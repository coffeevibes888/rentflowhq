import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import AffiliateSettings from './affiliate-settings';

export const metadata: Metadata = {
  title: 'Affiliate Settings | Property Flow HQ',
  description: 'Manage your affiliate account settings and payment information',
};

export default async function AffiliateSettingsPage() {
  const session = await auth();
  
  if (!session?.user?.email) {
    redirect('/affiliate-program?login=required');
  }

  // Check if user is an affiliate
  const affiliate = await prisma.affiliate.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      code: true,
      paymentMethod: true,
      paymentEmail: true,
      paymentPhone: true,
      bankAccountLast4: true,
      minimumPayout: true,
      tier: true,
      commissionBasic: true,
      commissionPro: true,
      commissionEnterprise: true,
    },
  });

  if (!affiliate) {
    redirect('/affiliate-program?signup=required');
  }

  return (
    <AffiliateSettings 
      initialData={{
        ...affiliate,
        minimumPayout: Number(affiliate.minimumPayout),
        commissionBasic: Number(affiliate.commissionBasic),
        commissionPro: Number(affiliate.commissionPro),
        commissionEnterprise: Number(affiliate.commissionEnterprise),
      }} 
    />
  );
}
