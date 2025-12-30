import { prisma } from '@/db/prisma';
import { Metadata } from 'next';
import Link from 'next/link';
import { Star, Shield, Clock, Wrench, Zap, Paintbrush, Thermometer, Hammer, Leaf, Home, Settings, Droplets } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ContractorSearch from './contractor-search';
import ContractorMarketplace from './contractor-marketplace';

export const metadata: Metadata = {
  title: 'Contractor Marketplace | Property Flow HQ',
  description: 'Browse verified contractors or find open jobs for your property maintenance needs',
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
  view?: string;
}

export default async function ContractorsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { q, specialty, sort, view } = params;

  // Build query for contractors
  const where: any = {
    userId: { not: null },
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
    rating: 4.5 + Math.random() * 0.5,
    responseTime: '< 1 hour',
  }));

  // Sort
  const sorted = [...contractorsWithStats].sort((a, b) => {
    if (sort === 'jobs') return b.completedJobs - a.completedJobs;
    if (sort === 'rating') return b.rating - a.rating;
    return 0;
  });

  // Fetch open jobs count for the badge
  const openJobsCount = await prisma.workOrder.count({
    where: {
      isOpenBid: true,
      status: 'open',
    },
  });

  return (
    <ContractorMarketplace
      initialView={view === 'jobs' ? 'jobs' : 'contractors'}
      contractors={sorted}
      openJobsCount={openJobsCount}
      searchParams={params}
      specialties={SPECIALTIES}
    />
  );
}
