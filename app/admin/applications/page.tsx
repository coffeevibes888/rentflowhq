'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatCurrency, cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Building2,
  DollarSign,
  Calendar,
  Loader2,
  ExternalLink
} from 'lucide-react';

interface Application {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  monthlyIncome: number | null;
  status: string;
  createdAt: string;
  propertySlug: string | null;
  unit: {
    name: string;
    property: { name: string } | null;
  } | null;
  applicant: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
}

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await fetch('/api/admin/applications');
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const pendingApps = applications.filter(app => app.status === 'pending');
  const approvedApps = applications.filter(app => app.status === 'approved');
  const rejectedApps = applications.filter(app => app.status === 'rejected' || app.status === 'denied');

  const formatUnitLabel = (app: Application) => {
    const unitName = app.unit?.name;
    const propertyName = app.unit?.property?.name;
    if (unitName && propertyName) return `${propertyName} • ${unitName}`;
    if (propertyName) return propertyName;
    return unitName || 'Unit';
  };

  if (loading) {
    return (
      <main className='w-full'>
        <div className='flex items-center justify-center py-20'>
          <Loader2 className='w-8 h-8 animate-spin text-violet-400' />
        </div>
      </main>
    );
  }

  return (
    <main className='w-full space-y-4'>
      {/* Header */}
      <div>
        <h1 className='text-xl sm:text-2xl md:text-3xl font-semibold text-slate-50 mb-1'>
          Rental Applications
        </h1>
        <p className='text-xs text-slate-300/80'>
          Review and respond to incoming applications.
        </p>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-3 gap-2'>
        <div className='rounded-lg sm:rounded-xl bg-gradient-to-r from-amber-600/20 to-orange-600/20 border border-amber-500/30 p-2.5 sm:p-3'>
          <div className='flex items-center justify-between mb-1'>
            <Clock className='w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400' />
            <span className='text-base sm:text-xl font-bold text-white'>{pendingApps.length}</span>
          </div>
          <p className='text-[9px] sm:text-[10px] text-amber-200/80'>Pending</p>
        </div>
        <div className='rounded-lg sm:rounded-xl bg-gradient-to-r from-emerald-600/20 to-green-600/20 border border-emerald-500/30 p-2.5 sm:p-3'>
          <div className='flex items-center justify-between mb-1'>
            <CheckCircle2 className='w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400' />
            <span className='text-base sm:text-xl font-bold text-white'>{approvedApps.length}</span>
          </div>
          <p className='text-[9px] sm:text-[10px] text-emerald-200/80'>Approved</p>
        </div>
        <div className='rounded-lg sm:rounded-xl bg-gradient-to-r from-red-600/20 to-rose-600/20 border border-red-500/30 p-2.5 sm:p-3'>
          <div className='flex items-center justify-between mb-1'>
            <XCircle className='w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400' />
            <span className='text-base sm:text-xl font-bold text-white'>{rejectedApps.length}</span>
          </div>
          <p className='text-[9px] sm:text-[10px] text-red-200/80'>Rejected</p>
        </div>
      </div>

        {/* Applications Card with Tabs */}
        <Card className='border-white/10 bg-slate-900/60 overflow-hidden'>
          <Tabs defaultValue='pending' className='w-full'>
            {/* Browser-style tabs at the top */}
            <div className='border-b border-white/10 bg-slate-800/40'>
              <TabsList className='h-auto p-0 bg-transparent rounded-none'>
                <TabsTrigger 
                  value='pending' 
                  className='relative px-3 sm:px-5 py-2 text-xs font-medium text-slate-400 rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:text-white data-[state=active]:bg-slate-900/60 hover:text-white transition-colors'
                >
                  Pending
                  {pendingApps.length > 0 && (
                    <Badge className='ml-1.5 bg-amber-500/20 text-amber-300 text-[9px]'>
                      {pendingApps.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value='approved' 
                  className='relative px-3 sm:px-5 py-2 text-xs font-medium text-slate-400 rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:text-white data-[state=active]:bg-slate-900/60 hover:text-white transition-colors'
                >
                  Approved
                  {approvedApps.length > 0 && (
                    <Badge className='ml-1.5 bg-emerald-500/20 text-emerald-300 text-[9px]'>
                      {approvedApps.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value='rejected' 
                  className='relative px-3 sm:px-5 py-2 text-xs font-medium text-slate-400 rounded-none border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:text-white data-[state=active]:bg-slate-900/60 hover:text-white transition-colors'
                >
                  Rejected
                  {rejectedApps.length > 0 && (
                    <Badge className='ml-1.5 bg-red-500/20 text-red-300 text-[9px]'>
                      {rejectedApps.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            <CardContent className='p-2.5 sm:p-4'>
              {/* Pending Applications */}
              <TabsContent value='pending' className='mt-0'>
                <ApplicationsList 
                  applications={pendingApps} 
                  formatUnitLabel={formatUnitLabel}
                  emptyMessage='No pending applications'
                  statusColor='amber'
                />
              </TabsContent>

              {/* Approved Applications */}
              <TabsContent value='approved' className='mt-0'>
                <ApplicationsList 
                  applications={approvedApps} 
                  formatUnitLabel={formatUnitLabel}
                  emptyMessage='No approved applications'
                  statusColor='emerald'
                />
              </TabsContent>

              {/* Rejected Applications */}
              <TabsContent value='rejected' className='mt-0'>
                <ApplicationsList 
                  applications={rejectedApps} 
                  formatUnitLabel={formatUnitLabel}
                  emptyMessage='No rejected applications'
                  statusColor='red'
                />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
    </main>
  );
}

function ApplicationsList({ 
  applications, 
  formatUnitLabel, 
  emptyMessage,
  statusColor 
}: { 
  applications: Application[];
  formatUnitLabel: (app: Application) => string;
  emptyMessage: string;
  statusColor: 'amber' | 'emerald' | 'red';
}) {
  if (applications.length === 0) {
    return (
      <p className='text-xs sm:text-sm text-slate-400 text-center py-6 sm:py-8'>
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className='space-y-2 sm:space-y-3'>
      {applications.map((app) => (
        <ApplicationCard 
          key={app.id} 
          app={app} 
          formatUnitLabel={formatUnitLabel}
          statusColor={statusColor}
        />
      ))}
    </div>
  );
}

function ApplicationCard({ 
  app, 
  formatUnitLabel,
  statusColor
}: { 
  app: Application;
  formatUnitLabel: (app: Application) => string;
  statusColor: 'amber' | 'emerald' | 'red';
}) {
  const badgeColors = {
    amber: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
    emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
    red: 'bg-red-500/20 text-red-300 border-red-400/30',
  };

  return (
    <Link 
      href={`/admin/applications/${app.id}`}
      className={cn(
        'block rounded-lg border p-3 sm:p-4 transition-all hover:scale-[1.01]',
        'border-white/10 bg-slate-800/40 hover:border-violet-400/40 hover:bg-slate-800/60'
      )}
    >
      {/* Mobile Layout */}
      <div className='sm:hidden space-y-3'>
        <div className='flex items-start justify-between gap-2'>
          <div className='min-w-0 flex-1'>
            <p className='font-medium text-white text-sm truncate'>
              {app.fullName || app.applicant?.name || 'Applicant'}
            </p>
            <p className='text-[10px] text-slate-400 truncate'>
              {app.email || app.applicant?.email || '—'}
            </p>
          </div>
          <Badge className={cn('text-[9px] capitalize shrink-0', badgeColors[statusColor])}>
            {app.status}
          </Badge>
        </div>
        
        <div className='grid grid-cols-2 gap-2 text-[10px]'>
          <div className='flex items-center gap-1.5 text-slate-400'>
            <Building2 className='w-3 h-3' />
            <span className='truncate'>{formatUnitLabel(app)}</span>
          </div>
          <div className='flex items-center gap-1.5 text-slate-400'>
            <DollarSign className='w-3 h-3' />
            <span>{app.monthlyIncome ? formatCurrency(Number(app.monthlyIncome)) : '—'}</span>
          </div>
          <div className='flex items-center gap-1.5 text-slate-400 col-span-2'>
            <Calendar className='w-3 h-3' />
            <span>{new Date(app.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <Button 
          size='sm' 
          className='w-full bg-violet-600 hover:bg-violet-500 text-white text-xs h-8'
        >
          <ExternalLink className='w-3 h-3 mr-1.5' />
          View Application
        </Button>
      </div>

      {/* Desktop Layout */}
      <div className='hidden sm:flex items-center gap-4'>
        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-3 mb-1'>
            <p className='font-medium text-white truncate'>
              {app.fullName || app.applicant?.name || 'Applicant'}
            </p>
            <Badge className={cn('text-[10px] capitalize', badgeColors[statusColor])}>
              {app.status}
            </Badge>
          </div>
          <p className='text-xs text-slate-400 truncate'>
            {app.email || app.applicant?.email || '—'}
          </p>
        </div>

        <div className='flex items-center gap-6 text-xs text-slate-400'>
          <div className='flex items-center gap-1.5 min-w-[120px]'>
            <Building2 className='w-3.5 h-3.5' />
            <span className='truncate'>{formatUnitLabel(app)}</span>
          </div>
          <div className='flex items-center gap-1.5 min-w-[80px]'>
            <DollarSign className='w-3.5 h-3.5' />
            <span>{app.monthlyIncome ? formatCurrency(Number(app.monthlyIncome)) : '—'}</span>
          </div>
          <div className='flex items-center gap-1.5 min-w-[90px]'>
            <Calendar className='w-3.5 h-3.5' />
            <span>{new Date(app.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <Button 
          size='sm' 
          className='bg-violet-600 hover:bg-violet-500 text-white text-xs shrink-0'
        >
          <ExternalLink className='w-3.5 h-3.5 mr-1.5' />
          View
        </Button>
      </div>
    </Link>
  );
}
