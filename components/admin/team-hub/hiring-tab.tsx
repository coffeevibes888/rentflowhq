'use client';

import { useState, useEffect } from 'react';
import { 
  Briefcase, Plus, Users, FileText, CheckCircle, 
  XCircle, Clock, Mail, Phone, MapPin, Calendar,
  ChevronRight, Eye, Trash2, Edit, Send, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

interface JobPosting {
  id: string;
  title: string;
  description: string;
  type: 'full-time' | 'part-time' | 'contract';
  location: string;
  salary?: string;
  status: 'draft' | 'active' | 'closed';
  applicantCount: number;
  createdAt: string;
}

interface Applicant {
  id: string;
  jobId: string;
  name: string;
  email: string;
  phone?: string;
  resumeUrl?: string;
  coverLetter?: string;
  status: 'new' | 'reviewing' | 'interview' | 'offered' | 'hired' | 'rejected';
  appliedAt: string;
  job?: { id: string; title: string };
}

interface HiringTabProps {
  landlordId: string;
}

export function HiringTab({ landlordId }: HiringTabProps) {
  const [activeTab, setActiveTab] = useState('postings');
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [showApplicantDetails, setShowApplicantDetails] = useState<Applicant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);

  // New job form state
  const [newJob, setNewJob] = useState({
    title: '',
    description: '',
    type: 'full-time' as const,
    location: '',
    salary: '',
  });

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [jobsRes, applicantsRes] = await Promise.all([
        fetch('/api/landlord/hiring/jobs'),
        fetch('/api/landlord/hiring/applicants'),
      ]);
      
      const jobsData = await jobsRes.json();
      const applicantsData = await applicantsRes.json();
      
      if (jobsData.success) {
        setJobPostings(jobsData.jobs);
      }
      if (applicantsData.success) {
        setApplicants(applicantsData.applicants);
      }
    } catch (error) {
      console.error('Failed to fetch hiring data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateJob = async () => {
    if (!newJob.title || !newJob.description || !newJob.location) return;
    
    setIsSaving(true);
    try {
      const res = await fetch('/api/landlord/hiring/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newJob),
      });
      const data = await res.json();
      
      if (data.success) {
        setJobPostings([{ ...data.job, applicantCount: 0 }, ...jobPostings]);
        setShowCreateJob(false);
        setNewJob({ title: '', description: '', type: 'full-time', location: '', salary: '' });
      } else {
        alert(data.message || 'Failed to create job');
      }
    } catch {
      alert('Failed to create job');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishJob = async (jobId: string) => {
    try {
      const res = await fetch(`/api/landlord/hiring/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      });
      const data = await res.json();
      
      if (data.success) {
        setJobPostings(jobPostings.map(j => 
          j.id === jobId ? { ...j, status: 'active' } : j
        ));
      } else {
        alert(data.message || 'Failed to publish job');
      }
    } catch {
      alert('Failed to publish job');
    }
  };

  const handleCloseJob = async (jobId: string) => {
    try {
      const res = await fetch(`/api/landlord/hiring/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed' }),
      });
      const data = await res.json();
      
      if (data.success) {
        setJobPostings(jobPostings.map(j => 
          j.id === jobId ? { ...j, status: 'closed' } : j
        ));
      }
    } catch {
      alert('Failed to close job');
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job posting? This will also delete all applicants.')) return;
    
    try {
      const res = await fetch(`/api/landlord/hiring/jobs/${jobId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      
      if (data.success) {
        setJobPostings(jobPostings.filter(j => j.id !== jobId));
        setApplicants(applicants.filter(a => a.jobId !== jobId));
      } else {
        alert(data.message || 'Failed to delete job');
      }
    } catch {
      alert('Failed to delete job');
    }
  };

  const handleUpdateApplicantStatus = async (applicantId: string, status: Applicant['status']) => {
    try {
      const res = await fetch(`/api/landlord/hiring/applicants/${applicantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      
      if (data.success) {
        setApplicants(applicants.map(a => 
          a.id === applicantId ? { ...a, status } : a
        ));
        if (showApplicantDetails?.id === applicantId) {
          setShowApplicantDetails({ ...showApplicantDetails, status });
        }
      } else {
        alert(data.message || 'Failed to update status');
      }
    } catch {
      alert('Failed to update status');
    }
  };

  const getStatusBadge = (status: Applicant['status']) => {
    const config = {
      new: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'New' },
      reviewing: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Reviewing' },
      interview: { bg: 'bg-violet-500/20', text: 'text-violet-400', label: 'Interview' },
      offered: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', label: 'Offered' },
      hired: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Hired' },
      rejected: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Rejected' },
    };
    const c = config[status];
    return <Badge className={`${c.bg} ${c.text} border-0`}>{c.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <TabsList className="bg-slate-900/60 border border-white/10">
            <TabsTrigger value="postings" className="data-[state=active]:bg-emerald-600">
              <Briefcase className="h-4 w-4 mr-2" />
              Job Postings
            </TabsTrigger>
            <TabsTrigger value="applicants" className="data-[state=active]:bg-emerald-600">
              <Users className="h-4 w-4 mr-2" />
              Applicants
              {applicants.filter(a => a.status === 'new').length > 0 && (
                <Badge className="ml-2 bg-red-500 text-white text-xs">
                  {applicants.filter(a => a.status === 'new').length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <Button 
            onClick={() => setShowCreateJob(true)}
            className="bg-emerald-600 hover:bg-emerald-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Post New Job
          </Button>
        </div>

        {/* Job Postings Tab */}
        <TabsContent value="postings" className="mt-0">
          {jobPostings.length === 0 ? (
            <Card className="border-white/10 bg-slate-900/60">
              <CardContent className="py-12 text-center">
                <Briefcase className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No Job Postings</h3>
                <p className="text-slate-400 mb-4">Create your first job posting to start hiring.</p>
                <Button onClick={() => setShowCreateJob(true)} className="bg-emerald-600 hover:bg-emerald-500">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Job Posting
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {jobPostings.map((job) => (
                <Card key={job.id} className="border-white/10 bg-slate-900/60">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-white">{job.title}</h3>
                          <Badge 
                            variant="outline" 
                            className={
                              job.status === 'active' 
                                ? 'border-emerald-500/30 text-emerald-400' 
                                : job.status === 'draft'
                                ? 'border-amber-500/30 text-amber-400'
                                : 'border-slate-500/30 text-slate-400'
                            }
                          >
                            {job.status}
                          </Badge>
                        </div>
                        <p className="text-slate-400 text-sm mb-3 line-clamp-2">{job.description}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {job.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {job.type}
                          </span>
                          {job.salary && (
                            <span className="flex items-center gap-1">
                              ${job.salary}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {job.applicantCount} applicants
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-white/10"
                          onClick={() => handleDeleteJob(job.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        {job.status === 'draft' && (
                          <Button 
                            size="sm" 
                            className="bg-emerald-600 hover:bg-emerald-500"
                            onClick={() => handlePublishJob(job.id)}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Publish
                          </Button>
                        )}
                        {job.status === 'active' && (
                          <Button 
                            variant="outline"
                            size="sm" 
                            className="border-white/10"
                            onClick={() => handleCloseJob(job.id)}
                          >
                            Close
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Applicants Tab */}
        <TabsContent value="applicants" className="mt-0">
          {applicants.length === 0 ? (
            <Card className="border-white/10 bg-slate-900/60">
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No Applicants Yet</h3>
                <p className="text-slate-400">Applicants will appear here when they apply to your job postings.</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-white/10 bg-slate-900/60">
              <CardHeader className="border-b border-white/10">
                <CardTitle className="text-white">All Applicants</CardTitle>
                <CardDescription className="text-slate-400">
                  Review and manage job applications
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-white/5">
                  {applicants.map((applicant) => (
                    <div 
                      key={applicant.id}
                      className="p-4 flex items-center justify-between hover:bg-white/5 cursor-pointer transition-colors"
                      onClick={() => setShowApplicantDetails(applicant)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-11 w-11 rounded-full bg-slate-700 flex items-center justify-center">
                          <span className="text-white font-medium">
                            {applicant.name[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{applicant.name}</p>
                          <p className="text-sm text-slate-400">
                            Applied for {applicant.job?.title || 'Unknown Position'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(applicant.appliedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(applicant.status)}
                        <ChevronRight className="h-5 w-5 text-slate-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Job Dialog */}
      <Dialog open={showCreateJob} onOpenChange={setShowCreateJob}>
        <DialogContent className="bg-slate-900 border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Create Job Posting</DialogTitle>
            <DialogDescription className="text-slate-400">
              Post a new job opening to attract candidates.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Job Title</label>
              <Input
                placeholder="e.g. Property Manager"
                value={newJob.title}
                onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                className="bg-slate-800 border-white/10 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Description</label>
              <Textarea
                placeholder="Describe the role and responsibilities..."
                value={newJob.description}
                onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                className="bg-slate-800 border-white/10 text-white min-h-[100px]"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Employment Type</label>
                <Select 
                  value={newJob.type} 
                  onValueChange={(v) => setNewJob({ ...newJob, type: v as any })}
                >
                  <SelectTrigger className="bg-slate-800 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/10">
                    <SelectItem value="full-time" className="text-white">Full-time</SelectItem>
                    <SelectItem value="part-time" className="text-white">Part-time</SelectItem>
                    <SelectItem value="contract" className="text-white">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Location</label>
                <Input
                  placeholder="e.g. Las Vegas, NV"
                  value={newJob.location}
                  onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                  className="bg-slate-800 border-white/10 text-white"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Salary Range (optional)</label>
              <Input
                placeholder="e.g. $50,000 - $65,000"
                value={newJob.salary}
                onChange={(e) => setNewJob({ ...newJob, salary: e.target.value })}
                className="bg-slate-800 border-white/10 text-white"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreateJob(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateJob}
              disabled={!newJob.title || !newJob.description || !newJob.location || isSaving}
              className="bg-emerald-600 hover:bg-emerald-500"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Draft'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Applicant Details Dialog */}
      <Dialog open={!!showApplicantDetails} onOpenChange={() => setShowApplicantDetails(null)}>
        <DialogContent className="bg-slate-900 border-white/10 max-w-lg">
          {showApplicantDetails && (
            <>
              <DialogHeader>
                <DialogTitle className="text-white flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center">
                    {showApplicantDetails.name[0].toUpperCase()}
                  </div>
                  {showApplicantDetails.name}
                </DialogTitle>
                <DialogDescription className="text-slate-400">
                  Applied {new Date(showApplicantDetails.appliedAt).toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Status</span>
                  {getStatusBadge(showApplicantDetails.status)}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Mail className="h-4 w-4 text-slate-500" />
                    {showApplicantDetails.email}
                  </div>
                  {showApplicantDetails.phone && (
                    <div className="flex items-center gap-2 text-slate-300">
                      <Phone className="h-4 w-4 text-slate-500" />
                      {showApplicantDetails.phone}
                    </div>
                  )}
                </div>
                
                <div className="pt-4 border-t border-white/10">
                  <p className="text-sm font-medium text-slate-300 mb-3">Update Status</p>
                  <div className="flex flex-wrap gap-2">
                    {(['reviewing', 'interview', 'offered', 'hired', 'rejected'] as const).map((status) => (
                      <Button
                        key={status}
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateApplicantStatus(showApplicantDetails.id, status)}
                        className={`border-white/10 capitalize ${
                          showApplicantDetails.status === status ? 'bg-white/10' : ''
                        }`}
                      >
                        {status}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="ghost" onClick={() => setShowApplicantDetails(null)}>
                  Close
                </Button>
                <Button className="bg-emerald-600 hover:bg-emerald-500">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
