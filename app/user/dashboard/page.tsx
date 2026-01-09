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
  MapPin,
  Calendar,
  LayoutDashboard,
  User,
  FileSignature,
  ReceiptText,
  MessageCircle,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
      <div className='max-w-7xl space-y-6'>
        <div>
          <h1 className='text-3xl md:text-4xl font-semibold text-slate-50 mb-2'>
            Welcome back, {session.user.name}
          </h1>
          <p className='text-sm text-slate-300/80'>
            Your tenant dashboard - manage your rental, payments, and maintenance requests.
          </p>
          {tenantNeedsSignature && (
            <Badge className='mt-2 bg-amber-500/20 text-amber-100 border-amber-400/50'>
              Lease requires your signature
            </Badge>
          )}
          {landlordPendingSignature && !tenantNeedsSignature && (
            <Badge className='mt-2 bg-emerald-500/20 text-emerald-100 border-emerald-400/50'>
              Waiting on landlord signature
            </Badge>
          )}
        </div>

        {/* Lease Pending Signature Alert - Show prominently if tenant has a lease to sign */}
        {activeLease?.status === 'pending_signature' && tenantNeedsSignature && (
          <div className='rounded-xl border border-emerald-400/50 bg-gradient-to-r from-emerald-900/40 to-teal-900/40 p-5 space-y-4'>
            <div className='flex items-start gap-3'>
              <div className='rounded-full bg-emerald-500/20 p-2'>
                <FileSignature className='h-5 w-5 text-emerald-300' />
              </div>
              <div className='flex-1'>
                <h3 className='text-lg font-semibold text-slate-50'>🎉 Application Approved - Sign Your Lease</h3>
                <p className='text-sm text-slate-300/90 mt-1'>
                  Congratulations! Your rental application has been approved. Please sign your lease agreement and pay your move-in costs to complete the process.
                </p>
              </div>
            </div>
            <div className='flex flex-wrap gap-3'>
              <Link href='/user/profile/lease'>
                <Button className='bg-emerald-600 hover:bg-emerald-700 text-white'>
                  <FileSignature className='mr-2 h-4 w-4' />
                  Sign Lease
                </Button>
              </Link>
              <Link href='/user/profile/rent-receipts'>
                <Button variant='outline' className='border-emerald-400/50 text-emerald-100 hover:bg-emerald-500/20'>
                  <CreditCard className='mr-2 h-4 w-4' />
                  Pay Move-in Costs
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Pending Verification Alert - Removed since verification is now done during application */}

        {/* Draft Applications Alert - Removed since applications are now completed in one flow */}

        {/* Quick Stats */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          <Link href='/user/profile/rent-receipts' className='rounded-xl border border-white/10 bg-slate-900/60 p-4 flex flex-col gap-3 hover:border-violet-400/60 hover:bg-slate-900/90 transition-colors cursor-pointer'>
            <div className='flex items-center justify-between'>
              <span className='text-xs font-medium text-slate-300/90 uppercase tracking-wide'>Pending Rent</span>
              <CreditCard className='h-4 w-4 text-violet-200/80' />
            </div>
            <div>
              <div className='text-2xl font-semibold text-slate-50'>
                ${totalPendingRent.toFixed(2)}
              </div>
              <p className='text-xs text-slate-300/80 mt-1'>
                {pendingRentPayments.length} payment{pendingRentPayments.length !== 1 ? 's' : ''} due
              </p>
            </div>
          </Link>

          <Link href='/user/profile/ticket' className='rounded-xl border border-white/10 bg-slate-900/60 p-4 flex flex-col gap-3 hover:border-violet-400/60 hover:bg-slate-900/90 transition-colors cursor-pointer'>
            <div className='flex items-center justify-between'>
              <span className='text-xs font-medium text-slate-300/90 uppercase tracking-wide'>Maintenance</span>
              <Wrench className='h-4 w-4 text-violet-200/80' />
            </div>
            <div>
              <div className='text-2xl font-semibold text-slate-50'>{openTickets.length}</div>
              <p className='text-xs text-slate-300/80 mt-1'>Open tickets</p>
            </div>
          </Link>

          {activeLease && (
            <Link href='/user/profile/lease' className='rounded-xl border border-white/10 bg-slate-900/60 p-4 flex flex-col gap-3 hover:border-violet-400/60 hover:bg-slate-900/90 transition-colors cursor-pointer'>
              <div className='flex items-center justify-between'>
                <span className='text-xs font-medium text-slate-300/90 uppercase tracking-wide'>Current Lease</span>
                <Home className='h-4 w-4 text-violet-200/80' />
              </div>
              <div>
                <div className='text-base font-semibold text-slate-50'>{activeLease.unit.name}</div>
                <p className='text-xs text-slate-300/80 mt-1'>{activeLease.unit.property.name}</p>
              </div>
            </Link>
          )}

          <Link href='/user/applications' className='rounded-xl border border-white/10 bg-slate-900/60 p-4 flex flex-col gap-3 hover:border-violet-400/60 hover:bg-slate-900/90 transition-colors cursor-pointer'>
            <div className='flex items-center justify-between'>
              <span className='text-xs font-medium text-slate-300/90 uppercase tracking-wide'>Applications</span>
              <FileText className='h-4 w-4 text-violet-200/80' />
            </div>
            <div>
              <div className='text-base font-semibold text-slate-50'>View Status</div>
              <p className='text-xs text-slate-300/80 mt-1'>Check your applications</p>
            </div>
          </Link>
        </div>

        {/* Current Rental Info */}
        {activeLease && (
          <div className='rounded-xl border border-white/10 bg-slate-900/60 p-5 space-y-4'>
            <div>
              <h3 className='text-lg font-semibold text-slate-50 flex items-center gap-2'>
                <Home className='h-5 w-5' />
                Your Current Rental
              </h3>
              <p className='text-xs text-slate-300/80 mt-1'>Details about your leased property</p>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <div className='flex items-start gap-2'>
                  <MapPin className='h-4 w-4 text-violet-300 mt-0.5' />
                  <div>
                    <p className='text-sm font-medium text-slate-50'>Address</p>
                    <p className='text-sm text-slate-300/80'>
                      {activeLease.unit.property.name} - {activeLease.unit.name}
                    </p>
                  </div>
                </div>
                <div className='flex items-start gap-2'>
                  <Calendar className='h-4 w-4 text-violet-300 mt-0.5' />
                  <div>
                    <p className='text-sm font-medium text-slate-50'>Lease Period</p>
                    <p className='text-sm text-slate-300/80'>
                      {new Date(activeLease.startDate).toLocaleDateString()} - 
                      {activeLease.endDate ? new Date(activeLease.endDate).toLocaleDateString() : 'Month-to-month'}
                    </p>
                  </div>
                </div>
              </div>
              <div className='space-y-2'>
                <div className='flex items-start gap-2'>
                  <CreditCard className='h-4 w-4 text-violet-300 mt-0.5' />
                  <div>
                    <p className='text-sm font-medium text-slate-50'>Monthly Rent</p>
                    <p className='text-sm text-slate-300/80'>
                      ${Number(activeLease.rentAmount).toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className='flex items-start gap-2'>
                  <User className='h-4 w-4 text-violet-300 mt-0.5' />
                  <div>
                    <p className='text-sm font-medium text-slate-50'>Property Manager</p>
                    <p className='text-sm text-slate-300/80'>
                      {activeLease.unit.property.landlord?.name || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className='rounded-xl border border-white/10 bg-slate-900/60 p-5 space-y-4'>
          <div>
            <h3 className='text-lg font-semibold text-slate-50 flex items-center gap-2'>
              <LayoutDashboard className='h-5 w-5' />
              Quick Actions
            </h3>
            <p className='text-xs text-slate-300/80 mt-1'>Common tasks and shortcuts</p>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
            <Link href='/user/profile/rent-receipts'>
              <Button variant='outline' className='w-full justify-start border-white/20 text-slate-50 hover:bg-white/10 hover:text-white'>
                <ReceiptText className='h-4 w-4 mr-2' />
                Pay Rent
              </Button>
            </Link>
            <Link href='/user/profile/ticket'>
              <Button variant='outline' className='w-full justify-start border-white/20 text-slate-50 hover:bg-white/10 hover:text-white'>
                <MessageCircle className='h-4 w-4 mr-2' />
                Maintenance Request
              </Button>
            </Link>
            <Link href='/user/profile/lease'>
              <Button variant='outline' className='w-full justify-start border-white/20 text-slate-50 hover:bg-white/10 hover:text-white'>
                <FileSignature className='h-4 w-4 mr-2' />
                View Lease
              </Button>
            </Link>
            <Link href='/user/profile'>
              <Button variant='outline' className='w-full justify-start border-white/20 text-slate-50 hover:bg-white/10 hover:text-white'>
                <User className='h-4 w-4 mr-2' />
                Update Profile
              </Button>
            </Link>
            <Link href='/user/applications'>
              <Button variant='outline' className='w-full justify-start border-white/20 text-slate-50 hover:bg-white/10 hover:text-white'>
                <FileText className='h-4 w-4 mr-2' />
                Applications
              </Button>
            </Link>
            <Link href='/user/notifications'>
              <Button variant='outline' className='w-full justify-start border-white/20 text-slate-50 hover:bg-white/10 hover:text-white'>
                <Bell className='h-4 w-4 mr-2' />
                Notifications
              </Button>
            </Link>
          </div>
        </div>

        {/* No Lease Message */}
        {!activeLease && (
          <div className='rounded-xl border border-amber-300/30 bg-amber-50/10 p-5 space-y-3'>
            <div className='flex items-start gap-3'>
              <Home className='h-5 w-5 text-amber-300 mt-0.5' />
              <div>
                <h3 className='text-base font-semibold text-slate-50'>No Active Lease</h3>
                <p className='text-sm text-slate-300/80 mt-1'>
                  You don't have an active lease yet. Browse available properties or check your applications.
                </p>
                <div className='flex gap-3 mt-3'>
                  <Link href='/search?category=all'>
                    <Button size='sm' className='bg-violet-600 hover:bg-violet-700'>
                      Browse Properties
                    </Button>
                  </Link>
                  <Link href='/user/applications'>
                    <Button size='sm' variant='outline' className='border-white/20 text-slate-50 hover:bg-white/10'>
                      View Applications
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

