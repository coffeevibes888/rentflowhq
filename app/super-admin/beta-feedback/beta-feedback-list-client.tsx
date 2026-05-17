'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Filter,
  Sparkles,
  Star,
  Users,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { BetaInsights } from '@/lib/actions/super-admin-beta.actions';

type FeedbackItem = {
  id: string;
  audience: 'pm' | 'contractor';
  category: string;
  subject: string;
  bodyPreview: string;
  npsScore: number | null;
  consentToUseInMarketing: boolean;
  status: string;
  priority: string;
  isFeaturedTestimonial: boolean;
  messageCount: number;
  createdAt: string;
  tester: {
    userId: string;
    userName: string | null;
    userEmail: string | null;
    programCode: string;
    freePeriodEnd: string;
  };
};

interface Props {
  insights: BetaInsights;
  items: FeedbackItem[];
  initialFilters: {
    audience: 'pm' | 'contractor' | 'all';
    status: string;
    category: string;
    featured: boolean;
    query: string;
  };
}

const STATUS_LABEL: Record<string, { label: string; tone: string }> = {
  new: { label: 'New', tone: 'bg-amber-100 text-amber-800 border-amber-200' },
  in_review: { label: 'In review', tone: 'bg-blue-100 text-blue-800 border-blue-200' },
  replied: { label: 'Replied', tone: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  resolved: { label: 'Resolved', tone: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  archived: { label: 'Archived', tone: 'bg-gray-100 text-gray-700 border-gray-200' },
};

const CATEGORY_LABEL: Record<string, string> = {
  like: 'Like',
  dislike: 'Dislike',
  complaint: 'Complaint',
  bug: 'Bug',
  feature: 'Feature',
  testimonial: 'Testimonial',
};

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

export function BetaFeedbackListClient({ insights, items, initialFilters }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(initialFilters.query);

  const updateParam = (patch: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams?.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '') params.delete(k);
      else params.set(k, v);
    }
    startTransition(() => router.push(`/super-admin/beta-feedback?${params.toString()}`));
  };

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam({ q: query.trim() || null });
  };

  const audienceOptions = ['all', 'pm', 'contractor'];
  const statusOptions = ['all', 'new', 'in_review', 'replied', 'resolved', 'archived'];
  const categoryOptions = ['all', 'like', 'dislike', 'complaint', 'bug', 'feature', 'testimonial'];

  return (
    <div className='space-y-6 text-slate-50'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3'>
        <div>
          <h1 className='text-2xl sm:text-3xl font-bold text-white'>Beta Feedback</h1>
          <p className='text-sm text-white/70 mt-1'>
            Honest input from your 25-by-25 beta cohort. Reply, triage, and pull testimonials for
            marketing.
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-3'>
        {insights.programs.map((p) => (
          <ProgramStatCard key={p.code} program={p} />
        ))}
        <Card className='bg-white/10 border-white/15 text-white'>
          <CardContent className='p-4'>
            <div className='flex items-center gap-2 text-xs uppercase tracking-wide text-white/70'>
              <TrendingUp className='h-4 w-4' /> Avg NPS
            </div>
            <div className='text-2xl font-bold mt-1'>
              {insights.totals.avgNps !== null ? insights.totals.avgNps.toFixed(1) : '—'}
            </div>
            <div className='text-xs text-white/60 mt-1'>
              {insights.totals.npsResponses} response
              {insights.totals.npsResponses === 1 ? '' : 's'}
            </div>
          </CardContent>
        </Card>
        <Card className='bg-white/10 border-white/15 text-white'>
          <CardContent className='p-4'>
            <div className='flex items-center gap-2 text-xs uppercase tracking-wide text-white/70'>
              <Star className='h-4 w-4' /> Featured testimonials
            </div>
            <div className='text-2xl font-bold mt-1'>{insights.totals.featuredTestimonials}</div>
            <div className='text-xs text-white/60 mt-1'>Cleared for marketing use</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className='bg-white text-slate-900'>
        <CardHeader className='pb-3'>
          <CardTitle className='flex items-center gap-2'>
            <Filter className='h-4 w-4' />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={onSearch}
            className='flex flex-wrap gap-2 items-end'
          >
            <div className='space-y-1 min-w-[140px]'>
              <label className='text-xs font-semibold text-slate-700'>Audience</label>
              <Select
                value={initialFilters.audience}
                onValueChange={(v) => updateParam({ audience: v === 'all' ? null : v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {audienceOptions.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a === 'all' ? 'All' : a === 'pm' ? 'PM' : 'Contractor'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-1 min-w-[140px]'>
              <label className='text-xs font-semibold text-slate-700'>Status</label>
              <Select
                value={initialFilters.status}
                onValueChange={(v) => updateParam({ status: v === 'all' ? null : v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s === 'all' ? 'All statuses' : (STATUS_LABEL[s]?.label ?? s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-1 min-w-[140px]'>
              <label className='text-xs font-semibold text-slate-700'>Category</label>
              <Select
                value={initialFilters.category}
                onValueChange={(v) => updateParam({ category: v === 'all' ? null : v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c === 'all' ? 'All categories' : (CATEGORY_LABEL[c] ?? c)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='flex items-center gap-2'>
              <input
                id='featured-only'
                type='checkbox'
                checked={initialFilters.featured}
                onChange={(e) => updateParam({ featured: e.target.checked ? '1' : null })}
              />
              <label htmlFor='featured-only' className='text-sm text-slate-700'>
                Featured only
              </label>
            </div>
            <div className='space-y-1 flex-1 min-w-[200px]'>
              <label className='text-xs font-semibold text-slate-700'>Search</label>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='Subject or body...'
              />
            </div>
            <Button type='submit' disabled={pending}>
              Apply
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* List */}
      <div className='space-y-2'>
        {items.length === 0 ? (
          <Card className='bg-white text-slate-900'>
            <CardContent className='p-8 text-center text-sm text-slate-500'>
              No feedback matches these filters.
            </CardContent>
          </Card>
        ) : (
          items.map((item) => <FeedbackRow key={item.id} item={item} />)
        )}
      </div>
    </div>
  );
}

function ProgramStatCard({ program }: { program: BetaInsights['programs'][number] }) {
  const tone =
    program.audience === 'pm'
      ? 'from-violet-500 to-purple-500'
      : 'from-amber-500 to-orange-500';
  const remaining = program.spotsRemaining;
  const percent = Math.round((program.redeemedCount / program.maxRedemptions) * 100);
  return (
    <Card className='bg-white/10 border-white/15 text-white relative overflow-hidden'>
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${tone}`} />
      <CardContent className='p-4'>
        <div className='flex items-center gap-2 text-xs uppercase tracking-wide text-white/80'>
          <Sparkles className='h-4 w-4' />
          {program.audience === 'pm' ? 'PM Program' : 'Contractor Program'}
        </div>
        <div className='text-2xl font-bold mt-1'>
          {program.redeemedCount}
          <span className='text-base text-white/70'> / {program.maxRedemptions}</span>
        </div>
        <div className='mt-2 h-1.5 rounded-full bg-white/20 overflow-hidden'>
          <div
            className={`h-full bg-gradient-to-r ${tone}`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className='text-xs text-white/70 mt-2'>
          Code <span className='font-mono text-white'>{program.code}</span>
          {' · '}
          {remaining === 0 ? 'No spots left' : `${remaining} spot${remaining === 1 ? '' : 's'} left`}
        </div>
      </CardContent>
    </Card>
  );
}

function FeedbackRow({ item }: { item: FeedbackItem }) {
  const status = STATUS_LABEL[item.status] ?? STATUS_LABEL.new;
  return (
    <Link
      href={`/super-admin/beta-feedback/${item.id}`}
      className='block rounded-xl border border-white/15 bg-white text-slate-900 p-3 sm:p-4 hover:border-violet-400 transition-colors'
    >
      <div className='flex flex-wrap items-center gap-2 text-xs'>
        <Badge className='bg-slate-900 text-white'>{item.audience === 'pm' ? 'PM' : 'Contractor'}</Badge>
        <Badge className='bg-violet-100 text-violet-800 border-violet-200'>
          {CATEGORY_LABEL[item.category] ?? item.category}
        </Badge>
        <Badge className={status.tone}>{status.label}</Badge>
        {item.priority !== 'normal' && (
          <Badge className='bg-rose-100 text-rose-800 border-rose-200 capitalize'>
            {item.priority}
          </Badge>
        )}
        {item.isFeaturedTestimonial && (
          <Badge className='bg-amber-100 text-amber-800 border-amber-200'>
            <Star className='h-3 w-3 mr-1' /> Featured
          </Badge>
        )}
        {typeof item.npsScore === 'number' && (
          <Badge className='bg-blue-100 text-blue-800 border-blue-200'>NPS {item.npsScore}</Badge>
        )}
        {item.consentToUseInMarketing && (
          <Badge className='bg-emerald-100 text-emerald-800 border-emerald-200'>
            Consent
          </Badge>
        )}
        <span className='ml-auto text-slate-500'>{formatDateTime(item.createdAt)}</span>
      </div>
      <h3 className='font-semibold mt-2'>{item.subject}</h3>
      <p className='text-sm text-slate-600 line-clamp-2 mt-0.5'>{item.bodyPreview}</p>
      <div className='flex items-center gap-2 text-xs text-slate-500 mt-2'>
        <Users className='h-3 w-3' />
        <span>{item.tester.userName ?? 'Unknown'}</span>
        <span>·</span>
        <span>{item.tester.userEmail}</span>
        <span>·</span>
        <span className='font-mono'>{item.tester.programCode}</span>
        {item.messageCount > 0 && (
          <>
            <span>·</span>
            <span>{item.messageCount} message{item.messageCount === 1 ? '' : 's'}</span>
          </>
        )}
      </div>
    </Link>
  );
}
