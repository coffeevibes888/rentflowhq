'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertCircle } from 'lucide-react';
import { UpgradeModal } from '@/components/contractor/subscription/UpgradeModal';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Customer {
  id: string;
  name: string;
  email: string;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
}

interface JobFormProps {
  customers: Customer[];
  employees: Employee[];
  initialData?: any;
}

export function JobForm({ customers, employees, initialData }: JobFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [limitInfo, setLimitInfo] = useState<{
    current: number;
    limit: number;
    remaining: number;
    percentage: number;
    tier: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    jobType: initialData?.jobType || '',
    customerId: initialData?.customerId || '',
    address: initialData?.address || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    zipCode: initialData?.zipCode || '',
    estimatedCost: initialData?.estimatedCost || '',
    laborCost: initialData?.laborCost || '',
    materialCost: initialData?.materialCost || '',
    estimatedStartDate: initialData?.estimatedStartDate?.split('T')[0] || '',
    estimatedEndDate: initialData?.estimatedEndDate?.split('T')[0] || '',
    estimatedHours: initialData?.estimatedHours || '',
    assignedEmployeeIds: initialData?.assignedEmployeeIds || [],
    notes: initialData?.notes || '',
    priority: initialData?.priority || 'normal',
    status: initialData?.status || 'quoted',
  });

  // Fetch limit info on mount
  useEffect(() => {
    const fetchLimitInfo = async () => {
      try {
        const response = await fetch('/api/contractor/subscription/check-limit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ feature: 'activeJobs' }),
        });

        if (response.ok) {
          const data = await response.json();
          setLimitInfo(data);
        }
      } catch (error) {
        console.error('Error fetching limit info:', error);
      }
    };

    fetchLimitInfo();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/contractor/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : null,
          laborCost: formData.laborCost ? parseFloat(formData.laborCost) : null,
          materialCost: formData.materialCost ? parseFloat(formData.materialCost) : null,
          estimatedHours: formData.estimatedHours ? parseInt(formData.estimatedHours) : null,
          estimatedStartDate: formData.estimatedStartDate || null,
          estimatedEndDate: formData.estimatedEndDate || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if it's a subscription limit error
        if (data.error === 'SUBSCRIPTION_LIMIT_REACHED') {
          setShowUpgradeModal(true);
          return;
        }
        throw new Error(data.error || 'Failed to create job');
      }

      toast({
        title: 'Success!',
        description: 'Job created successfully',
      });

      router.push(`/contractor/jobs/${data.job.id}`);
    } catch (error) {
      console.error('Error creating job:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create job',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-6">
        {/* Limit Warning Banner */}
        {limitInfo && limitInfo.limit !== -1 && (
          <Alert className={`${
            limitInfo.remaining === 0
              ? 'bg-red-500/10 border-red-500/50'
              : limitInfo.percentage >= 80
              ? 'bg-yellow-500/10 border-yellow-500/50'
              : 'bg-blue-500/10 border-blue-500/50'
          }`}>
            <AlertCircle className={`h-4 w-4 ${
              limitInfo.remaining === 0
                ? 'text-red-500'
                : limitInfo.percentage >= 80
                ? 'text-yellow-500'
                : 'text-blue-500'
            }`} />
            <AlertDescription className="text-white">
              {limitInfo.remaining === 0 ? (
                <>
                  You've reached your limit of {limitInfo.limit} active jobs.{' '}
                  <button
                    type="button"
                    onClick={() => setShowUpgradeModal(true)}
                    className="underline font-semibold hover:text-violet-400"
                  >
                    Upgrade to Pro
                  </button>{' '}
                  for 50 jobs/month.
                </>
              ) : limitInfo.percentage >= 80 ? (
                <>
                  You're using {limitInfo.current} of {limitInfo.limit} active jobs ({limitInfo.percentage}%).{' '}
                  Consider{' '}
                  <button
                    type="button"
                    onClick={() => setShowUpgradeModal(true)}
                    className="underline font-semibold hover:text-violet-400"
                  >
                    upgrading
                  </button>{' '}
                  to avoid interruptions.
                </>
              ) : (
                <>
                  You have {limitInfo.remaining} of {limitInfo.limit} active jobs remaining this month.
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Basic Info */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-white">Job Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="bg-white/5 border-white/10 text-white"
                placeholder="Kitchen Remodel"
              />
            </div>

            <div>
              <Label htmlFor="jobType" className="text-white">Job Type</Label>
              <Input
                id="jobType"
                value={formData.jobType}
                onChange={(e) => setFormData({ ...formData, jobType: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Kitchen, Bathroom, Deck, etc."
              />
            </div>

            <div>
              <Label htmlFor="customerId" className="text-white">Customer</Label>
              <select
                id="customerId"
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                className="w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 text-white"
              >
                <option value="">Select customer...</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} ({customer.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="description" className="text-white">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                rows={4}
                placeholder="Detailed description of the work..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status" className="text-white">Status</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 text-white"
                >
                  <option value="quoted">Quoted</option>
                  <option value="approved">Approved</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="in_progress">In Progress</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <Label htmlFor="priority" className="text-white">Priority</Label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 text-white"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="address" className="text-white">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="123 Main St"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city" className="text-white">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div>
                <Label htmlFor="state" className="text-white">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                  maxLength={2}
                />
              </div>

              <div>
                <Label htmlFor="zipCode" className="text-white">Zip Code</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Financial Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="estimatedCost" className="text-white">Estimated Cost</Label>
                <Input
                  id="estimatedCost"
                  type="number"
                  step="0.01"
                  value={formData.estimatedCost}
                  onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="laborCost" className="text-white">Labor Cost</Label>
                <Input
                  id="laborCost"
                  type="number"
                  step="0.01"
                  value={formData.laborCost}
                  onChange={(e) => setFormData({ ...formData, laborCost: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="materialCost" className="text-white">Material Cost</Label>
                <Input
                  id="materialCost"
                  type="number"
                  step="0.01"
                  value={formData.materialCost}
                  onChange={(e) => setFormData({ ...formData, materialCost: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="0.00"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="estimatedStartDate" className="text-white">Start Date</Label>
                <Input
                  id="estimatedStartDate"
                  type="date"
                  value={formData.estimatedStartDate}
                  onChange={(e) => setFormData({ ...formData, estimatedStartDate: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div>
                <Label htmlFor="estimatedEndDate" className="text-white">End Date</Label>
                <Input
                  id="estimatedEndDate"
                  type="date"
                  value={formData.estimatedEndDate}
                  onChange={(e) => setFormData({ ...formData, estimatedEndDate: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div>
                <Label htmlFor="estimatedHours" className="text-white">Estimated Hours</Label>
                <Input
                  id="estimatedHours"
                  type="number"
                  value={formData.estimatedHours}
                  onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="0"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="bg-white/5 border-white/10 text-white"
              rows={4}
              placeholder="Internal notes about this job..."
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={loading}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Job
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="border-white/20 text-white hover:bg-white/10"
          >
            Cancel
          </Button>
        </div>
      </div>

      {/* Upgrade Modal */}
      {limitInfo && (
        <UpgradeModal
          open={showUpgradeModal}
          onOpenChange={setShowUpgradeModal}
          feature="active jobs"
          currentTier={limitInfo.tier}
          requiredTier="pro"
          currentLimit={limitInfo.limit}
          requiredLimit={50}
          benefits={[
            '50 active jobs per month',
            'Team management for up to 6 members',
            'CRM features with customer portal',
            'Lead management (100 active leads)',
            'Basic inventory tracking (200 items)',
            'Advanced scheduling and reporting',
          ]}
        />
      )}
    </form>
  );
}
