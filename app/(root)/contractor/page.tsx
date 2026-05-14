import PricingSection from '@/components/home/pricing-section';
import AudienceSwitcher from '@/components/home/audience-switcher';
import ComparisonSection from '@/components/home/comparison-section';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import type { Metadata } from 'next';
import { ContractorLifecycleSection } from '@/components/home/contractor-lifecycle-section';

const CustomerReviews = dynamic(() => import('@/components/home/customer-reviews'));
const FAQSection = dynamic(() => import('@/components/home/faq-section'));
const NewsletterSignup = dynamic(() => import('@/components/home/newsletter-signup'));
const HomeContactCard = dynamic(() => import('@/components/home/home-contact-card'));
const ExitIntentPopup = dynamic(() => import('@/components/home/exit-intent-popup'));
const StickyTrialBar = dynamic(() => import('@/components/home/sticky-trial-bar'));

export const metadata: Metadata = {
  title: 'Property Flow HQ for Contractors — Run Your Entire Business, One Platform',
  description:
    'Jobs, invoices, leads, team scheduling, inventory, payroll, and your own branded marketplace profile — all in one platform built for contractors. Starting at $19.99/month.',
  alternates: { canonical: 'https://www.propertyflowhq.com/contractor' },
  openGraph: {
    title: 'Property Flow HQ for Contractors',
    description:
      'Run your entire business from one platform. Estimates, invoices, scheduling, crew, and payments.',
    url: 'https://www.propertyflowhq.com/contractor',
  },
};

// Stub PM sections — not shown on this page but AudienceSwitcher requires them
function PMLifecycleStub() { return null; }
function PMLeasePortalStub() { return null; }

export default function ContractorHomePage() {
  return (
    <>
      <main className='flex-1 w-full'>
        {/* Force contractor view — no tab bar needed, this IS the contractor page */}
        <Suspense fallback={null}>
          <AudienceSwitcher
            forceAudience="contractor"
            pmPricingSection={<PricingSection variant="pm" />}
            contractorPricingSection={<PricingSection variant="contractor" />}
            pmLifecycleSection={<PMLifecycleStub />}
            pmLeasePortalSection={<PMLeasePortalStub />}
            contractorLifecycleSection={<ContractorLifecycleSection />}
            pmComparisonSection={<ComparisonSection variant="pm" />}
            contractorComparisonSection={<ComparisonSection variant="contractor" />}
          />
        </Suspense>
        <CustomerReviews />
        <FAQSection />
        <NewsletterSignup />
      </main>
      <HomeContactCard />
      <ExitIntentPopup />
      <Suspense fallback={null}>
        <StickyTrialBar />
      </Suspense>
    </>
  );
}
