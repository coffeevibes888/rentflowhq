'use client';

import { useState } from 'react';
import { Mail, Users, TrendingUp, Download, Search, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  source: string | null;
  status: string;
  subscribedAt: string;
  unsubscribedAt: string | null;
}

interface NewsletterClientProps {
  initialSubscribers: Subscriber[];
  stats: {
    total: number;
    active: number;
    unsubscribed: number;
    thisMonth: number;
  };
}

export default function NewsletterClient({ initialSubscribers, stats }: NewsletterClientProps) {
  const [subscribers, setSubscribers] = useState(initialSubscribers);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();

  const filteredSubscribers = subscribers.filter(sub => {
    const matchesSearch = 
      sub.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleExport = () => {
    const csv = [
      ['Email', 'Name', 'Source', 'Status', 'Subscribed At'].join(','),
      ...filteredSubscribers.map(sub => [
        sub.email,
        sub.name || '',
        sub.source || '',
        sub.status,
        new Date(sub.subscribedAt).toISOString(),
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Exported',
      description: `${filteredSubscribers.length} subscribers exported to CSV`,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subscriber?')) return;

    try {
      const res = await fetch(`/api/super-admin/newsletter/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setSubscribers(prev => prev.filter(s => s.id !== id));
        toast({
          title: 'Deleted',
          description: 'Subscriber removed successfully',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete subscriber',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-white mb-2'>Newsletter Subscribers</h1>
          <p className='text-sm text-slate-400'>Manage email subscribers and export lists</p>
        </div>
        <Button onClick={handleExport} variant='outline'>
          <Download className='h-4 w-4 mr-2' />
          Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        <div className='rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 p-4'>
          <div className='flex items-center gap-2 text-white/80 mb-2'>
            <Users className='h-4 w-4' />
            <span className='text-xs'>Total Subscribers</span>
          </div>
          <p className='text-2xl font-bold text-white'>{stats.total.toLocaleString()}</p>
        </div>
        
        <div className='rounded-xl bg-slate-900/60 border border-white/10 p-4'>
          <div className='flex items-center gap-2 text-emerald-400 mb-2'>
            <Mail className='h-4 w-4' />
            <span className='text-xs'>Active</span>
          </div>
          <p className='text-2xl font-bold text-emerald-400'>{stats.active.toLocaleString()}</p>
        </div>
        
        <div className='rounded-xl bg-slate-900/60 border border-white/10 p-4'>
          <div className='flex items-center gap-2 text-slate-400 mb-2'>
            <Mail className='h-4 w-4' />
            <span className='text-xs'>Unsubscribed</span>
          </div>
          <p className='text-2xl font-bold text-slate-400'>{stats.unsubscribed.toLocaleString()}</p>
        </div>
        
        <div className='rounded-xl bg-slate-900/60 border border-white/10 p-4'>
          <div className='flex items-center gap-2 text-violet-400 mb-2'>
            <TrendingUp className='h-4 w-4' />
            <span className='text-xs'>This Month</span>
          </div>
          <p className='text-2xl font-bold text-violet-400'>{stats.thisMonth.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className='flex flex-col sm:flex-row gap-4'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400' />
          <Input
            placeholder='Search by email or name...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='pl-10 bg-slate-900/60 border-white/10'
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className='bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white'
        >
          <option value='all'>All Status</option>
          <option value='active'>Active</option>
          <option value='unsubscribed'>Unsubscribed</option>
          <option value='bounced'>Bounced</option>
        </select>
      </div>

      {/* Subscribers Table */}
      <div className='rounded-xl bg-slate-900/60 border border-white/10 overflow-hidden'>
        <Table>
          <TableHeader>
            <TableRow className='border-white/10'>
              <TableHead className='text-slate-400'>Email</TableHead>
              <TableHead className='text-slate-400'>Name</TableHead>
              <TableHead className='text-slate-400'>Source</TableHead>
              <TableHead className='text-slate-400'>Status</TableHead>
              <TableHead className='text-slate-400'>Subscribed</TableHead>
              <TableHead className='text-slate-400'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubscribers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className='text-center text-slate-500 py-8'>
                  No subscribers found
                </TableCell>
              </TableRow>
            ) : (
              filteredSubscribers.map((sub) => (
                <TableRow key={sub.id} className='border-white/5'>
                  <TableCell className='text-white'>{sub.email}</TableCell>
                  <TableCell className='text-slate-300'>{sub.name || '-'}</TableCell>
                  <TableCell className='text-slate-400 text-sm'>{sub.source || '-'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      sub.status === 'active' 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : 'bg-slate-500/20 text-slate-400'
                    }`}>
                      {sub.status}
                    </span>
                  </TableCell>
                  <TableCell className='text-slate-300 text-sm'>
                    {new Date(sub.subscribedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => handleDelete(sub.id)}
                      className='text-red-400 hover:text-red-300 hover:bg-red-500/10'
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
