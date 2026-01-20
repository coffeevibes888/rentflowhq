import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth-guard';
import { prisma } from '@/db/prisma';
import {
  Building2,
  FileText,
  Wrench,
  DollarSign,
  Wallet,
  MessageCircle,
} from 'lucide-react';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { adminNavLinks } from '@/lib/constants/admin-nav';
import { formatCurrency } from '@/lib/utils';
import { cookies } from 'next/headers';
import { SERVER_URL } from '@/lib/constants';
import ShareListingCard from '@/components/admin/share-listing-card';
import ShareContractorCard from '@/components/admin/share-contractor-card';
import { unstable_cache } from 'next/cache';

export const metadata: Metadata = {
  title: 'Property Dashboard',
};

// Cache dashboard stats for 60 seconds to reduce DB load
const getCachedDashboardStats = unstable_cache(
  async (landlordId: string, startOfMonth: Date, startOfYear: Date) => {
    const prismaAny = prisma as any;
    
    const [
      propertiesCount,
      applicationsCount,
      tenantsCount,
      ticketsCount,
      totalUnits,
      occupiedUnits,
      urgentTickets,
      rentPaidThisMonth,
      rentPaidYtd,
      scheduledRent,
      unpaidRent,
    ] = await Promise.all([
      prisma.property.count({ where: { landlordId } }),
      prisma.rentalApplication.count({
        where: { unit: { property: { landlordId } } },
      }),
      prisma.user.count({
        where: {
          role: 'tenant',
          leasesAsTenant: { some: { unit: { property: { landlordId } } } },
        },
      }),
      prisma.maintenanceTicket.count({
        where: { unit: { property: { landlordId } } },
      }),
      prisma.unit.count({ where: { property: { landlordId } } }),
      prisma.lease.count({
        where: { status: 'active', unit: { property: { landlordId } } },
      }),
      prisma.maintenanceTicket.count({
        where: {
          status: { in: ['open', 'in_progress'] },
          priority: 'urgent',
          unit: { property: { landlordId } },
        },
      }),
      prisma.rentPayment.aggregate({
        _sum: { amount: true },
        where: {
          status: 'paid',
          paidAt: { gte: startOfMonth },
          lease: { unit: { property: { landlordId } } },
        },
      }),
      prisma.rentPayment.aggregate({
        _sum: { amount: true },
        where: {
          status: 'paid',
          paidAt: { gte: startOfYear },
          lease: { unit: { property: { landlordId } } },
        },
      }),
      prisma.lease.aggregate({
        _sum: { rentAmount: true },
        where: { status: 'active', unit: { property: { landlordId } } },
      }),
      prisma.rentPayment.aggregate({
        _sum: { amount: true },
        where: {
          status: 'paid',
          payoutId: null,
          lease: { unit: { property: { landlordId } } },
        },
      }),
    ]);

    return {
      propertiesCount,
      applicationsCount,
      tenantsCount,
      ticketsCount,
      totalUnits,
      occupiedUnits,
      urgentTickets,
      rentPaidThisMonth,
      rentPaidYtd,
      scheduledRent,
      unpaidRent,
    };
  },
  ['admin-dashboard-stats'],
  { revalidate: 60 } // Cache for 60 seconds
);

