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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Plus,
  ClipboardList,
  Loader2,
  Building2,
  DollarSign,
  Calendar,
  User,
  Globe,
  Send,
  Users,
  Pencil,
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
  isOpenForBids: boolean;
  contractor: { id: string; name: string; email: string } | null;
  property: { id: string; name: string };
  unit: { id: string; name: string } | null;
  maintenanceTicket: { title: string } | null;
  mediaCount: number;
  createdAt: string;
  _count?: { bids: number };
  budgetMin?: string | null;
  budgetMax?: string | null;
}

interface Contractor {
  id: string;
  name: string;
  email: string;
  specialties: string[];
}

interface Property {
  id: string;
  name: string;
  units: { id: string; name: string }[];
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-500',
  open: 'bg-cyan-500',
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
  const [editingWorkOrder, setEditingWorkOrder] = useState<WorkOrder | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    assignmentType: 'direct', // 'direct' or 'marketplace'
    contractorId: '',
    propertyId: '',
    unitId: '',
    title: '',
    description: '',
    priority: 'medium',
    agreedPrice: '',
    budgetMin: '',
    budgetMax: '',
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
      const isMarketplace = formData.assignmentType === 'marketplace';
      
      const payload: any = {
        propertyId: formData.propertyId,
        unitId: formData.unitId || undefined,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        scheduledDate: formData.scheduledDate || undefined,
        notes: formData.notes || undefined,
        isOpenForBids: isMarketplace,
      };

      if (isMarketplace) {
        // For marketplace, use budget range
        payload.budgetMin = formData.budgetMin ? parseFloat(formData.budgetMin) : undefined;
        payload.budgetMax = formData.budgetMax ? parseFloat(formData.budgetMax) : undefined;
        payload.status = 'open';
      } else {
        // For direct assignment
        payload.contractorId = formData.contractorId;
        payload.agreedPrice = parseFloat(formData.agreedPrice);
        payload.status = 'assigned';
      }

      let res;
      if (editingWorkOrder) {
        // Update existing work order
        res = await fetch(`/api/work-orders/${editingWorkOrder.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new work order
        res = await fetch('/api/work-orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Failed to ${editingWorkOrder ? 'update' : 'create'} work order`);
      }

      toast({
        title: 'Success',
        description: editingWorkOrder 
          ? 'Work order updated successfully'
          : isMarketplace 
            ? 'Work order posted to marketplace for bidding' 
            : 'Work order created and assigned',
      });

