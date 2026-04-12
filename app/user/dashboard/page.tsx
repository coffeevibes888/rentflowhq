import { requireUser } from '@/lib/auth-guard';
import { Metadata } from 'next';
import { prisma } from '@/db/prisma';
import { unstable_cache } from 'next/cache';
import { 
  Home, 
  FileText, 
  CreditCard, 
  Wrench, 
  Bell,
  User,
  FileSignature,
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: 'Tenant Dashboard',
};

// Cache tenant dashboard data for 30 seconds
const getCachedTenantData = unstable_cache(
  async (userId: string) => {
    const [activeLease, pendingRentPayments, openTickets] = await Promise.all([
      prisma.lease.findFirst({
        where: {
          tenantId: userId,
          status: { in: ['active', 'pending_signature'] },
        },
        include: {
          unit: {
            include: {
              property: {
                include: {
                  landlord: true,
                },
              },
            },
          },
          signatureRequests: {
            select: { role: true, status: true },
          },
        },
      }),
      prisma.rentPayment.findMany({
        where: {
          tenantId: userId,
          status: 'pending',
        },
        orderBy: {
          dueDate: 'asc',
        },
        take: 3,
      }),
      prisma.maintenanceTicket.findMany({
        where: {
          tenant: { id: userId },
          status: { in: ['open', 'in_progress'] },
        },
        take: 3,
      }),
    ]);

    return { activeLease, pendingRentPayments, openTickets };
  },
  ['tenant-dashboard', 'by-user'],
  { revalidate: 30 }
);

