import { Metadata } from 'next';
import { getMarketplaceJobs } from '@/lib/actions/marketplace-jobs.actions';
import { JobsMarketplaceClient } from './jobs-marketplace-client';

export const metadata: Metadata = {
  title: 'Job Marketplace | Find Work',
  description: 'Browse available jobs posted by homeowners. Find work opportunities and submit bids.',
};

interface JobsMarketplacePageProps {
  searchParams?: Promise<{
    category?: string;
    priority?: string;
    city?: string;
    state?: string;
    sortBy?: string;
  }>;
}

export default async function JobsMarketplacePage({ searchParams }: JobsMarketplacePageProps) {
  const params = await searchParams || {};
  
  const result = await getMarketplaceJobs({
    category: params.category,
    priority: params.priority,
    city: params.city,
    state: params.state,
    sortBy: params.sortBy as any,
    limit: 24,
  });

  return (
    <JobsMarketplaceClient 
      initialJobs={result.jobs || []}
      total={result.total || 0}
      searchParams={params}
    />
  );
}
