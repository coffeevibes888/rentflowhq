import { Metadata } from 'next';
import { Suspense } from 'react';
import { requireSuperAdmin } from '@/lib/auth-guard';
import {
  getBetaInsights,
  listBetaFeedback,
} from '@/lib/actions/super-admin-beta.actions';
import { BetaFeedbackListClient } from './beta-feedback-list-client';

export const metadata: Metadata = {
  title: 'Beta Feedback | Super Admin',
};

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    audience?: string;
    status?: string;
    category?: string;
    featured?: string;
    q?: string;
  }>;
}

export default async function BetaFeedbackPage({ searchParams }: PageProps) {
  await requireSuperAdmin();

  const sp = await searchParams;
  const audience = (sp.audience as 'pm' | 'contractor' | 'all') || 'all';
  const status = (sp.status as any) || 'all';
  const category = sp.category || 'all';
  const featured = sp.featured === '1';
  const q = sp.q || '';

  const [insights, items] = await Promise.all([
    getBetaInsights(),
    listBetaFeedback({ audience, status, category, featured, query: q }),
  ]);

  return (
    <div className='p-4 sm:p-6 max-w-7xl mx-auto w-full'>
      <Suspense>
        <BetaFeedbackListClient
          insights={insights}
          items={items}
          initialFilters={{ audience, status, category, featured, query: q }}
        />
      </Suspense>
    </div>
  );
}
