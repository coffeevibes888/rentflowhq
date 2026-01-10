'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Search, 
  MapPin, 
  Star, 
  Shield, 
  Clock, 
  CheckCircle2,
  SlidersHorizontal,
  Grid3X3,
  List,
  Briefcase,
  User,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface ContractorProfile {
  id: string;
  slug: string;
  businessName: string;
  displayName: string;
  tagline: string | null;
  profilePhoto: string | null;
  coverPhoto: string | null;
  portfolioImages: string[];
  specialties: string[];
  baseCity: string | null;
  baseState: string | null;
  yearsExperience: number | null;
  hourlyRate: any;
  avgRating: number;
  totalReviews: number;
  completedJobs: number;
  isAvailable: boolean;
  insuranceVerified: boolean;
  backgroundChecked: boolean;
  licenseNumber: string | null;
}

interface ContractorMarketplaceClientProps {
  initialContractors: ContractorProfile[];
  total: number;
  searchParams: {
    specialty?: string;
    city?: string;
    state?: string;
    minRating?: string;
    sortBy?: string;
  };
}

const SPECIALTIES = [
  'All Specialties',
  'Plumbing',
  'Electrical',
  'HVAC',
  'Carpentry',
  'Painting',
  'Roofing',
  'Landscaping',
  'General Repairs',
  'Appliance Repair',
  'Flooring',
];

