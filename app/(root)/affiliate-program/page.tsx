import { Metadata } from 'next';
import AffiliateProgramClient from './affiliate-program-client';

export const metadata: Metadata = {
  title: 'Affiliate Program | Property Flow HQ',
  description: 'Join the Property Flow HQ Affiliate Program. Earn commissions by referring property managers and landlords to our platform.',
  openGraph: {
    title: 'Affiliate Program | Property Flow HQ',
    description: 'Earn up to $25 per referral. Join our affiliate program and help property managers discover better tools.',
  },
};

export default function AffiliateProgramPage() {
  return <AffiliateProgramClient />;
}
