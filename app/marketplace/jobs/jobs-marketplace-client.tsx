'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Search, 
  MapPin, 
  Clock, 
  DollarSign,
  Briefcase,
  Filter,
  ArrowUpDown,
  Users,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { MarketplaceJob } from '@/lib/actions/marketplace-jobs.actions';

interface JobsMarketplaceClientProps {
  initialJobs: MarketplaceJob[];
  total: number;
  searchParams: {
    category?: string;
    priority?: string;
    city?: string;
    state?: string;
    sortBy?: string;
  };
}

const CATEGORIES = [
  'All Categories',
  'plumbing',
  'electrical',
  'hvac',
  'painting',
  'landscaping',
  'general',
];

const PRIORITIES = [
  { value: 'all', label: 'All Priorities' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'budget_high', label: 'Budget: High to Low' },
  { value: 'budget_low', label: 'Budget: Low to High' },
  { value: 'deadline', label: 'Deadline Soon' },
];

const priorityColors: Record<string, string> = {
  urgent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

const categoryLabels: Record<string, string> = {
  plumbing: 'Plumbing',
  electrical: 'Electrical',
  hvac: 'HVAC',
  painting: 'Painting',
  landscaping: 'Landscaping',
  general: 'General Repairs',
};

export function JobsMarketplaceClient({ 
  initialJobs, 
  total,
  searchParams 
}: JobsMarketplaceClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(searchParams.city || '');
  const [category, setCategory] = useState(searchParams.category || 'All Categories');
  const [priority, setPriority] = useState(searchParams.priority || 'all');
  const [sortBy, setSortBy] = useState(searchParams.sortBy || 'newest');

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('city', searchQuery);
    if (category && category !== 'All Categories') params.set('category', category);
    if (priority && priority !== 'all') params.set('priority', priority);
    if (sortBy) params.set('sortBy', sortBy);
    
    router.push(`/marketplace/jobs?${params.toString()}`);
  };

  const formatBudget = (min: number | null, max: number | null) => {
    if (min && max) {
      return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    }
    if (max) {
      return `Up to $${max.toLocaleString()}`;
    }
    if (min) {
      return `From $${min.toLocaleString()}`;
    }
    return 'Budget not specified';
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const posted = new Date(date);
    const diffMs = now.getTime() - posted.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return formatDate(date);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Link href="/marketplace" className="text-sm text-muted-foreground hover:text-foreground">
            Marketplace
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium">Jobs</span>
        </div>
        <h1 className="text-3xl font-bold mb-2">Job Marketplace</h1>
        <p className="text-muted-foreground">
          Browse {total} available jobs posted by homeowners
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>
            
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat === 'All Categories' ? cat : categoryLabels[cat] || cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="w-full md:w-[160px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-[180px]">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={handleSearch}>
              <Filter className="h-4 w-4 mr-2" />
              Apply
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Jobs Grid */}
      {initialJobs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
            <p className="text-muted-foreground">
              Try adjusting your filters or check back later for new opportunities.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {initialJobs.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="outline" className="capitalize">
                    {categoryLabels[job.category] || job.category}
                  </Badge>
                  <Badge className={cn('capitalize', priorityColors[job.priority])}>
                    {job.priority}
                  </Badge>
                </div>
                <CardTitle className="text-lg line-clamp-2 mt-2">
                  {job.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                  {job.description}
                </p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span>{formatBudget(job.budgetMin, job.budgetMax)}</span>
                  </div>
                  
                  {(job.homeowner.city || job.homeowner.state) && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {[job.homeowner.city, job.homeowner.state].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Posted {getTimeAgo(job.createdAt)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{job.bidCount} bid{job.bidCount !== 1 ? 's' : ''}</span>
                  </div>

                  {job.bidDeadline && (
                    <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                      <AlertCircle className="h-4 w-4" />
                      <span>Deadline: {formatDate(job.bidDeadline)}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t">
                  <Link href={`/marketplace/jobs/${job.id}`}>
                    <Button className="w-full">View Details & Bid</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination placeholder */}
      {total > initialJobs.length && (
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Showing {initialJobs.length} of {total} jobs
          </p>
        </div>
      )}
    </div>
  );
}
