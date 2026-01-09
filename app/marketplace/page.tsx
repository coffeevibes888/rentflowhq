import { Metadata } from 'next';
import { getMarketplaceContractors } from '@/lib/actions/contractor-profile.actions';
import { ContractorMarketplaceClient } from './marketplace-client';

export const metadata: Metadata = {
  title: 'Contractor Marketplace | Find Trusted Contractors',
  description: 'Browse verified contractors for your property maintenance and repair needs. Read reviews, compare rates, and request quotes.',
};

interface MarketplacePageProps {
  searchParams?: Promise<{
    specialty?: string;
    city?: string;
    state?: string;
    minRating?: string;
    sortBy?: string;
  }>;
}

export default async function MarketplacePage({ searchParams }: MarketplacePageProps) {
  const params = await searchParams || {};
  
  const result = await getMarketplaceContractors({
    specialty: params.specialty,
    city: params.city,
    state: params.state,
    minRating: params.minRating ? parseFloat(params.minRating) : undefined,
    sortBy: params.sortBy as any,
    limit: 24,
  });

  return (
    <ContractorMarketplaceClient 
      initialContractors={result.contractors || []}
      total={result.total || 0}
      searchParams={params}
    />
  );
}
