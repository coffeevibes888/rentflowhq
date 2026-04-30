'use client';

import { useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Briefcase, CheckCircle, Loader2, Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

const JOB_CATEGORIES = [
  { id: 'property-management', label: 'Property Management' },
  { id: 'maintenance', label: 'Maintenance' },
  { id: 'virtual-assistant', label: 'Virtual Assistant' },
  { id: 'leasing', label: 'Leasing' },
  { id: 'accounting', label: 'Accounting' },
  { id: 'construction', label: 'Construction' },
  { id: 'landscaping', label: 'Landscaping' },
  { id: 'cleaning', label: 'Cleaning' },
  { id: 'admin', label: 'Admin & Office' },
  { id: 'other', label: 'Other' },
];

interface PostJobDialogProps {
  isAuthenticated: boolean;
  onClose: () => void;
  onJobPosted: (job: any) => void;
}

export function PostJobDialog({ isAuthenticated, onClose, onJobPosted }: PostJobDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'full-time',
    category: 'general',
    location: '',
    isRemote: false,
    salaryMin: '',
    salaryMax: '',
    salaryType: 'yearly',
    requirements: '',
    benefits: '',
    companyName: '',
    companyAbout: '',
    experienceLevel: 'entry',
  });

  const updateForm = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.title || !form.description || !form.location) {
      toast.error('Title, description, and location are required');
      return;
    }

    if (!isAuthenticated) {
      toast.error('Please sign in to post a job');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          salaryMin: form.salaryMin || null,
          salaryMax: form.salaryMax || null,
          status: 'active',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        onJobPosted({
          ...data.job,
          salaryMin: data.job.salaryMin?.toString() || null,
          salaryMax: data.job.salaryMax?.toString() || null,
          applicantCount: 0,
          createdAt: data.job.createdAt,
        });
      } else {
        toast.error(data.error || 'Failed to post job');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Dialog open onOpenChange={() => onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign in to Post a Job</DialogTitle>
            <DialogDescription>
              You need an account to post jobs. It&apos;s free to sign up.
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-6">
            <Briefcase className="h-16 w-16 mx-auto text-emerald-500 mb-4" />
            <p className="text-slate-600 mb-6">
              Create a free account as a Property Manager, Contractor, or regular user to start posting jobs.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/sign-in">
                <Button variant="outline" className="font-bold">Sign In</Button>
              </Link>
              <Link href="/sign-up">
                <Button className="bg-emerald-600 hover:bg-emerald-700 font-bold">Sign Up Free</Button>
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (success) {
    return (
      <Dialog open onOpenChange={() => onClose()}>
        <DialogContent>
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 mx-auto text-emerald-500 mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">Job Posted!</h3>
            <p className="text-slate-600 mb-6">
              Your job listing is now live. Applicants will be able to find and apply to it.
            </p>
            <Button onClick={onClose} className="bg-emerald-600 hover:bg-emerald-700 font-bold">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-emerald-600" />
            Post a Job
          </DialogTitle>
          <DialogDescription>
            Fill out the details below to create your job listing. It&apos;s free.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div>
            <Label className="font-semibold">Job Title *</Label>
            <Input
              value={form.title}
              onChange={(e) => updateForm('title', e.target.value)}
              placeholder="e.g. Property Manager, Maintenance Technician, Virtual Assistant"
              className="mt-1"
            />
          </div>

          {/* Company */}
          <div>
            <Label className="font-semibold">Company / Business Name</Label>
            <Input
              value={form.companyName}
              onChange={(e) => updateForm('companyName', e.target.value)}
              placeholder="Your company name"
              className="mt-1"
            />
          </div>

          {/* Category & Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="font-semibold">Category</Label>
              <select
                value={form.category}
                onChange={(e) => updateForm('category', e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="general">General</option>
                {JOB_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="font-semibold">Job Type</Label>
              <select
                value={form.type}
                onChange={(e) => updateForm('type', e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="full-time">Full-Time</option>
                <option value="part-time">Part-Time</option>
                <option value="contract">Contract</option>
                <option value="temporary">Temporary</option>
                <option value="internship">Internship</option>
              </select>
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="font-semibold">Location *</Label>
              <Input
                value={form.location}
                onChange={(e) => updateForm('location', e.target.value)}
                placeholder="e.g. Austin, TX"
                className="mt-1"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer pb-2">
                <input
                  type="checkbox"
                  checked={form.isRemote}
                  onChange={(e) => updateForm('isRemote', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-semibold">Remote friendly</span>
              </label>
            </div>
          </div>

          {/* Salary */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="font-semibold">Salary Min</Label>
              <Input
                type="number"
                value={form.salaryMin}
                onChange={(e) => updateForm('salaryMin', e.target.value)}
                placeholder="40000"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="font-semibold">Salary Max</Label>
              <Input
                type="number"
                value={form.salaryMax}
                onChange={(e) => updateForm('salaryMax', e.target.value)}
                placeholder="60000"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="font-semibold">Pay Type</Label>
              <select
                value={form.salaryType}
                onChange={(e) => updateForm('salaryType', e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="yearly">Per Year</option>
                <option value="hourly">Per Hour</option>
                <option value="per-project">Per Project</option>
              </select>
            </div>
          </div>

          {/* Experience Level */}
          <div>
            <Label className="font-semibold">Experience Level</Label>
            <select
              value={form.experienceLevel}
              onChange={(e) => updateForm('experienceLevel', e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="entry">Entry Level</option>
              <option value="mid">Mid Level</option>
              <option value="senior">Senior</option>
              <option value="executive">Executive</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <Label className="font-semibold">Job Description *</Label>
            <Textarea
              value={form.description}
              onChange={(e) => updateForm('description', e.target.value)}
              placeholder="Describe the role, responsibilities, and what a typical day looks like..."
              rows={5}
              className="mt-1"
            />
          </div>

          {/* Requirements */}
          <div>
            <Label className="font-semibold">Requirements</Label>
            <Textarea
              value={form.requirements}
              onChange={(e) => updateForm('requirements', e.target.value)}
              placeholder="List qualifications, certifications, experience needed..."
              rows={3}
              className="mt-1"
            />
          </div>

          {/* Benefits */}
          <div>
            <Label className="font-semibold">Benefits</Label>
            <Textarea
              value={form.benefits}
              onChange={(e) => updateForm('benefits', e.target.value)}
              placeholder="Health insurance, PTO, flexible schedule, etc."
              rows={3}
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 font-bold"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
            Post Job
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
