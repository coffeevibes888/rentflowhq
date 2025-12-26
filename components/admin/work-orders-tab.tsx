'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  ClipboardList,
  Loader2,
  Building2,
  DollarSign,
  Calendar,
  User,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

interface WorkOrder {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  agreedPrice: string;
  actualCost: string | null;
  scheduledDate: string | null;
  completedAt: string | null;
  notes: string | null;
  contractor: { name: string; email: string };
  property: { name: string };
  unit: { name: string } | null;
  maintenanceTicket: { title: string } | null;
  mediaCount: number;
  createdAt: string;
}

interface Contractor {
  id: string;
  name: string;
  email: string;
}

interface Property {
  id: string;
  name: string;
  units: { id: string; name: string }[];
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-500',
  assigned: 'bg-blue-500',
  in_progress: 'bg-yellow-500',
  completed: 'bg-green-500',
  paid: 'bg-purple-500',
  cancelled: 'bg-red-500',
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-400',
  medium: 'bg-blue-400',
  high: 'bg-orange-400',
  urgent: 'bg-red-500',
};

export default function WorkOrdersTab() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    contractorId: '',
    propertyId: '',
    unitId: '',
    title: '',
    description: '',
    priority: 'medium',
    agreedPrice: '',
    scheduledDate: '',
    notes: '',
  });

  const fetchWorkOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/work-orders?${params}`);
      const data = await res.json();

      if (data.workOrders) {
        setWorkOrders(data.workOrders);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load work orders',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchContractors = async () => {
    try {
      const res = await fetch('/api/contractors');
      const data = await res.json();
      if (data.contractors) {
        setContractors(data.contractors);
      }
    } catch (error) {
      console.error('Failed to fetch contractors:', error);
    }
  };

  const fetchProperties = async () => {
    try {
      const res = await fetch('/api/admin/properties');
      const data = await res.json();
      if (data.properties) {
        setProperties(data.properties);
      }
    } catch (error) {
      console.error('Failed to fetch properties:', error);
    }
  };

  useEffect(() => {
    fetchWorkOrders();
    fetchContractors();
    fetchProperties();
  }, [statusFilter]);

  const handleCreateWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          agreedPrice: parseFloat(formData.agreedPrice),
          scheduledDate: formData.scheduledDate || undefined,
          unitId: formData.unitId || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create work order');
      }

      toast({
        title: 'Success',
        description: 'Work order created',
      });

      setIsCreateOpen(false);
      setFormData({
        contractorId: '',
        propertyId: '',
        unitId: '',
        title: '',
        description: '',
        priority: 'medium',
        agreedPrice: '',
        scheduledDate: '',
        notes: '',
      });
      fetchWorkOrders();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create work order',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (workOrderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/work-orders/${workOrderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update status');
      }

      toast({
        title: 'Success',
        description: `Work order marked as ${newStatus.replace('_', ' ')}`,
      });

      fetchWorkOrders();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  const selectedProperty = properties.find((p) => p.id === formData.propertyId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button disabled={contractors.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Create Work Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Work Order</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateWorkOrder} className="space-y-4">
              <div className="space-y-2">
                <Label>Contractor *</Label>
                <Select
                  value={formData.contractorId}
                  onValueChange={(v) => setFormData({ ...formData, contractorId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select contractor" />
                  </SelectTrigger>
                  <SelectContent>
                    {contractors.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Property *</Label>
                <Select
                  value={formData.propertyId}
                  onValueChange={(v) => setFormData({ ...formData, propertyId: v, unitId: '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedProperty && selectedProperty.units?.length > 0 && (
                <div className="space-y-2">
                  <Label>Unit (optional)</Label>
                  <Select
                    value={formData.unitId}
                    onValueChange={(v) => setFormData({ ...formData, unitId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedProperty.units.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(v) => setFormData({ ...formData, priority: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agreedPrice">Agreed Price *</Label>
                  <Input
                    id="agreedPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.agreedPrice}
                    onChange={(e) => setFormData({ ...formData, agreedPrice: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduledDate">Scheduled Date</Label>
                <Input
                  id="scheduledDate"
                  type="datetime-local"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !formData.contractorId || !formData.propertyId}
                >
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Work Order
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {workOrders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No work orders yet</h3>
            <p className="text-muted-foreground mb-4">
              Create work orders to assign jobs to your contractors
            </p>
            {contractors.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Add contractors to your directory first
              </p>
            ) : (
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Work Order
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {workOrders.map((wo) => (
            <Card key={wo.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{wo.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{wo.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={priorityColors[wo.priority]}>
                      {wo.priority}
                    </Badge>
                    <Badge className={statusColors[wo.status]}>
                      {wo.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{wo.contractor.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {wo.property.name}
                      {wo.unit && ` - ${wo.unit.name}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>{formatCurrency(parseFloat(wo.agreedPrice))}</span>
                  </div>
                  {wo.scheduledDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(wo.scheduledDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  {wo.status === 'assigned' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatus(wo.id, 'in_progress')}
                    >
                      Start Work
                    </Button>
                  )}
                  {wo.status === 'in_progress' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatus(wo.id, 'completed')}
                    >
                      Mark Complete
                    </Button>
                  )}
                  {wo.status === 'completed' && (
                    <Button
                      size="sm"
                      onClick={() => {
                        // Navigate to payment or trigger payment modal
                        window.location.href = `/admin/contractors?pay=${wo.id}`;
                      }}
                    >
                      Pay Contractor
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
