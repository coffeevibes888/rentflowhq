import { prisma } from '@/db/prisma';
import { Metadata } from 'next';
import Link from 'next/link';
import { Star, Shield, Clock, Wrench, Zap, Paintbrush, Thermometer, Hammer, Leaf, Home, Settings, Droplets } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ContractorSearch from './contractor-search';

export const metadata: Metadata = {
  title: 'Find Contractors | Property Flow HQ',
  description: 'Browse and hire verified contractors for your property maintenance needs',
};

const SPECIALTIES = [
  { name: 'Plumbing', icon: Droplets },
  { name: 'Electrical', icon: Zap },
  { name: 'HVAC', icon: Thermometer },
  { name: 'Carpentry', icon: Hammer },
  { name: 'Painting', icon: Paintbrush },
  { name: 'Roofing', icon: Home },
  { name: 'Landscaping', icon: Leaf },
  { name: 'General Repairs', icon: Wrench },
  { name: 'Appliance Repair', icon: Settings },
];

interface SearchParams {
  q?: string;
  specialty?: string;
  location?: string;
  sort?: string;
}

export default async function ContractorsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { q, specialty, sort } = params;

  // Build query
  const where: any = {
    userId: { not: null }, // Only show contractors with accounts
  };

  if (specialty) {
    where.specialties = { has: specialty };
  }

  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { specialties: { hasSome: [q] } },
    ];
  }

  // Fetch contractors with stats
  const contractors = await prisma.contractor.findMany({
    where,
    include: {
      user: {
        select: { id: true, name: true, image: true },
      },
      _count: {
        select: { workOrders: true },
      },
      workOrders: {
        where: { status: 'completed' },
        select: { id: true },
      },
    },
    take: 50,
  });

  // Calculate stats for each contractor
  const contractorsWithStats = contractors.map(c => ({
    ...c,
    completedJobs: c.workOrders.length,
    rating: 4.5 + Math.random() * 0.5, // Placeholder - would come from reviews
    responseTime: '< 1 hour', // Placeholder
  }));

  // Sort
  const sorted = [...contractorsWithStats].sort((a, b) => {
    if (sort === 'jobs') return b.completedJobs - a.completedJobs;
    if (sort === 'rating') return b.rating - a.rating;
    return 0; // Default: newest
  });

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-400 via-cyan-400 to-sky-600">
      {/* Hero Section */}
      <div className="pt-8 pb-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-4 text-white">
            Find the Perfect Contractor
          </h1>
          <p className="text-xl text-center text-white/90 mb-8 max-w-2xl mx-auto">
            Browse verified professionals for all your property maintenance needs
          </p>
          
          {/* Search Bar */}
          <ContractorSearch initialQuery={q} initialSpecialty={specialty} />
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Browse by Specialty</h2>
          {specialty && (
            <Link
              href="/contractors"
              className="px-4 py-1.5 rounded-full bg-white/90 text-slate-700 hover:bg-white text-sm font-medium transition-all"
            >
              ✕ Clear Filter
            </Link>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          {SPECIALTIES.map((spec) => {
            const Icon = spec.icon;
            const isActive = specialty === spec.name;
            return (
              <Link
                key={spec.name}
                href={`/contractors?specialty=${encodeURIComponent(spec.name)}`}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all
                  ${isActive 
                    ? 'bg-white text-blue-600 shadow-lg font-semibold' 
                    : 'bg-white/90 text-black font-semibold hover:bg-white backdrop-blur-sm'}
                `}
              >
                <Icon className="h-4 w-4" />
                {spec.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-6">
          <p className="text-white/90">
            {sorted.length} contractor{sorted.length !== 1 ? 's' : ''} available
            {specialty && ` for ${specialty}`}
          </p>
          <div className="flex gap-2">
            <Link href={`/contractors?${new URLSearchParams({ ...params, sort: 'rating' }).toString()}`}>
              <Button 
                variant={sort === 'rating' ? 'default' : 'outline'} 
                size="sm"
                className={sort === 'rating' 
                  ? 'bg-white text-blue-600 hover:bg-white/90' 
                  : 'bg-white/20 text-white border-white/30 hover:bg-white/30'}
              >
                Top Rated
              </Button>
            </Link>
            <Link href={`/contractors?${new URLSearchParams({ ...params, sort: 'jobs' }).toString()}`}>
              <Button 
                variant={sort === 'jobs' ? 'default' : 'outline'} 
                size="sm"
                className={sort === 'jobs' 
                  ? 'bg-white text-blue-600 hover:bg-white/90' 
                  : 'bg-white/20 text-white border-white/30 hover:bg-white/30'}
              >
                Most Jobs
              </Button>
            </Link>
          </div>
        </div>

        {sorted.length === 0 ? (
          <Card className="bg-white/80 backdrop-blur-sm border-white/20">
            <CardContent className="py-16">
              <div className="text-center">
                <Wrench className="h-16 w-16 mx-auto text-slate-400 mb-4" />
                <h3 className="text-xl font-semibold text-slate-700 mb-2">No contractors found</h3>
                <p className="text-slate-500 mb-4">Try adjusting your search or browse all categories</p>
                <Link href="/contractors">
                  <Button className="bg-gradient-to-r from-blue-600 to-cyan-500">View All Contractors</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sorted.map((contractor) => (
              <Link key={contractor.id} href={`/contractors/${contractor.id}`}>
                <Card className="h-full bg-white/90 backdrop-blur-sm border-white/20 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer overflow-hidden group">
                  {/* Header with gradient */}
                  <div className="h-20 bg-gradient-to-r from-blue-500 to-cyan-500 relative">
                    <div className="absolute -bottom-10 left-4">
                      <div className="h-20 w-20 rounded-full bg-white p-1 shadow-lg">
                        {contractor.user?.image ? (
                          <img 
                            src={contractor.user.image} 
                            alt={contractor.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white text-2xl font-bold">
                            {contractor.name.charAt(0)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <CardContent className="pt-12 pb-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {contractor.name}
                        </h3>
                        <div className="flex items-center gap-1 text-sm text-slate-500">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          <span className="font-medium text-slate-700">{contractor.rating.toFixed(1)}</span>
                          <span>({contractor.completedJobs} jobs)</span>
                        </div>
                      </div>
                      {contractor.isPaymentReady && (
                        <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-xs font-medium flex items-center gap-1">
                          <Shield className="h-3 w-3" /> Verified
                        </span>
                      )}
                    </div>

                    {/* Specialties */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {contractor.specialties.slice(0, 3).map((spec) => (
                        <span 
                          key={spec}
                          className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs"
                        >
                          {spec}
                        </span>
                      ))}
                      {contractor.specialties.length > 3 && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs">
                          +{contractor.specialties.length - 3} more
                        </span>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-slate-500 pt-3 border-t border-slate-200">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {contractor.responseTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <Wrench className="h-4 w-4" />
                        {contractor.completedJobs} completed
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="bg-slate-900/90 backdrop-blur-sm text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Are you a contractor?</h2>
          <p className="text-slate-300 mb-8 text-lg">
            Join our marketplace and connect with property managers looking for reliable professionals
          </p>
          <Link href="/sign-up?role=contractor">
            <Button size="lg" className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-90">
              Join as a Contractor
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
