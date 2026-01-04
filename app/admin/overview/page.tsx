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

export const metadata: Metadata = {
  title: 'Property Dashboard',
};

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
    openSupportThreads,
    threadParticipants,
  ] = await Promise.all([
    prisma.property.count({ where: { landlordId } }),
    prisma.rentalApplication.count({
      where: {
        unit: {
          property: {
            landlordId,
          },
        },
      },
    }),
    prisma.user.count({
      where: {
        role: 'tenant',
        leasesAsTenant: {
          some: {
            unit: {
              property: {
                landlordId,
              },
            },
          },
        },
      },
    }),
    prisma.maintenanceTicket.count({
      where: {
        unit: {
          property: {
            landlordId,
          },
        },
      },
    }),
    prisma.unit.count({
      where: {
        property: {
          landlordId,
        },
      },
    }),
    prisma.lease.count({
      where: {
        status: 'active',
        unit: {
          property: {
            landlordId,
          },
        },
      },
    }),
    prisma.maintenanceTicket.count({
      where: {
        status: { in: ['open', 'in_progress'] },
        priority: 'urgent',
        unit: {
          property: {
            landlordId,
          },
        },
      },
    }),
    prisma.rentPayment.aggregate({
      _sum: { amount: true },
      where: {
        status: 'paid',
        paidAt: { gte: startOfMonth },
        lease: {
          unit: {
            property: {
              landlordId,
            },
          },
        },
      },
    }),
    prisma.rentPayment.aggregate({
      _sum: { amount: true },
      where: {
        status: 'paid',
        paidAt: { gte: startOfYear },
        lease: {
          unit: {
            property: {
              landlordId,
            },
          },
        },
      },
    }),
    prisma.lease.aggregate({
      _sum: { rentAmount: true },
      where: {
        status: 'active',
        unit: {
          property: {
            landlordId,
          },
        },
      },
    }),
    prisma.rentPayment.aggregate({
      _sum: { amount: true },
      where: {
        status: 'paid',
        payoutId: null,
        lease: {
          unit: {
            property: {
              landlordId,
            },
          },
        },
      },
    }),
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
        <h1 className='text-xl sm:text-2xl md:text-3xl font-semibold text-slate-50 mb-1'>Property Dashboard</h1>
        <p className='text-xs sm:text-sm text-slate-300/80'>High-level snapshot of properties, tenants, and operations.</p>
      </div>

      {/* Stats Cards - Clickable on mobile */}
      <div className='relative rounded-xl sm:rounded-2xl border border-white/10 shadow-xl overflow-hidden backdrop-blur-md'>
        <div className='absolute inset-0 bg-blue-700' />
        <div className='relative p-3 sm:p-4 md:p-6'>
          <div className='flex items-center justify-between mb-3'>
            <h3 className='text-sm sm:text-base font-bold text-white'>Your Dashboard</h3>
            <span className='text-[10px] text-violet-200/80 bg-white/5 px-1.5 py-0.5 rounded-full ring-1 ring-white/10'>Live</span>
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
              className='rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 border border-white/10 p-2.5 sm:p-3 md:p-4 space-y-1 backdrop-blur-sm hover:border-violet-400/60 transition-colors shadow-xl active:scale-[0.98]'
            >
              <div className='flex items-center justify-between'>
                <div className='text-[10px] sm:text-xs text-black'>Total Units</div>
                <Building2 className='h-3.5 w-3.5 sm:h-4 sm:w-4 text-white/90' />
              </div>
              <div className='text-lg sm:text-xl md:text-2xl font-bold text-white'>{totalUnitsSafe}</div>
              <div className='text-[9px] sm:text-[10px] text-red-200'>{vacantUnits} vacant</div>
            </Link>

            <Link
              href='/admin/revenue'
              className='rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 border border-white/10 p-2.5 sm:p-3 md:p-4 space-y-1 backdrop-blur-sm hover:border-violet-400/60 transition-colors shadow-xl active:scale-[0.98]'
            >
              <div className='flex items-center justify-between'>
                <div className='text-[10px] sm:text-xs text-black'>Rent This Month</div>
                <DollarSign className='h-3.5 w-3.5 sm:h-4 sm:w-4 text-white/90' />
              </div>
              <div className='text-lg sm:text-xl md:text-2xl font-bold text-white'>{formatCurrency(rentCollectedThisMonth)}</div>
              <div className='text-[9px] sm:text-[10px] text-yellow-100'>{collectionRate.toFixed(0)}% collected</div>
            </Link>

            <Link
              href='/admin/maintenance'
              className='rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 border border-white/10 p-2.5 sm:p-3 md:p-4 space-y-1 backdrop-blur-sm hover:border-violet-400/60 transition-colors shadow-xl active:scale-[0.98]'
            >
              <div className='flex items-center justify-between'>
                <div className='text-[10px] sm:text-xs text-black'>Maintenance</div>
                <Wrench className='h-3.5 w-3.5 sm:h-4 sm:w-4 text-white/90' />
              </div>
              <div className='text-lg sm:text-xl md:text-2xl font-bold text-white'>{ticketsCount}</div>
              <div className='text-[9px] sm:text-[10px] text-red-100'>{urgentTickets} urgent</div>
            </Link>

            <Link
              href='/admin/applications'
              className='rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 border border-white/10 p-2.5 sm:p-3 md:p-4 space-y-1 backdrop-blur-sm hover:border-violet-400/60 transition-colors shadow-xl active:scale-[0.98]'
            >
              <div className='flex items-center justify-between'>
                <div className='text-[10px] sm:text-xs text-black'>Applications</div>
                <FileText className='h-3.5 w-3.5 sm:h-4 sm:w-4 text-white/90' />
              </div>
              <div className='text-lg sm:text-xl md:text-2xl font-bold text-white'>{applicationsCount}</div>
              <div className='text-[9px] sm:text-[10px] text-emerald-100'>Review now</div>
            </Link>

            <Link
              href='/admin/payouts'
              className='rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 border border-white/10 p-2.5 sm:p-3 md:p-4 space-y-1 backdrop-blur-sm hover:border-violet-400/60 transition-colors shadow-xl active:scale-[0.98]'
            >
              <div className='flex items-center justify-between'>
                <div className='text-[10px] sm:text-xs text-black'>Available Balance</div>
                <Wallet className='h-3.5 w-3.5 sm:h-4 sm:w-4 text-white/90' />
              </div>
              <div className='text-lg sm:text-xl md:text-2xl font-bold text-white'>{formatCurrency(availableBalance)}</div>
              <div className='text-[9px] sm:text-[10px] text-white/90'>Ready to cash out</div>
            </Link>

            <Link
              href={isAdmin ? '/admin/messages' : '/admin/tenant-messages'}
              className='rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 border border-white/10 p-2.5 sm:p-3 md:p-4 space-y-1 backdrop-blur-sm hover:border-violet-400/60 transition-colors shadow-xl active:scale-[0.98]'
            >
              <div className='flex items-center justify-between'>
                <div className='text-[10px] sm:text-xs text-black'>Messages</div>
                <MessageCircle className='h-3.5 w-3.5 sm:h-4 sm:w-4 text-white/90' />
              </div>
              <div className='text-lg sm:text-xl md:text-2xl font-bold text-white'>{messagesCountToShow}</div>
              <div className='text-[9px] sm:text-[10px] text-white/90'>{isAdmin ? 'Open inbox threads' : 'Unread threads'}</div>
            </Link>
          </div>

          <div className='mt-3 rounded-lg sm:rounded-xl bg-slate-900/60 p-2.5 sm:p-3 md:p-4 border border-white/10'>
            <div className='grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4'>
              <div className='space-y-0.5'>
                <div className='text-[9px] sm:text-[10px] text-slate-200/80 uppercase tracking-wide'>Occupied</div>
                <div className='text-xs sm:text-sm font-semibold text-white'>{occupiedUnitsSafe}</div>
              </div>
              <div className='space-y-0.5'>
                <div className='text-[9px] sm:text-[10px] text-slate-200/80 uppercase tracking-wide'>Tenants</div>
                <div className='text-xs sm:text-sm font-semibold text-white'>{tenantsCount}</div>
              </div>
              <div className='space-y-0.5'>
                <div className='text-[9px] sm:text-[10px] text-slate-200/80 uppercase tracking-wide'>Rent (YTD)</div>
                <div className='text-xs sm:text-sm font-semibold text-white'>{formatCurrency(rentCollectedYtd)}</div>
              </div>
              <div className='space-y-0.5'>
                <div className='text-[9px] sm:text-[10px] text-slate-200/80 uppercase tracking-wide'>Properties</div>
                <div className='text-xs sm:text-sm font-semibold text-white'>{propertiesCount}</div>
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
                  className='rounded-lg border border-white/10 bg-slate-900/60 p-3 flex items-start gap-2.5 hover:border-violet-400/60 hover:bg-slate-900/90 transition-colors cursor-pointer active:scale-[0.98]'
                >
                  <div className='h-8 w-8 rounded-lg bg-white/5 text-violet-200/80 flex items-center justify-center shrink-0 ring-1 ring-white/10'>
                    <Icon className='h-4 w-4' />
                  </div>
                  <div className='flex flex-col gap-0.5 min-w-0'>
                    <span className='text-sm font-semibold text-slate-50'>{item.title}</span>
                    <span className='text-[10px] text-slate-300/80 truncate'>{item.description}</span>
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
