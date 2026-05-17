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
  title: 'Beta Testers | PM Dashboard',
};

export const dynamic = 'force-dynamic';

export default async function PmBetaTestersPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/sign-in?callbackUrl=/admin/beta-testers');
  }

  const [allTesters, feedback, availability] = await Promise.all([
    getMyBetaTesterStatus(),
    getMyBetaFeedback(),
    getBetaProgramAvailability('pm'),
  ]);

  const pmTester = (allTesters ?? []).find((t) => t.audience === 'pm') ?? null;
  // Show only PM-side feedback on the PM page.
  const pmFeedback = (feedback ?? []).filter((f) => f.audience === 'pm');

  return (
    <BetaTestersPage
      audience='pm'
      testerRecord={pmTester}
      feedback={pmFeedback}
      programAvailability={availability}
      expectedCode='BETAPM2026'
    />
  );
}
