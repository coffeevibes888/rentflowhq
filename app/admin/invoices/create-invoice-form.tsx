'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { createTenantInvoice, getPropertyTenants } from '@/lib/actions/invoice.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Property {
  id: string;
  name: string;
  units: {
    id: string;
    name: string;
    leases: {
      id: string;
      tenant: { id: string; name: string; email: string } | null;
    }[];
  }[];
}

interface Tenant {
  id: string;
  name: string;
  email: string;
  unitName: string;
  leaseId: string;
}

interface CreateInvoiceFormProps {
  properties: Property[];
  preselectedPropertyId?: string;
  preselectedTenantId?: string;
  preselectedLeaseId?: string;
}

export default function CreateInvoiceForm({ 
  properties, 
  preselectedPropertyId,
  preselectedTenantId,
  preselectedLeaseId,
}: CreateInvoiceFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState(preselectedPropertyId || '');
  const [selectedTenantId, setSelectedTenantId] = useState(preselectedTenantId || '');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(false);

  // Load tenants when property changes
  useEffect(() => {
    if (!selectedPropertyId) {
      setTenants([]);
      return;
    }

    const loadTenants = async () => {
      setLoadingTenants(true);
      const result = await getPropertyTenants(selectedPropertyId);
      if (result.success) {
        setTenants(result.tenants);
        // If we have a preselected tenant, keep it selected
        if (preselectedTenantId && result.tenants.some((t: Tenant) => t.id === preselectedTenantId)) {
          setSelectedTenantId(preselectedTenantId);
        }
      }
      setLoadingTenants(false);
    };

    loadTenants();
  }, [selectedPropertyId, preselectedTenantId]);

  // Set preselected property on mount
  useEffect(() => {
    if (preselectedPropertyId) {
      setSelectedPropertyId(preselectedPropertyId);
    }
  }, [preselectedPropertyId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const selectedTenant = tenants.find(t => t.id === selectedTenantId);
    
    const data = {
      propertyId: formData.get('propertyId') as string,
      tenantId: selectedTenantId,
      leaseId: selectedTenant?.leaseId || preselectedLeaseId || undefined,
      amount: Number(formData.get('amount')),
      reason: formData.get('reason') as string,
      description: formData.get('description') as string || undefined,
      dueDate: new Date(formData.get('dueDate') as string).toISOString(),
    };

    const result = await createTenantInvoice(data);

    if (result.success) {
      toast({ description: result.message });
      (e.target as HTMLFormElement).reset();
      setSelectedPropertyId('');
      setSelectedTenantId('');
      setTenants([]);
    } else {
      toast({ variant: 'destructive', description: result.message });
    }

    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-200">Property</label>
        <select
          name="propertyId"
          required
          value={selectedPropertyId}
          onChange={(e) => {
            setSelectedPropertyId(e.target.value);
            setSelectedTenantId('');
          }}
          className="w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white"
        >
          <option value="">Select a property</option>
          {properties.map((prop) => (
            <option key={prop.id} value={prop.id}>
              {prop.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-200">Tenant</label>
        <select
          name="tenantId"
          required
          value={selectedTenantId}
          onChange={(e) => setSelectedTenantId(e.target.value)}
          disabled={!selectedPropertyId || loadingTenants}
          className="w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white disabled:bg-white/5 disabled:text-slate-400"
        >
          <option value="">
            {loadingTenants
              ? 'Loading tenants...'
              : !selectedPropertyId
              ? 'Select a property first'
              : tenants.length === 0
              ? 'No active tenants'
              : 'Select a tenant'}
          </option>
          {tenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.name} ({tenant.unitName})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-200">Amount ($)</label>
        <Input
          type="number"
          name="amount"
          required
          min="0.01"
          step="0.01"
          placeholder="e.g. 150.00"
          className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-200">Reason</label>
        <Input
          type="text"
          name="reason"
          required
          placeholder="e.g. Repair charge, Late fee, Pet violation"
          className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-200">Description (optional)</label>
        <Textarea
          name="description"
          placeholder="Additional details about this charge..."
          className="resize-none bg-white/10 border-white/20 text-white placeholder:text-slate-400"
          rows={3}
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-200">Due Date</label>
        <Input
          type="date"
          name="dueDate"
          required
          min={new Date().toISOString().split('T')[0]}
          className="bg-white/10 border-white/20 text-white"
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full bg-violet-600 hover:bg-violet-500">
        {isSubmitting ? 'Creating...' : 'Create Invoice'}
      </Button>
    </form>
  );
}
