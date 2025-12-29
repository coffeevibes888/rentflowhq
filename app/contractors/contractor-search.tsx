'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ContractorSearchProps {
  initialQuery?: string;
  initialSpecialty?: string;
}

export default function ContractorSearch({ initialQuery, initialSpecialty }: ContractorSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery || '');
  const [location, setLocation] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (location) params.set('location', location);
    if (initialSpecialty) params.set('specialty', initialSpecialty);
    router.push(`/contractors?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="max-w-3xl mx-auto">
      <div className="flex flex-col md:flex-row gap-2 bg-white rounded-xl p-2 shadow-xl">
        <div className="flex-1 flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search contractors or services..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-slate-900 placeholder:text-slate-400"
          />
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg md:w-48">
          <MapPin className="h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="flex-1 bg-transparent outline-none text-slate-900 placeholder:text-slate-400"
          />
        </div>
        <Button 
          type="submit"
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 px-8"
        >
          Search
        </Button>
      </div>
    </form>
  );
}
