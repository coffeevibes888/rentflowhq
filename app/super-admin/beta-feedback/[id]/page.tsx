import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { requireSuperAdmin } from '@/lib/auth-guard';
import { getBetaFeedbackThread } from '@/lib/actions/super-admin-beta.actions';
import { BetaFeedbackThreadClient } from './beta-feedback-thread-client';

export const metadata: Metadata = {
  title: 'Beta Feedback Detail | Super Admin',
};

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BetaFeedbackThreadPage({ params }: PageProps) {
  await requireSuperAdmin();
  const { id } = await params;

  const thread = await getBetaFeedbackThread(id);
  if (!thread) notFound();

  return (
    <div className='p-4 sm:p-6 max-w-4xl mx-auto w-full text-slate-50'>
      <div className='mb-4'>
        <Link
          href='/super-admin/beta-feedback'
          className='inline-flex items-center gap-1 text-sm text-white/70 hover:text-white'
        >
          <ChevronLeft className='h-4 w-4' />
          Back to all feedback
        </Link>
      </div>
      <BetaFeedbackThreadClient thread={thread} />
    </div>
  );
}
