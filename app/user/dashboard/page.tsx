import { requireUser } from '@/lib/auth-guard';
import { Metadata } from 'next';
import { prisma } from '@/db/prisma';
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

export default async function TenantDashboardPage() {
  const session = await requireUser();
  
  // Get tenant's active lease if any
  const activeLease = await prisma.lease.findFirst({
    where: {
      tenantId: session.user.id,
      status: 'active',
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
  });

  // Get pending rent payments
  const pendingRentPayments = await prisma.rentPayment.findMany({
    where: {
      tenantId: session.user.id,
      status: 'pending',
    },
    orderBy: {
      dueDate: 'asc',
    },
    take: 3,
  });

  // Get open maintenance tickets
  const openTickets = await prisma.maintenanceTicket.findMany({
    where: {
      tenant: {
        id: session.user.id,
      },
      status: { in: ['open', 'in_progress'] },
    },
    take: 3,
  });

  // Get draft applications that need completion
  const draftApplications = await prisma.rentalApplication.findMany({
    where: {
      applicantId: session.user.id,
      status: 'draft',
    },
    orderBy: { createdAt: 'desc' },
  });

  // Get pending applications that need verification
  const pendingVerificationApps = await prisma.rentalApplication.findMany({
    where: {
      applicantId: session.user.id,
      status: 'pending',
      verification: {
        OR: [
          { identityStatus: 'pending' },
          { employmentStatus: 'pending' },
        ],
        overallStatus: { not: 'complete' },
      },
    },
    include: {
      verification: {
        select: {
          identityStatus: true,
          employmentStatus: true,
          overallStatus: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

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

        {/* Pending Verification Alert - Show prominently if user has applications needing verification */}
        {pendingVerificationApps.length > 0 && (
          <div className='rounded-xl border border-amber-400/50 bg-gradient-to-r from-amber-900/40 to-orange-900/40 p-5 space-y-4'>
            <div className='flex items-start gap-3'>
              <div className='rounded-full bg-amber-500/20 p-2'>
                <AlertCircle className='h-5 w-5 text-amber-300' />
              </div>
              <div className='flex-1'>
                <h3 className='text-lg font-semibold text-slate-50'>Action Required: Complete Verification</h3>
                <p className='text-sm text-slate-300/90 mt-1'>
                  Your application{pendingVerificationApps.length !== 1 ? 's' : ''} require{pendingVerificationApps.length === 1 ? 's' : ''} identity and income verification before {pendingVerificationApps.length === 1 ? 'it' : 'they'} can be reviewed by the landlord.
                </p>
              </div>
            </div>
            <div className='space-y-3'>
              {pendingVerificationApps.map((app) => (
                <Link 
                  key={app.id}
                  href='/user/applications'
                  className='flex items-center justify-between rounded-lg border border-white/10 bg-slate-900/60 p-4 hover:border-amber-400/50 hover:bg-slate-900/80 transition-all group'
                >
                  <div className='flex-1'>
                    <p className='font-medium text-slate-50'>
                      {app.propertySlug ? app.propertySlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Property Application'}
                    </p>
                    <div className='flex items-center gap-4 mt-2'>
                      <div className='flex items-center gap-1.5'>
                        <div className={`w-2 h-2 rounded-full ${
                          app.verification?.identityStatus === 'verified' ? 'bg-green-500' :
                          app.verification?.identityStatus === 'rejected' ? 'bg-red-500' :
                          'bg-amber-500'
                        }`} />
                        <span className='text-xs text-slate-400'>
                          ID: {app.verification?.identityStatus || 'pending'}
                        </span>
                      </div>
                      <div className='flex items-center gap-1.5'>
                        <div className={`w-2 h-2 rounded-full ${
                          app.verification?.employmentStatus === 'verified' ? 'bg-green-500' :
                          app.verification?.employmentStatus === 'rejected' ? 'bg-red-500' :
                          'bg-amber-500'
                        }`} />
                        <span className='text-xs text-slate-400'>
                          Income: {app.verification?.employmentStatus || 'pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Badge className='bg-amber-500/20 text-amber-100 border-amber-400/50'>
                      Needs Verification
                    </Badge>
                    <ArrowRight className='h-4 w-4 text-amber-300 group-hover:translate-x-1 transition-transform' />
                  </div>
                </Link>
              ))}
            </div>
            <Link href='/user/applications'>
              <Button className='w-full bg-amber-600 hover:bg-amber-700 text-white'>
                Complete Verification Now
                <ArrowRight className='ml-2 h-4 w-4' />
              </Button>
            </Link>
          </div>
        )}

        {/* Draft Applications Alert - Show prominently if user has pending applications to complete */}
        {draftApplications.length > 0 && (
          <div className='rounded-xl border border-violet-400/50 bg-gradient-to-r from-violet-900/40 to-indigo-900/40 p-5 space-y-4'>
            <div className='flex items-start gap-3'>
              <div className='rounded-full bg-violet-500/20 p-2'>
                <AlertCircle className='h-5 w-5 text-violet-300' />
              </div>
              <div className='flex-1'>
                <h3 className='text-lg font-semibold text-slate-50'>Complete Your Application</h3>
                <p className='text-sm text-slate-300/90 mt-1'>
                  You have {draftApplications.length} application{draftApplications.length !== 1 ? 's' : ''} waiting to be completed.
                </p>
              </div>
            </div>
            <div className='space-y-3'>
              {draftApplications.map((app) => (
                <Link 
                  key={app.id}
                  href={`/user/onboarding?applicationId=${encodeURIComponent(app.id)}`}
                  className='flex items-center justify-between rounded-lg border border-white/10 bg-slate-900/60 p-4 hover:border-violet-400/50 hover:bg-slate-900/80 transition-all group'
                >
                  <div>
                    <p className='font-medium text-slate-50'>
                      {app.propertySlug ? app.propertySlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Property Application'}
                    </p>
                    <p className='text-xs text-slate-400 mt-0.5'>
                      Started {new Date(app.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Badge variant='outline' className='border-amber-400/50 text-amber-300 bg-amber-500/10'>
                      Draft
                    </Badge>
                    <ArrowRight className='h-4 w-4 text-violet-300 group-hover:translate-x-1 transition-transform' />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

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

