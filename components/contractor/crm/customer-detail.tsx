'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Briefcase,
  Tag,
  MessageSquare,
  ArrowLeft,
  Loader2,
  X,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import NotesTimeline from './notes-timeline';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: any;
  status: string;
  source: string | null;
  tags: string[];
  notes: Array<{ text: string; createdAt: Date; createdBy: string }>;
  totalJobs: number;
  totalSpent: number;
  lastContactedAt: Date | null;
  lastJobAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Message {
  id: string;
  content: string;
  senderName: string | null;
  senderEmail: string | null;
  role: string;
  createdAt: Date;
}

interface CustomerDetailProps {
  customerId: string;
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700 border-blue-200',
  contacted: 'bg-purple-100 text-purple-700 border-purple-200',
  quoted: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  negotiating: 'bg-orange-100 text-orange-700 border-orange-200',
  won: 'bg-green-100 text-green-700 border-green-200',
  lost: 'bg-gray-100 text-gray-700 border-gray-200',
  customer: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  inactive: 'bg-gray-100 text-gray-700 border-gray-200',
};

export default function CustomerDetail({ customerId }: CustomerDetailProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [tagText, setTagText] = useState('');
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    loadCustomerDetails();
  }, [customerId]);

  const loadCustomerDetails = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/contractor/crm/customers/${customerId}`);
      if (response.ok) {
        const data = await response.json();
        setCustomer(data.customer);
        setMessages(data.communicationHistory || []);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load customer details',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error loading customer details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load customer details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;

    try {
      const response = await fetch(`/api/contractor/crm/leads/${customerId}/notes`, {
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
        loadCustomerDetails(); // Reload to get updated notes
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

  const handleAddTag = async () => {
    if (!tagText.trim()) return;

    try {
      const response = await fetch(`/api/contractor/crm/leads/${customerId}/tags`, {
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
        loadCustomerDetails(); // Reload to get updated tags
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

  const handleRemoveTag = async (tag: string) => {
    try {
      const response = await fetch(`/api/contractor/crm/leads/${customerId}/tags`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Tag removed successfully',
        });
        loadCustomerDetails(); // Reload to get updated tags
      } else {
        toast({
          title: 'Error',
          description: 'Failed to remove tag',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error removing tag:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove tag',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateStatus = async () => {
    if (!newStatus) return;

    try {
      const response = await fetch(`/api/contractor/crm/leads/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Status updated successfully',
        });
        setStatusDialogOpen(false);
        loadCustomerDetails(); // Reload to get updated status
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update status',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Customer not found</p>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const statusColor = statusColors[customer.status] || statusColors.new;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{customer.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={statusColor}>
                {customer.status}
              </Badge>
              {customer.source && (
                <Badge variant="outline" className="text-xs">
                  {customer.source}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setNoteDialogOpen(true)}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Add Note
          </Button>
          <Button variant="outline" onClick={() => setTagDialogOpen(true)}>
            <Tag className="h-4 w-4 mr-2" />
            Add Tag
          </Button>
          <Button onClick={() => {
            setNewStatus(customer.status);
            setStatusDialogOpen(true);
          }}>
            Update Status
          </Button>
        </div>
      </div>

      {/* Customer Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-violet-600" />
              <span className="text-2xl font-bold">{customer.totalJobs}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold">
                ${customer.totalSpent.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Last Contacted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span className="text-sm">
                {customer.lastContactedAt
                  ? formatDistanceToNow(new Date(customer.lastContactedAt), {
                      addSuffix: true,
                    })
                  : 'Never'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Last Job
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              <span className="text-sm">
                {customer.lastJobAt
                  ? formatDistanceToNow(new Date(customer.lastJobAt), {
                      addSuffix: true,
                    })
                  : 'No jobs yet'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">{customer.email}</p>
            </div>
          </div>
          {customer.phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium">{customer.phone}</p>
              </div>
            </div>
          )}
          {customer.address && (
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Address</p>
                <p className="font-medium">
                  {customer.address.street && `${customer.address.street}, `}
                  {customer.address.city}, {customer.address.state}{' '}
                  {customer.address.zip}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tags */}
      {customer.tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {customer.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <NotesTimeline notes={customer.notes} messages={messages} />
        </CardContent>
      </Card>

      {/* Add Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
            <DialogDescription>
              Add a note to track your communication with this customer.
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
            <Button onClick={handleAddNote} disabled={!noteText.trim()}>
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
              Add a tag to organize and categorize this customer.
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
            <Button onClick={handleAddTag} disabled={!tagText.trim()}>
              Add Tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Status</DialogTitle>
            <DialogDescription>
              Change the status of this customer in your pipeline.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="quoted">Quoted</SelectItem>
                  <SelectItem value="negotiating">Negotiating</SelectItem>
                  <SelectItem value="won">Won</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus} disabled={!newStatus}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
