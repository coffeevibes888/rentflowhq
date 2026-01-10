'use server';

import { prisma } from '@/db/prisma';
import { formatError } from '../utils';

export interface MarketplaceJob {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  budgetMin: number | null;
  budgetMax: number | null;
  isOpenBid: boolean;
  bidDeadline: Date | null;
  createdAt: Date;
  bidCount: number;
  homeowner: {
    name: string | null;
    city: string | null;
    state: string | null;
  };
}

export async function getMarketplaceJobs(options?: {
  category?: string;
  priority?: string;
  city?: string;
  state?: string;
  minBudget?: number;
  maxBudget?: number;
  sortBy?: 'newest' | 'budget_high' | 'budget_low' | 'deadline';
  limit?: number;
  offset?: number;
}) {
  try {
    const {
      category,
      priority,
      city,
      state,
      minBudget,
      maxBudget,
      sortBy = 'newest',
      limit = 20,
      offset = 0,
    } = options || {};

    // Build where clause - only show open jobs that are open for bidding
    const where: any = {
      status: 'open',
      isOpenBid: true,
    };

    if (category) {
      where.category = category;
    }

    if (priority) {
      where.priority = priority;
    }

    if (minBudget !== undefined) {
      where.budgetMax = { gte: minBudget };
    }

    if (maxBudget !== undefined) {
      where.budgetMin = { lte: maxBudget };
    }

    // Build orderBy
    let orderBy: any = { createdAt: 'desc' };
    switch (sortBy) {
      case 'budget_high':
        orderBy = { budgetMax: 'desc' };
        break;
      case 'budget_low':
        orderBy = { budgetMin: 'asc' };
        break;
      case 'deadline':
        orderBy = { bidDeadline: 'asc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    const [jobs, total] = await Promise.all([
      prisma.homeownerWorkOrder.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
        include: {
          homeowner: {
            select: {
              name: true,
              address: true,
            },
          },
          bids: {
            select: { id: true },
          },
        },
      }),
      prisma.homeownerWorkOrder.count({ where }),
    ]);

    // Transform and filter by location if needed
    let transformedJobs: MarketplaceJob[] = jobs.map((job) => {
      const address = job.homeowner.address as any;
      return {
        id: job.id,
        title: job.title,
        description: job.description,
        category: job.category,
        priority: job.priority,
        budgetMin: job.budgetMin ? Number(job.budgetMin) : null,
        budgetMax: job.budgetMax ? Number(job.budgetMax) : null,
        isOpenBid: job.isOpenBid,
        bidDeadline: job.bidDeadline,
        createdAt: job.createdAt,
        bidCount: job.bids.length,
        homeowner: {
          name: job.homeowner.name,
          city: address?.city || null,
          state: address?.state || null,
        },
      };
    });

    // Filter by location if specified
    if (city || state) {
      transformedJobs = transformedJobs.filter((job) => {
        if (city && job.homeowner.city) {
          if (!job.homeowner.city.toLowerCase().includes(city.toLowerCase())) {
            return false;
          }
        }
        if (state && job.homeowner.state) {
          if (!job.homeowner.state.toLowerCase().includes(state.toLowerCase())) {
            return false;
          }
        }
        return true;
      });
    }

    return { success: true, jobs: transformedJobs, total };
  } catch (error) {
    console.error('Failed to get marketplace jobs:', error);
    return { success: false, message: formatError(error), jobs: [], total: 0 };
  }
}

export async function getMarketplaceJobById(jobId: string) {
  try {
    const job = await prisma.homeownerWorkOrder.findUnique({
      where: { id: jobId },
      include: {
        homeowner: {
          select: {
            name: true,
            address: true,
            homeType: true,
            yearBuilt: true,
            squareFootage: true,
          },
        },
        bids: {
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!job) {
      return { success: false, message: 'Job not found' };
    }

    // Only show open jobs
    if (job.status !== 'open' || !job.isOpenBid) {
      return { success: false, message: 'This job is no longer accepting bids' };
    }

    const address = job.homeowner.address as any;

    return {
      success: true,
      job: {
        id: job.id,
        title: job.title,
        description: job.description,
        category: job.category,
        priority: job.priority,
        budgetMin: job.budgetMin ? Number(job.budgetMin) : null,
        budgetMax: job.budgetMax ? Number(job.budgetMax) : null,
        isOpenBid: job.isOpenBid,
        bidDeadline: job.bidDeadline,
        createdAt: job.createdAt,
        images: job.images,
        notes: job.notes,
        bidCount: job.bids.length,
        homeowner: {
          name: job.homeowner.name,
          city: address?.city || null,
          state: address?.state || null,
          homeType: job.homeowner.homeType,
          yearBuilt: job.homeowner.yearBuilt,
          squareFootage: job.homeowner.squareFootage,
        },
      },
    };
  } catch (error) {
    console.error('Failed to get marketplace job:', error);
    return { success: false, message: formatError(error) };
  }
}