export default async function TenantDashboardPage() {
  const session = await requireUser();
  
  // Use cached tenant data
  const { activeLease, pendingRentPayments, openTickets } = await getCachedTenantData(session.user.id);

  const totalPendingRent = pendingRentPayments.reduce(
    (sum, payment) => sum + Number(payment.amount), 
    0
  );

  const tenantNeedsSignature = !!activeLease?.signatureRequests?.some(
    (sr) => sr.role === 'tenant' && sr.status !== 'signed'
  );
  const landlordPendingSignature = !!activeLease?.signatureRequests?.some(
    (sr) => sr.role === 'landlord' && sr.status !== 'signed'
  );

  return (
    <main className='w-full'>
      <div className='max-w-7xl space-y-4 sm:space-y-6'>
        <div>
          <h1 className='text-xl sm:text-2xl md:text-3xl font-semibold text-black mb-1'>
            Tenant Dashboard
          </h1>
          <p className='text-xs sm:text-sm text-black'>
            Welcome back, {session.user.name}. Manage your rental, payments, and requests.
          </p>
          {tenantNeedsSignature && (
            <Badge className='mt-2 bg-amber-500/20 text-amber-800 border-amber-500'>
              Lease requires your signature
            </Badge>
          )}
          {landlordPendingSignature && !tenantNeedsSignature && (
            <Badge className='mt-2 bg-emerald-500/20 text-emerald-800 border-emerald-500'>
              Waiting on landlord signature
            </Badge>
          )}
        </div>

        {/* Lease Pending Signature Alert */}
        {activeLease?.status === 'pending_signature' && tenantNeedsSignature && (
          <div className='relative rounded-xl sm:rounded-2xl border border-white shadow-xl overflow-hidden'>
            <div className='absolute inset-0 bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-300' />
            <div className='relative p-3 sm:p-4 md:p-5 space-y-3'>
              <div className='flex items-start gap-3'>
                <div className='rounded-full bg-white/30 p-2 shrink-0'>
                  <FileSignature className='h-4 w-4 sm:h-5 sm:w-5 text-black' />
                </div>
                <div className='flex-1'>
                  <h3 className='text-sm sm:text-base font-bold text-black'>Application Approved — Sign Your Lease</h3>
                  <p className='text-[10px] sm:text-xs text-black/80 mt-1'>
                    Your application has been approved. Sign your lease and pay move-in costs to complete.
                  </p>
                </div>
              </div>
              <div className='flex flex-wrap gap-2'>
                <Link href='/user/profile/lease'>
                  <button className='rounded-lg bg-gradient-to-r from-sky-500 via-cyan-300 to-sky-500 border border-white px-3 py-1.5 text-xs font-bold text-black hover:border-slate-700 transition-colors active:scale-[0.98] flex items-center gap-1.5'>
                    <FileSignature className='h-3.5 w-3.5' />
                    Sign Lease
                  </button>
                </Link>
                <Link href='/user/profile/rent-receipts'>
                  <button className='rounded-lg bg-gradient-to-r from-sky-500 via-cyan-300 to-sky-500 border border-white px-3 py-1.5 text-xs font-bold text-black hover:border-slate-700 transition-colors active:scale-[0.98] flex items-center gap-1.5'>
                    <CreditCard className='h-3.5 w-3.5' />
                    Pay Move-in Costs
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className='relative rounded-xl sm:rounded-2xl border border-white shadow-xl overflow-hidden'>
          <div className='absolute inset-0 bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-300' />
          <div className='relative p-3 sm:p-4 md:p-6'>
            <div className='flex items-center justify-between mb-3'>
              <h3 className='text-sm sm:text-base font-bold text-black'>Your Dashboard</h3>
              <span className='text-[10px] text-black bg-white/30 px-1.5 py-0.5 rounded-full ring-1 ring-black/20 font-semibold'>Live</span>
            </div>

            <div className='grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3'>
              {/* Pending Rent */}
              <Link
                href='/user/profile/rent-receipts'
                className='rounded-lg sm:rounded-xl bg-gradient-to-r from-sky-500 via-cyan-300 to-sky-500 border border-white p-2.5 sm:p-3 md:p-4 space-y-1 hover:border-slate-700 transition-colors shadow-2xl active:scale-[0.98]'
              >
                <div className='flex items-center justify-between'>
                  <div className='text-[10px] sm:text-xs text-black font-bold'>Pending Rent</div>
                  <CreditCard className='h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600' />
                </div>
                <div className='text-lg sm:text-xl md:text-2xl font-bold text-black'>${totalPendingRent.toFixed(2)}</div>
                <div className='text-[9px] sm:text-[10px] text-black font-semibold'>{pendingRentPayments.length} payment{pendingRentPayments.length !== 1 ? 's' : ''} due</div>
              </Link>

              {/* Maintenance */}
              <Link
                href='/user/profile/ticket'
                className='rounded-lg sm:rounded-xl bg-gradient-to-r from-sky-500 via-cyan-300 to-sky-500 border border-white p-2.5 sm:p-3 md:p-4 space-y-1 hover:border-slate-700 transition-colors shadow-2xl active:scale-[0.98]'
              >
                <div className='flex items-center justify-between'>
                  <div className='text-[10px] sm:text-xs text-black font-bold'>Maintenance</div>
                  <Wrench className='h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600' />
                </div>
                <div className='text-lg sm:text-xl md:text-2xl font-bold text-black'>{openTickets.length}</div>
                <div className='text-[9px] sm:text-[10px] text-black font-semibold'>Open tickets</div>
              </Link>

              {/* Current Lease */}
              <Link
                href='/user/profile/lease'
                className='rounded-lg sm:rounded-xl bg-gradient-to-r from-sky-500 via-cyan-300 to-sky-500 border border-white p-2.5 sm:p-3 md:p-4 space-y-1 hover:border-slate-700 transition-colors shadow-2xl active:scale-[0.98]'
              >
                <div className='flex items-center justify-between'>
                  <div className='text-[10px] sm:text-xs text-black font-bold'>Current Lease</div>
                  <Home className='h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600' />
                </div>
                <div className='text-lg sm:text-xl md:text-2xl font-bold text-black truncate'>
                  {activeLease ? activeLease.unit.name : '—'}
                </div>
                <div className='text-[9px] sm:text-[10px] text-black font-semibold truncate'>
                  {activeLease ? activeLease.unit.property.name : 'No active lease'}
                </div>
              </Link>

              {/* Applications */}
              <Link
                href='/user/applications'
                className='rounded-lg sm:rounded-xl bg-gradient-to-r from-sky-500 via-cyan-300 to-sky-500 border border-white p-2.5 sm:p-3 md:p-4 space-y-1 hover:border-slate-700 transition-colors shadow-2xl active:scale-[0.98]'
              >
                <div className='flex items-center justify-between'>
                  <div className='text-[10px] sm:text-xs text-black font-bold'>Applications</div>
                  <FileText className='h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-600' />
                </div>
                <div className='text-lg sm:text-xl md:text-2xl font-bold text-black'>View</div>
                <div className='text-[9px] sm:text-[10px] text-black font-semibold'>Check status</div>
              </Link>

              {/* Notifications */}
              <Link
                href='/user/notifications'
                className='rounded-lg sm:rounded-xl bg-gradient-to-r from-sky-500 via-cyan-300 to-sky-500 border border-white p-2.5 sm:p-3 md:p-4 space-y-1 hover:border-slate-700 transition-colors shadow-2xl active:scale-[0.98]'
              >
                <div className='flex items-center justify-between'>
                  <div className='text-[10px] sm:text-xs text-black font-bold'>Notifications</div>
                  <Bell className='h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600' />
                </div>
                <div className='text-lg sm:text-xl md:text-2xl font-bold text-black'>Alerts</div>
                <div className='text-[9px] sm:text-[10px] text-black font-semibold'>View all</div>
              </Link>

              {/* Profile */}
              <Link
                href='/user/profile'
                className='rounded-lg sm:rounded-xl bg-gradient-to-r from-sky-500 via-cyan-300 to-sky-500 border border-white p-2.5 sm:p-3 md:p-4 space-y-1 hover:border-slate-700 transition-colors shadow-2xl active:scale-[0.98]'
              >
                <div className='flex items-center justify-between'>
                  <div className='text-[10px] sm:text-xs text-black font-bold'>Profile</div>
                  <User className='h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600' />
                </div>
                <div className='text-lg sm:text-xl md:text-2xl font-bold text-black'>Edit</div>
                <div className='text-[9px] sm:text-[10px] text-black font-semibold'>Update details</div>
              </Link>
            </div>

            {/* Summary Bar */}
            <div className='mt-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-sky-500 via-cyan-200 to-sky-500 p-2.5 sm:p-3 md:p-4 border border-white shadow-2xl'>
              <div className='grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4'>
                <div className='space-y-0.5'>
                  <div className='text-[9px] sm:text-[10px] text-black font-bold uppercase tracking-wide'>Monthly Rent</div>
                  <div className='text-xs sm:text-md font-bold text-black'>
                    {activeLease ? `$${Number(activeLease.rentAmount).toFixed(2)}` : '—'}
                  </div>
                </div>
                <div className='space-y-0.5'>
                  <div className='text-[9px] sm:text-[10px] text-black font-bold uppercase tracking-wide'>Lease Status</div>
                  <div className='text-xs sm:text-md font-bold text-black capitalize'>
                    {activeLease ? activeLease.status.replace('_', ' ') : 'None'}
                  </div>
                </div>
                <div className='space-y-0.5'>
                  <div className='text-[9px] sm:text-[10px] text-black font-bold uppercase tracking-wide'>Lease Ends</div>
                  <div className='text-xs sm:text-md font-bold text-black'>
                    {activeLease?.endDate ? new Date(activeLease.endDate).toLocaleDateString() : 'Month-to-month'}
                  </div>
                </div>
                <div className='space-y-0.5'>
                  <div className='text-[9px] sm:text-[10px] text-black font-bold uppercase tracking-wide'>Manager</div>
                  <div className='text-xs sm:text-md font-bold text-black truncate'>
                    {activeLease?.unit.property.landlord?.name || '—'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* No Lease Message */}
        {!activeLease && (
          <div className='relative rounded-xl sm:rounded-2xl border border-white shadow-xl overflow-hidden'>
            <div className='absolute inset-0 bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-300' />
            <div className='relative p-3 sm:p-4 md:p-5 space-y-3'>
              <div className='flex items-start gap-3'>
                <Home className='h-4 w-4 sm:h-5 sm:w-5 text-black mt-0.5 shrink-0' />
                <div>
                  <h3 className='text-sm sm:text-base font-bold text-black'>No Active Lease</h3>
                  <p className='text-[10px] sm:text-xs text-black/80 mt-1'>
                    Browse available properties or check your applications.
                  </p>
                  <div className='flex flex-wrap gap-2 mt-3'>
                    <Link href='/search?category=all'>
                      <button className='rounded-lg bg-gradient-to-r from-sky-500 via-cyan-300 to-sky-500 border border-white px-3 py-1.5 text-xs font-bold text-black hover:border-slate-700 transition-colors active:scale-[0.98]'>
                        Browse Properties
                      </button>
                    </Link>
                    <Link href='/user/applications'>
                      <button className='rounded-lg bg-gradient-to-r from-sky-500 via-cyan-300 to-sky-500 border border-white px-3 py-1.5 text-xs font-bold text-black hover:border-slate-700 transition-colors active:scale-[0.98]'>
                        View Applications
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