      setIsCreateOpen(false);
      setEditingWorkOrder(null);
      resetForm();
      fetchWorkOrders();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : `Failed to ${editingWorkOrder ? 'update' : 'create'} work order`,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      assignmentType: 'direct',
      contractorId: '',
      propertyId: '',
      unitId: '',
      title: '',
      description: '',
      priority: 'medium',
      agreedPrice: '',
      budgetMin: '',
      budgetMax: '',
      scheduledDate: '',
      notes: '',
    });
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
  const isMarketplace = formData.assignmentType === 'marketplace';

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
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="open">Open for Bids</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>

        <Dialog open={isCreateOpen} onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) {
            resetForm();
            setEditingWorkOrder(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Work Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingWorkOrder ? 'Edit Work Order' : 'Create Work Order'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateWorkOrder} className="space-y-4">
              {/* Assignment Type */}
              <div className="space-y-3">
                <Label>How would you like to assign this job?</Label>
                <RadioGroup
                  value={formData.assignmentType}
                  onValueChange={(v) => setFormData({ ...formData, assignmentType: v, contractorId: '' })}
                  className="grid grid-cols-2 gap-3"
                >
                  <div className={`flex items-center space-x-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.assignmentType === 'direct' 
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-950' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <RadioGroupItem value="direct" id="direct" />
                    <Label htmlFor="direct" className="cursor-pointer flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      <div>
                        <p className="font-medium">Direct Assign</p>
                        <p className="text-xs text-muted-foreground">Send to a contractor</p>
                      </div>
                    </Label>
                  </div>
                  <div className={`flex items-center space-x-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.assignmentType === 'marketplace' 
                      ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <RadioGroupItem value="marketplace" id="marketplace" />
                    <Label htmlFor="marketplace" className="cursor-pointer flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <div>
                        <p className="font-medium">Post for Bids</p>
                        <p className="text-xs text-muted-foreground">Let contractors bid</p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Contractor Selection (only for direct) */}
              {!isMarketplace && (
                <div className="space-y-2">
                  <Label>Contractor *</Label>
                  {contractors.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200">
                      No contractors in your directory. Add contractors first or post to marketplace for bids.
                    </p>
                  ) : (
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
                            <div className="flex flex-col">
                              <span>{c.name}</span>
                              {c.specialties?.length > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  {c.specialties.slice(0, 2).join(', ')}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

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
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Fix leaking faucet in bathroom"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the work needed in detail..."
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

                {isMarketplace ? (
                  <div className="space-y-2">
                    <Label>Budget Range</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Min"
                        value={formData.budgetMin}
                        onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
                      />
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Max"
                        value={formData.budgetMax}
                        onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="agreedPrice">Agreed Price *</Label>
                    <Input
                      id="agreedPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.agreedPrice}
                      onChange={(e) => setFormData({ ...formData, agreedPrice: e.target.value })}
                      required={!isMarketplace}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduledDate">Preferred Date (optional)</Label>
                <Input
                  id="scheduledDate"
                  type="datetime-local"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any special instructions or access details..."
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !formData.propertyId || !formData.title || (!isMarketplace && !formData.contractorId)}
                  className={isMarketplace ? 'bg-cyan-600 hover:bg-cyan-700' : ''}
                >
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {isMarketplace ? (
                    <>
                      <Globe className="h-4 w-4 mr-2" />
                      Post for Bids
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Assign to Contractor
                    </>
                  )}
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
              Create work orders to assign jobs to contractors or post them for bidding
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Work Order
            </Button>
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
                      {wo.status === 'open' ? 'Open for Bids' : wo.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    {wo.contractor ? (
                      <>
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{wo.contractor.name}</span>
                      </>
                    ) : wo.isOpenForBids ? (
                      <>
                        <Users className="h-4 w-4 text-cyan-500" />
                        <span className="text-cyan-600">
                          {wo._count?.bids || 0} bid{(wo._count?.bids || 0) !== 1 ? 's' : ''}
                        </span>
                      </>
                    ) : (
                      <>
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Unassigned</span>
                      </>
                    )}
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
                    <span>{wo.agreedPrice ? formatCurrency(parseFloat(wo.agreedPrice)) : 'TBD'}</span>
                  </div>
                  {wo.scheduledDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(wo.scheduledDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  {wo.status === 'draft' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingWorkOrder(wo);
                        setFormData({
                          assignmentType: wo.isOpenForBids ? 'marketplace' : 'direct',
                          contractorId: wo.contractor?.id || '',
                          propertyId: wo.property?.id || '',
                          unitId: wo.unit?.id || '',
                          title: wo.title,
                          description: wo.description,
                          priority: wo.priority,
                          agreedPrice: wo.agreedPrice || '',
                          budgetMin: wo.budgetMin || '',
                          budgetMax: wo.budgetMax || '',
                          scheduledDate: wo.scheduledDate ? new Date(wo.scheduledDate).toISOString().slice(0, 16) : '',
                          notes: wo.notes || '',
                        });
                        setIsCreateOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit Draft
                    </Button>
                  )}
                  {wo.status === 'open' && wo._count && wo._count.bids > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        window.location.href = `/admin/contractors?viewBids=${wo.id}`;
                      }}
                    >
                      <Users className="h-4 w-4 mr-1" />
                      View Bids ({wo._count.bids})
                    </Button>
                  )}
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
