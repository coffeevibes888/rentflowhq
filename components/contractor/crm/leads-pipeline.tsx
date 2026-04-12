'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LeadCard from './lead-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, Filter, Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Lead {
  id: string;
  status: string;
  source: string;
  createdAt: Date;
  customer: {
    name: string;
    email: string;
    phone: string | null;
    address: any;
  };
}

interface LeadsPipelineProps {
  initialLeads?: Lead[];
}

const LEAD_STATUSES = [
  { value: 'new', label: 'New', color: 'bg-blue-500' },
  { value: 'contacted', label: 'Contacted', color: 'bg-purple-500' },
  { value: 'quoted', label: 'Quoted', color: 'bg-yellow-500' },
  { value: 'negotiating', label: 'Negotiating', color: 'bg-orange-500' },
  { value: 'won', label: 'Won', color: 'bg-green-500' },
  { value: 'lost', label: 'Lost', color: 'bg-gray-500' },
];

export default function LeadsPipeline({ initialLeads = [] }: LeadsPipelineProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>(initialLeads);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [tagText, setTagText] = useState('');

  // Load leads on mount
  useEffect(() => {
    loadLeads();
  }, []);

  // Filter leads when search or filters change
  useEffect(() => {
    let filtered = leads;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (lead) =>
          lead.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lead.customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lead.customer.phone?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((lead) => lead.status === statusFilter);
    }

    // Apply source filter
    if (sourceFilter !== 'all') {
      filtered = filtered.filter((lead) => lead.source === sourceFilter);
    }

    setFilteredLeads(filtered);
  }, [leads, searchQuery, statusFilter, sourceFilter]);

  const loadLeads = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/contractor/crm/leads');
      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads || []);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load leads',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error loading leads:', error);
      toast({
        title: 'Error',
        description: 'Failed to load leads',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/contractor/crm/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Update local state
        setLeads((prev) =>
          prev.map((lead) =>
            lead.id === leadId ? { ...lead, status: newStatus } : lead
          )
        );
        toast({
          title: 'Success',
          description: `Lead status updated to ${newStatus}`,
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update lead status',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating lead status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update lead status',
        variant: 'destructive',
      });
    }
  };

  const handleAddNote = (leadId: string) => {
    setSelectedLeadId(leadId);
    setNoteText('');
    setNoteDialogOpen(true);
  };

  const handleAddTag = (leadId: string) => {
    setSelectedLeadId(leadId);
    setTagText('');
    setTagDialogOpen(true);
  };

  const handleSaveNote = async () => {
    if (!selectedLeadId || !noteText.trim()) return;

    try {
      const response = await fetch(`/api/contractor/crm/leads/${selectedLeadId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: noteText }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Note added successfully',
        });
        setNoteDialogOpen(false);
        setNoteText('');
      } else {
        toast({
          title: 'Error',
          description: 'Failed to add note',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: 'Error',
        description: 'Failed to add note',
        variant: 'destructive',
      });
    }
  };

  const handleSaveTag = async () => {
    if (!selectedLeadId || !tagText.trim()) return;

    try {
      const response = await fetch(`/api/contractor/crm/leads/${selectedLeadId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag: tagText }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Tag added successfully',
        });
        setTagDialogOpen(false);
        setTagText('');
      } else {
        toast({
          title: 'Error',
          description: 'Failed to add tag',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error adding tag:', error);
      toast({
        title: 'Error',
        description: 'Failed to add tag',
        variant: 'destructive',
      });
    }
  };

  const handleLeadClick = (leadId: string) => {
    router.push(`/contractor/crm/customers/${leadId}`);
  };

  // Group leads by status for Kanban view
  const leadsByStatus = LEAD_STATUSES.reduce((acc, status) => {
    acc[status.value] = filteredLeads.filter((lead) => lead.status === status.value);
    return acc;
  }, {} as Record<string, Lead[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leads Pipeline</h1>
          <p className="text-gray-600 mt-1">
            Manage and track your leads through the sales pipeline
          </p>
        </div>
        <Button onClick={loadLeads} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            'Refresh'
          )}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search leads by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {LEAD_STATUSES.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="marketplace">Marketplace</SelectItem>
            <SelectItem value="subdomain">Website</SelectItem>
            <SelectItem value="referral">Referral</SelectItem>
            <SelectItem value="job_posting">Job Post</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {LEAD_STATUSES.map((status) => (
          <div key={status.value} className="flex flex-col">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${status.color}`} />
                <h3 className="font-semibold">{status.label}</h3>
                <span className="text-sm text-gray-500">
                  ({leadsByStatus[status.value]?.length || 0})
                </span>
              </div>
            </div>
            <div className="space-y-3 flex-1">
              {leadsByStatus[status.value]?.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onStatusChange={handleStatusChange}
                  onAddNote={handleAddNote}
                  onAddTag={handleAddTag}
                  onClick={handleLeadClick}
                />
              ))}
              {leadsByStatus[status.value]?.length === 0 && (
                <div className="text-center text-gray-400 text-sm py-8">
                  No leads in this stage
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
            <DialogDescription>
              Add a note to track your communication with this lead.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="note">Note</Label>
              <Textarea
                id="note"
                placeholder="Enter your note here..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNote} disabled={!noteText.trim()}>
              Save Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Tag Dialog */}
      <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tag</DialogTitle>
            <DialogDescription>
              Add a tag to organize and categorize this lead.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="tag">Tag</Label>
              <Input
                id="tag"
                placeholder="e.g., high-priority, follow-up, etc."
                value={tagText}
                onChange={(e) => setTagText(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTagDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTag} disabled={!tagText.trim()}>
              Add Tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
