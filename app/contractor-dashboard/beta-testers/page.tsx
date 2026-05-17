import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import {
  getMyBetaTesterStatus,
  getMyBetaFeedback,
  getBetaProgramAvailability,
} from '@/lib/actions/beta-tester.actions';
import { BetaTestersPage } from '@/components/beta/beta-testers-page';

export const metadata: Metadata = {
  title: 'Beta Testers | Contractor Dashboard',
};

export const dynamic = 'force-dynamic';

export default async function ContractorBetaTestersPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/sign-in?callbackUrl=/contractor-dashboard/beta-testers');
  }

  const [allTesters, feedback, availability] = await Promise.all([
    getMyBetaTesterStatus(),
    getMyBetaFeedback(),
    getBetaProgramAvailability('contractor'),
  ]);

  const contractorTester =
    (allTesters ?? []).find((t) => t.audience === 'contractor') ?? null;
  const contractorFeedback = (feedback ?? []).filter((f) => f.audience === 'contractor');

  return (
    <BetaTestersPage
      audience='contractor'
      testerRecord={contractorTester}
      feedback={contractorFeedback}
      programAvailability={availability}
      expectedCode='BETACON2026'
    />
  );
}