const AdminOverviewPage = async (props: {
  searchParams?: Promise<{ subscription?: string; tier?: string }>;
}) => {
  const session = await requireAdmin();

  const resolvedSearchParams = (await props.searchParams) || {};
  if (resolvedSearchParams.subscription === 'success') {
    try {
      const cookieStore = await cookies();
      const cookieHeader = cookieStore
        .getAll()
        .map((c) => `${c.name}=${c.value}`)
        .join('; ');

      let origin = SERVER_URL;
      try {
        origin = new URL(SERVER_URL).origin;
      } catch {}

      await fetch(`${origin}/api/landlord/subscription/sync`, {
        method: 'POST',
        headers: cookieHeader ? { cookie: cookieHeader } : undefined,
        cache: 'no-store',
      });
    } catch {
      // ignore
    }

    redirect('/admin/overview');
  }

  const landlordResult = await getOrCreateCurrentLandlord();

  if (!landlordResult.success || !landlordResult.landlord) {
    throw new Error(landlordResult.message || 'Unable to determine landlord');
  }

  const landlordId = landlordResult.landlord.id;
  const landlordSubdomain = landlordResult.landlord.subdomain;
  const landlordName = landlordResult.landlord.companyName || landlordResult.landlord.name;

  // Build the listing URL for sharing
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'propertyflowhq.com';
  const isLocalhost = rootDomain.includes('localhost');
  const protocol = isLocalhost ? 'http' : 'https';
  const listingUrl = landlordSubdomain ? `${protocol}://${rootDomain}/${landlordSubdomain}` : '';
  
  // Build the contractor sign-up URL
  const contractorUrl = `${protocol}://${rootDomain}/sign-up?callbackUrl=${encodeURIComponent('/onboarding/contractor')}`;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const userId = session?.user?.id as string | undefined;
  const role = session?.user?.role;
  const isAdmin = role === 'admin' || role === 'superAdmin';

  const prismaAny = prisma as any;

  // Use cached dashboard stats for main metrics
  const cachedStats = await getCachedDashboardStats(landlordId, startOfMonth, startOfYear);
  
  const {
    propertiesCount,
    applicationsCount,
    tenantsCount,
    ticketsCount,
    totalUnits,
    occupiedUnits,
    urgentTickets,
    rentPaidThisMonth,
    rentPaidYtd,
    scheduledRent,
    unpaidRent,
  } = cachedStats;

  // These need to be fetched fresh (user-specific)
  const [openSupportThreads, threadParticipants] = await Promise.all([
    isAdmin
      ? prismaAny.thread.count({
          where: {
            type: { in: ['contact', 'support'] },
            status: 'open',
          },
        })
      : Promise.resolve(0),
    userId
      ? prismaAny.threadParticipant.findMany({
          where: { userId },
          include: {
            thread: {
              include: {
                messages: {
                  orderBy: { createdAt: 'desc' },
                  take: 1,
                },
              },
            },
          },
        })
      : Promise.resolve([]),
  ]);

  if (propertiesCount === 0) {
    redirect('/admin/onboarding');
  }

  const totalUnitsSafe = Number(totalUnits || 0);
  const occupiedUnitsSafe = Number(occupiedUnits || 0);
  const vacantUnits = Math.max(totalUnitsSafe - occupiedUnitsSafe, 0);

  const rentCollectedThisMonth = Number(rentPaidThisMonth?._sum?.amount || 0);
  const rentCollectedYtd = Number(rentPaidYtd?._sum?.amount || 0);
  const scheduledRentMonthly = Number(scheduledRent?._sum?.rentAmount || 0);

  const collectionRate = scheduledRentMonthly > 0 ? (rentCollectedThisMonth / scheduledRentMonthly) * 100 : 0;

  const availableBalance = Number(unpaidRent?._sum?.amount || 0);

  type ThreadParticipantWithThread = {
    lastReadAt: Date | null;
    thread: {
      messages: { createdAt: Date }[];
    };
  };

  const unreadThreads = Array.isArray(threadParticipants)
    ? (threadParticipants as ThreadParticipantWithThread[]).filter((p) => {
        const lastMessage = p.thread?.messages?.[0];
        if (!lastMessage) return false;
        if (!p.lastReadAt) return true;
        return new Date(lastMessage.createdAt) > new Date(p.lastReadAt);
      }).length
    : 0;

  const messagesCountToShow = isAdmin ? Number(openSupportThreads || 0) : unreadThreads;

  return (
    <div className='w-full space-y-4 sm:space-y-6'>
      <div>
        <h1 className='text-xl sm:text-2xl md:text-3xl font-semibold text-black mb-1'>Property Dashboard</h1>
        <p className='text-xs sm:text-sm text-black'>High-level snapshot of properties, tenants, and operations.</p>
      </div>

      {/* Stats Cards - Clickable on mobile */}
      <div className='relative rounded-xl sm:rounded-2xl border-2 border-black shadow-xl overflow-hidden'>
        <div className='absolute inset-0 bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-300' />
        <div className='relative p-3 sm:p-4 md:p-6'>
          <div className='flex items-center justify-between mb-3'>
            <h3 className='text-sm sm:text-base font-bold text-black'>Your Dashboard</h3>
            <span className='text-[10px] text-black bg-white/30 px-1.5 py-0.5 rounded-full ring-1 ring-black/20 font-semibold'>Live</span>
          </div>

          <div className='grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3'>
            {/* Share Listing Card - Prominent position */}
            {listingUrl && (
              <ShareListingCard listingUrl={listingUrl} landlordName={landlordName} />
            )}

            {/* Share Contractor Card */}
            <ShareContractorCard contractorUrl={contractorUrl} landlordName={landlordName} />

            <Link
              href='/admin/products'
              className='rounded-lg sm:rounded-xl bg-gradient-to-r from-sky-500 via-cyan-300 to-sky-500 border-2 border-black p-2.5 sm:p-3 md:p-4 space-y-1 hover:border-slate-700 transition-colors shadow-2xl active:scale-[0.98]'
            >
              <div className='flex items-center justify-between'>
                <div className='text-[10px] sm:text-xs text-black font-bold'>Total Units</div>
                <Building2 className='h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600' />
              </div>
              <div className='text-lg sm:text-xl md:text-2xl font-bold text-black'>{totalUnitsSafe}</div>
              <div className='text-[9px] sm:text-[10px] text-black font-semibold'>{vacantUnits} vacant</div>
            </Link>

            <Link
              href='/admin/revenue'
              className='rounded-lg sm:rounded-xl bg-gradient-to-r from-sky-500 via-cyan-300 to-sky-500 border-2 border-black p-2.5 sm:p-3 md:p-4 space-y-1 hover:border-slate-700 transition-colors shadow-2xl active:scale-[0.98]'
            >
              <div className='flex items-center justify-between'>
                <div className='text-[10px] sm:text-xs text-black font-bold'>Rent This Month</div>
                <DollarSign className='h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600' />
              </div>
              <div className='text-lg sm:text-xl md:text-2xl font-bold text-black'>{formatCurrency(rentCollectedThisMonth)}</div>
              <div className='text-[9px] sm:text-[10px] text-black font-semibold'>{collectionRate.toFixed(0)}% collected</div>
            </Link>

            <Link
              href='/admin/maintenance'
              className='rounded-lg sm:rounded-xl bg-gradient-to-r from-sky-500 via-cyan-300 to-sky-500 border-2 border-black p-2.5 sm:p-3 md:p-4 space-y-1 hover:border-slate-700 transition-colors shadow-2xl active:scale-[0.98]'
            >
              <div className='flex items-center justify-between'>
                <div className='text-[10px] sm:text-xs text-black font-bold'>Maintenance</div>
                <Wrench className='h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600' />
              </div>
              <div className='text-lg sm:text-xl md:text-2xl font-bold text-black'>{ticketsCount}</div>
              <div className='text-[9px] sm:text-[10px] text-black font-semibold'>{urgentTickets} urgent</div>
            </Link>

            <Link
              href='/admin/applications'
              className='rounded-lg sm:rounded-xl bg-gradient-to-r from-sky-500 via-cyan-300 to-sky-500 border-2 border-black p-2.5 sm:p-3 md:p-4 space-y-1 hover:border-slate-700 transition-colors shadow-2xl active:scale-[0.98]'
            >
              <div className='flex items-center justify-between'>
                <div className='text-[10px] sm:text-xs text-black font-bold'>Applications</div>
                <FileText className='h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-600' />
              </div>
              <div className='text-lg sm:text-xl md:text-2xl font-bold text-black'>{applicationsCount}</div>
              <div className='text-[9px] sm:text-[10px] text-black font-semibold'>Review now</div>
            </Link>

            <Link
              href='/admin/payouts'
              className='rounded-lg sm:rounded-xl bg-gradient-to-r from-sky-500 via-cyan-300 to-sky-500 border-2 border-black p-2.5 sm:p-3 md:p-4 space-y-1 hover:border-slate-700 transition-colors shadow-2xl active:scale-[0.98]'
            >
              <div className='flex items-center justify-between'>
                <div className='text-[10px] sm:text-xs text-black font-bold'>Available Balance</div>
                <Wallet className='h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600' />
              </div>
              <div className='text-lg sm:text-xl md:text-2xl font-bold text-black'>{formatCurrency(availableBalance)}</div>
              <div className='text-[9px] sm:text-[10px] text-black font-semibold'>Ready to cash out</div>
            </Link>

            <Link
              href={isAdmin ? '/admin/messages' : '/admin/tenant-messages'}
              className='rounded-lg sm:rounded-xl bg-gradient-to-r from-sky-500 via-cyan-300 to-sky-500 border-2 border-black p-2.5 sm:p-3 md:p-4 space-y-1 hover:border-slate-700 transition-colors shadow-2xl active:scale-[0.98]'
            >
              <div className='flex items-center justify-between'>
                <div className='text-[10px] sm:text-xs text-black font-bold'>Messages</div>
                <MessageCircle className='h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600' />
              </div>
              <div className='text-lg sm:text-xl md:text-2xl font-bold text-black'>{messagesCountToShow}</div>
              <div className='text-[9px] sm:text-[10px] text-black font-semibold'>{isAdmin ? 'Open inbox threads' : 'Unread threads'}</div>
            </Link>
          </div>

          <div className='mt-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-sky-500 via-cyan-200 to-sky-500 p-2.5 sm:p-3 md:p-4 border-2 border-black'>
            <div className='grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4'>
              <div className='space-y-0.5'>
                <div className='text-[9px] sm:text-[10px] text-black font-bold uppercase tracking-wide'>Occupied</div>
                <div className='text-xs sm:text-sm font-bold text-black'>{occupiedUnitsSafe}</div>
              </div>
              <div className='space-y-0.5'>
                <div className='text-[9px] sm:text-[10px] text-black font-bold uppercase tracking-wide'>Tenants</div>
                <div className='text-xs sm:text-sm font-bold text-black'>{tenantsCount}</div>
              </div>
              <div className='space-y-0.5'>
                <div className='text-[9px] sm:text-[10px] text-black font-bold uppercase tracking-wide'>Rent (YTD)</div>
                <div className='text-xs sm:text-sm font-bold text-black'>{formatCurrency(rentCollectedYtd)}</div>
              </div>
              <div className='space-y-0.5'>
                <div className='text-[9px] sm:text-[10px] text-black font-bold uppercase tracking-wide'>Properties</div>
                <div className='text-xs sm:text-sm font-bold text-black'>{propertiesCount}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Cards - Show all sidebar links on mobile (excluding duplicates from stat cards) */}
      <div className='md:hidden space-y-3'>
        <div className='grid gap-2'>
          {adminNavLinks
            .filter((item) => {
              // Filter out links that are already shown in the stat cards above
              const statCardLinks = ['/admin/products', '/admin/applications', '/admin/maintenance'];
              return !statCardLinks.includes(item.href);
            })
            .map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className='rounded-lg border-2 border-black bg-gradient-to-r from-sky-500 via-cyan-200 to-sky-500 p-3 flex items-start gap-2.5 hover:border-slate-700 transition-colors cursor-pointer active:scale-[0.98] shadow-xl'
                >
                  <div className='h-8 w-8 rounded-lg bg-white/30 text-blue-600 flex items-center justify-center shrink-0 ring-1 ring-black/20'>
                    <Icon className='h-4 w-4' />
                  </div>
                  <div className='flex flex-col gap-0.5 min-w-0'>
                    <span className='text-sm font-bold text-black'>{item.title}</span>
                    <span className='text-[10px] text-black font-semibold truncate'>{item.description}</span>
                  </div>
                </Link>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default AdminOverviewPage;
