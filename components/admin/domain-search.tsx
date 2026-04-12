'use client';

import { useState } from 'react';
import { Search, Loader2, CheckCircle2, XCircle, DollarSign, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DomainPurchaseForm from './domain-purchase-form';

interface DomainAvailability {
  domain: string;
  available: boolean;
  price: number;
  currency: string;
  period?: number;
}

interface DomainSuggestion {
  domain: string;
  price: number;
  currency: string;
}

export default function DomainSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [availability, setAvailability] = useState<DomainAvailability | null>(null);
  const [suggestions, setSuggestions] = useState<DomainSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError('Please enter a domain name');
      return;
    }

    setIsSearching(true);
    setError(null);
    setAvailability(null);
    setSuggestions([]);

    try {
      // Search for the exact domain
      const searchResponse = await fetch(`/api/domains/search?domain=${encodeURIComponent(searchTerm)}`);
      if (!searchResponse.ok) {
        throw new Error('Failed to search domain');
      }
      const searchData = await searchResponse.json();
      setAvailability(searchData.availability);

      // Get suggestions
      const suggestionsResponse = await fetch(
        `/api/domains/search?domain=${encodeURIComponent(searchTerm)}&suggestions=true`
      );
      if (suggestionsResponse.ok) {
        const suggestionsData = await suggestionsResponse.json();
        setSuggestions(suggestionsData.suggestions || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search domain');
    } finally {
      setIsSearching(false);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(price);
  };

  return (
    <div className='space-y-4'>
      <div className='flex gap-2'>
        <div className='flex-1'>
          <input
            type='text'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder='Enter domain name (e.g., yourcompany)'
            className='w-full rounded-md border border-slate-300 px-3 py-2 text-sm'
          />
        </div>
        <Button
          onClick={handleSearch}
          disabled={isSearching}
          className='bg-slate-900 text-white hover:bg-slate-800'
        >
          {isSearching ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : (
            <Search className='h-4 w-4' />
          )}
        </Button>
      </div>

      {error && (
        <div className='rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800'>{error}</div>
      )}

      {availability && !showPurchaseForm && (
        <div className='rounded-lg border border-slate-200 bg-slate-50 p-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              {availability.available ? (
                <CheckCircle2 className='h-5 w-5 text-emerald-600' />
              ) : (
                <XCircle className='h-5 w-5 text-red-600' />
              )}
              <div>
                <p className='font-semibold text-slate-900'>{availability.domain}</p>
                <p className='text-xs text-slate-500'>
                  {availability.available ? 'Available for purchase' : 'Not available'}
                </p>
              </div>
            </div>
            {availability.available && (
              <div className='flex items-center gap-4'>
                <div className='text-right'>
                  <p className='font-semibold text-slate-900'>
                    {formatPrice(availability.price, availability.currency)}
                  </p>
                  <p className='text-xs text-slate-500'>per year</p>
                </div>
                <Button
                  onClick={() => setShowPurchaseForm(true)}
                  className='bg-emerald-600 text-white hover:bg-emerald-500'
                >
                  <ShoppingCart className='h-4 w-4 mr-2' />
                  Purchase
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {showPurchaseForm && availability && availability.available && (
        <DomainPurchaseForm
          domain={availability.domain}
          price={availability.price}
          currency={availability.currency}
          onCancel={() => setShowPurchaseForm(false)}
        />
      )}

      {suggestions.length > 0 && (
        <div className='space-y-2'>
          <p className='text-sm font-medium text-slate-700'>Alternative suggestions:</p>
          <div className='space-y-2'>
            {suggestions.slice(0, 5).map((suggestion) => (
              <div
                key={suggestion.domain}
                className='rounded-lg border border-slate-200 bg-white p-3 flex items-center justify-between hover:border-emerald-300 transition-colors'
              >
                <div className='flex items-center gap-2'>
                  <CheckCircle2 className='h-4 w-4 text-emerald-600' />
                  <span className='text-sm font-medium text-slate-900'>{suggestion.domain}</span>
                </div>
                <div className='flex items-center gap-2'>
                  <DollarSign className='h-4 w-4 text-slate-400' />
                  <span className='text-sm font-semibold text-slate-900'>
                    {formatPrice(suggestion.price, suggestion.currency)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