const SORT_OPTIONS = [
  { value: 'rank', label: 'Best Match' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'reviews', label: 'Most Reviews' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
];

export function ContractorMarketplaceClient({ 
  initialContractors, 
  total,
  searchParams 
}: ContractorMarketplaceClientProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState(searchParams.city || '');
  const [specialty, setSpecialty] = useState(searchParams.specialty || 'All Specialties');
  const [sortBy, setSortBy] = useState(searchParams.sortBy || 'rank');

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('city', searchQuery);
    if (specialty && specialty !== 'All Specialties') params.set('specialty', specialty);
    if (sortBy !== 'rank') params.set('sortBy', sortBy);
    router.push(`/marketplace?${params.toString()}`);
  };

  const formatPrice = (price: any) => {
    if (!price) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(Number(price));
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="flex justify-center gap-4 mb-6">
            <Link href="/marketplace">
              <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0">
                <User className="h-4 w-4 mr-2" />
                Find Contractors
              </Button>
            </Link>
            <Link href="/marketplace/jobs">
              <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/30 border">
                <Briefcase className="h-4 w-4 mr-2" />
                Browse Jobs
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-4">
            Find Trusted Contractors
          </h1>
          <p className="text-violet-100 text-center mb-8 max-w-2xl mx-auto">
            Browse {total} verified contractors. Read reviews, compare rates, and request quotes.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-2">
              <div className="flex flex-col md:flex-row gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search by city or zip code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                    className="pl-12 h-14 text-lg border-0 bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                </div>
                <Select value={specialty} onValueChange={setSpecialty}>
                  <SelectTrigger className="w-full md:w-48 h-14 border-0 bg-slate-100 dark:bg-slate-700">
                    <SelectValue placeholder="Specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPECIALTIES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  size="lg" 
                  className="h-14 px-8 bg-violet-600 hover:bg-violet-700"
                  onClick={applyFilters}
                >
                  Search
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">{total} contractors</span>
            </div>
            <div className="flex items-center gap-3">
              <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setTimeout(applyFilters, 0); }}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex border rounded-lg overflow-hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn('rounded-none', viewMode === 'grid' && 'bg-slate-100 dark:bg-slate-800')}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn('rounded-none', viewMode === 'list' && 'bg-slate-100 dark:bg-slate-800')}
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {initialContractors.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
              <Briefcase className="h-12 w-12 text-slate-400" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">No contractors found</h2>
            <p className="text-slate-500 mb-6">Try adjusting your search or filters</p>
            <Button onClick={() => router.push('/marketplace')}>Clear Filters</Button>
          </div>
        ) : (
          <div className={cn(
            viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'flex flex-col gap-4'
          )}>
            {initialContractors.map((contractor) => (
              <ContractorCard 
                key={contractor.id} 
                contractor={contractor} 
                viewMode={viewMode}
                formatPrice={formatPrice}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ContractorCard({ 
  contractor, 
  viewMode,
  formatPrice 
}: { 
  contractor: ContractorProfile; 
  viewMode: 'grid' | 'list';
  formatPrice: (price: any) => string | null;
}) {
  const coverImage = contractor.coverPhoto || contractor.portfolioImages[0] || '/images/contractor-default.jpg';
  const profileUrl = `/marketplace/contractor/${contractor.slug}`;

  if (viewMode === 'list') {
    return (
      <Link href={profileUrl}>
        <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex flex-col md:flex-row">
            <div className="relative w-full md:w-64 h-48 md:h-auto flex-shrink-0">
              <Image
                src={coverImage}
                alt={contractor.businessName}
                fill
                className="object-cover"
              />
              {/* Profile photo overlay */}
              <div className="absolute bottom-3 left-3">
                <div className="h-16 w-16 rounded-full border-4 border-white overflow-hidden bg-slate-200">
                  {contractor.profilePhoto ? (
                    <Image src={contractor.profilePhoto} alt="" fill className="object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <User className="h-8 w-8 text-slate-400" />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <CardContent className="flex-1 p-5">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-lg hover:text-violet-600 transition-colors">
                    {contractor.businessName}
                  </h3>
                  {contractor.tagline && (
                    <p className="text-sm text-slate-500">{contractor.tagline}</p>
                  )}
                  {(contractor.baseCity || contractor.baseState) && (
                    <p className="text-slate-500 flex items-center gap-1 text-sm mt-1">
                      <MapPin className="h-4 w-4" />
                      {[contractor.baseCity, contractor.baseState].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  {contractor.hourlyRate && (
                    <p className="text-xl font-bold text-violet-600">
                      {formatPrice(contractor.hourlyRate)}<span className="text-sm font-normal">/hr</span>
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm mb-3">
                <span className="flex items-center gap-1 text-amber-500">
                  <Star className="h-4 w-4 fill-current" />
                  {contractor.avgRating.toFixed(1)}
                  <span className="text-slate-400">({contractor.totalReviews} reviews)</span>
                </span>
                {contractor.completedJobs > 0 && (
                  <span className="text-slate-500">
                    {contractor.completedJobs} jobs completed
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-1 mb-3">
                {contractor.specialties.slice(0, 4).map((s) => (
                  <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                ))}
                {contractor.specialties.length > 4 && (
                  <Badge variant="secondary" className="text-xs">+{contractor.specialties.length - 4}</Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                {contractor.licenseNumber && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Licensed
                  </Badge>
                )}
                {contractor.insuranceVerified && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <Shield className="h-3 w-3 text-blue-500" /> Insured
                  </Badge>
                )}
                {contractor.backgroundChecked && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Background Checked
                  </Badge>
                )}
              </div>
            </CardContent>
          </div>
        </Card>
      </Link>
    );
  }

  // Grid view - card style similar to property listings
  return (
    <Link href={profileUrl}>
      <Card className="overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 group cursor-pointer h-full">
        <div className="relative aspect-[4/3]">
          <Image
            src={coverImage}
            alt={contractor.businessName}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Profile photo - positioned at top like listing cards */}
          <div className="absolute top-3 left-3">
            <div className="h-14 w-14 rounded-full border-3 border-white overflow-hidden bg-slate-200 shadow-lg">
              {contractor.profilePhoto ? (
                <Image src={contractor.profilePhoto} alt="" fill className="object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <User className="h-7 w-7 text-slate-400" />
                </div>
              )}
            </div>
          </div>

          {/* Badges */}
          <div className="absolute top-3 right-3 flex flex-col gap-1">
            {contractor.isAvailable && (
              <Badge className="bg-emerald-500 text-white text-xs">Available</Badge>
            )}
          </div>

          {/* Rating and price at bottom */}
          <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
            <div className="flex items-center gap-1 bg-black/60 rounded-full px-2 py-1">
              <Star className="h-4 w-4 text-amber-400 fill-current" />
              <span className="text-white text-sm font-medium">{contractor.avgRating.toFixed(1)}</span>
              <span className="text-white/70 text-xs">({contractor.totalReviews})</span>
            </div>
            {contractor.hourlyRate && (
              <p className="text-white text-lg font-bold">
                {formatPrice(contractor.hourlyRate)}<span className="text-sm font-normal">/hr</span>
              </p>
            )}
          </div>
        </div>
        
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg mb-1 hover:text-violet-600 transition-colors line-clamp-1">
            {contractor.businessName}
          </h3>
          {contractor.tagline && (
            <p className="text-sm text-slate-500 line-clamp-1 mb-2">{contractor.tagline}</p>
          )}
          {(contractor.baseCity || contractor.baseState) && (
            <p className="text-slate-500 flex items-center gap-1 text-sm mb-3">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              {[contractor.baseCity, contractor.baseState].filter(Boolean).join(', ')}
            </p>
          )}
          
          <div className="flex flex-wrap gap-1 mb-3">
            {contractor.specialties.slice(0, 3).map((s) => (
              <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
            ))}
            {contractor.specialties.length > 3 && (
              <Badge variant="secondary" className="text-xs">+{contractor.specialties.length - 3}</Badge>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs">
            {contractor.licenseNumber && (
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="h-3 w-3" /> Licensed
              </span>
            )}
            {contractor.insuranceVerified && (
              <span className="flex items-center gap-1 text-blue-600">
                <Shield className="h-3 w-3" /> Insured
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
