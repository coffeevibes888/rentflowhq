'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { AdvancedSearch } from '@/components/contractor-marketplace/advanced-search';
import { SearchResults } from '@/components/contractor-marketplace/search-results';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function ContractorsSearchClient() {
  const searchParams = useSearchParams();
  const [contractors, setContractors] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Parse initial filters from URL
  const getInitialFilters = () => {
    return {
      query: searchParams.get('query') || '',
      location: searchParams.get('location') || '',
      radius: parseInt(searchParams.get('radius') || '25'),
      serviceTypes: searchParams.get('serviceTypes')?.split(',').filter(Boolean) || [],
      minRating: parseFloat(searchParams.get('minRating') || '0'),
      maxPrice: parseInt(searchParams.get('maxPrice') || '10000'),
      verified: searchParams.get('verified') === 'true',
      licensed: searchParams.get('licensed') === 'true',
      insured: searchParams.get('insured') === 'true',
      backgroundChecked: searchParams.get('backgroundChecked') === 'true',
      minExperience: parseInt(searchParams.get('minExperience') || '0'),
      availability: searchParams.get('availability') || 'any',
      sortBy: searchParams.get('sortBy') || 'relevance',
    };
  };

  const fetchContractors = async (filters: any, page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'any' && value !== 0 && value !== false) {
          if (Array.isArray(value)) {
            if (value.length > 0) {
              params.set(key, value.join(','));
            }
          } else {
            params.set(key, String(value));
          }
        }
      });

      params.set('page', String(page));

      const response = await fetch(`/api/contractors/search?${params.toString()}`);
      const data = await response.json();

      setContractors(data.contractors || []);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching contractors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContractors(getInitialFilters());
  }, []);

  const handleSearch = (filters: any) => {
    fetchContractors(filters, 1);
  };

  const handlePageChange = (page: number) => {
    const filters = getInitialFilters();
    fetchContractors(filters, page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Find Contractors</h1>
          <p className="text-muted-foreground">
            Search and filter verified contractors for your project
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Search Filters */}
          <div className="lg:col-span-1">
            <AdvancedSearch
              onSearch={handleSearch}
              initialFilters={getInitialFilters()}
            />
          </div>

          {/* Main Content - Results */}
          <div className="lg:col-span-3 space-y-6">
            {/* Results Header */}
            {pagination && !isLoading && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} -{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} contractors
                </p>
              </div>
            )}

            {/* Results */}
            <SearchResults contractors={contractors} isLoading={isLoading} />

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && !isLoading && (
              <div className="flex items-center justify-center gap-2 pt-6">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={pagination.page === pageNum ? 'default' : 'outline'}
                        onClick={() => handlePageChange(pageNum)}
                        className="w-10"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasMore}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
