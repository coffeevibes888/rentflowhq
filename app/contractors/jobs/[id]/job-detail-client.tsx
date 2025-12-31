'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MapPin, Calendar, Clock, DollarSign, Building2, Users, Shield,
  ChevronLeft, Send, Edit2, CheckCircle, AlertCircle, Briefcase,
  Star, MessageSquare, Loader2, Timer, Award, X, ChevronRight, Play,
  Image as ImageIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface JobMedia {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  type: string;
  caption: string | null;
}

interface Job {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  budgetMin: string | null;
  budgetMax: string | null;
  bidDeadline: string | null;
  scheduledDate: string | null;
  createdAt: string;
  property: { name: string; type: string; city: string; state: string };
  unit: string | null;
  landlord: { id: string; name: string; logo: string | null; memberSince: string; totalJobs: number; totalProperties: number };
  media: JobMedia[];
  mediaCount: number;
  bidCount: number;
}

interface MyBid {
  id: string;
  amount: string;
  estimatedHours: string | null;
  proposedStartDate: string | null;
  message: string | null;
  status: string;
  createdAt: string;
}

interface SimilarJob {
  id: string;
  title: string;
  budgetMin: string | null;
  budgetMax: string | null;
  priority: string;
  city: string;
  bidCount: number;
  createdAt: string;
}

interface JobDetailClientProps {
  job: Job;
  myBid: MyBid | null;
  myContractorId: string | null;
  isLoggedIn: boolean;
  isContractor: boolean;
  similarJobs: SimilarJob[];
}

const priorityConfig: Record<string, { color: string; label: string }> = {
  low: { color: 'bg-slate-100 text-slate-700', label: 'Low Priority' },
  medium: { color: 'bg-blue-100 text-blue-700', label: 'Medium Priority' },
  high: { color: 'bg-orange-100 text-orange-700', label: 'High Priority' },
  urgent: { color: 'bg-red-100 text-red-700', label: 'Urgent' },
};

export default function JobDetailClient({ job, myBid, myContractorId, isLoggedIn, isContractor, similarJobs }: JobDetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [bidForm, setBidForm] = useState({
    amount: myBid?.amount || '',
    estimatedHours: myBid?.estimatedHours || '',
    proposedStartDate: myBid?.proposedStartDate?.split('T')[0] || '',
    message: myBid?.message || '',
  });

  const formatBudget = (min: string | null, max: string | null) => {
    if (!min && !max) return 'Budget Flexible';
    if (min && max) return `${parseFloat(min).toLocaleString()} - ${parseFloat(max).toLocaleString()}`;
    if (min) return `From ${parseFloat(min).toLocaleString()}`;
    return `Up to ${parseFloat(max!).toLocaleString()}`;
  };

  const handleSubmitBid = async () => {
    if (!bidForm.amount) {
      toast({ title: 'Error', description: 'Please enter a bid amount', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/work-orders/${job.id}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(bidForm.amount),
          estimatedHours: bidForm.estimatedHours ? parseFloat(bidForm.estimatedHours) : null,
          proposedStartDate: bidForm.proposedStartDate || null,
          message: bidForm.message || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit bid');
      toast({ title: myBid ? 'Bid Updated' : 'Bid Submitted!', description: myBid ? 'Your bid has been updated' : 'Your proposal has been sent' });
      setBidDialogOpen(false);
      router.refresh();
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to submit bid', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const openLightbox = (index: number) => { setLightboxIndex(index); setLightboxOpen(true); };
  const nextImage = () => setLightboxIndex((prev) => (prev + 1) % job.media.length);
  const prevImage = () => setLightboxIndex((prev) => (prev - 1 + job.media.length) % job.media.length);

  const timeAgo = formatDistanceToNow(new Date(job.createdAt), { addSuffix: true });
  const memberSince = new Date(job.landlord.memberSince).getFullYear();


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Link href="/contractors?view=jobs" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors">
            <ChevronLeft className="h-4 w-4" />Back to Jobs
          </Link>
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Badge className={priorityConfig[job.priority].color}>{priorityConfig[job.priority].label}</Badge>
                <span className="text-white/70 text-sm">Posted {timeAgo}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">{job.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-white/90">
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{job.property.city}, {job.property.state}</span>
                <span className="flex items-center gap-1"><Building2 className="h-4 w-4" />{job.property.name}</span>
                <span className="flex items-center gap-1"><Users className="h-4 w-4" />{job.bidCount} proposal{job.bidCount !== 1 ? 's' : ''}</span>
                {job.mediaCount > 0 && <span className="flex items-center gap-1"><ImageIcon className="h-4 w-4" />{job.mediaCount} photo{job.mediaCount !== 1 ? 's' : ''}</span>}
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{formatBudget(job.budgetMin, job.budgetMax)}</p>
              <p className="text-white/70 text-sm">Project Budget</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Media Gallery */}
            {job.media.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5 text-blue-600" />Photos & Videos</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {job.media.map((m, idx) => (
                      <div key={m.id} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 cursor-pointer group" onClick={() => openLightbox(idx)}>
                        {m.type === 'video' ? (
                          <div className="w-full h-full flex items-center justify-center bg-slate-800">
                            <img src={m.thumbnailUrl || m.url} alt="" className="w-full h-full object-cover opacity-70" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center"><Play className="h-6 w-6 text-slate-700 ml-1" /></div>
                            </div>
                          </div>
                        ) : (
                          <img src={m.url} alt={m.caption || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Job Description */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5 text-blue-600" />Job Details</CardTitle></CardHeader>
              <CardContent>
                <div className="prose prose-slate max-w-none">
                  <p className="whitespace-pre-wrap text-slate-700 leading-relaxed">{job.description}</p>
                </div>
                <Separator className="my-6" />
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className="p-2 bg-blue-100 rounded-lg"><Building2 className="h-5 w-5 text-blue-600" /></div>
                    <div><p className="text-sm text-slate-500">Property Type</p><p className="font-medium text-slate-900 capitalize">{job.property.type}</p></div>
                  </div>
                  {job.unit && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className="p-2 bg-violet-100 rounded-lg"><Building2 className="h-5 w-5 text-violet-600" /></div>
                      <div><p className="text-sm text-slate-500">Unit</p><p className="font-medium text-slate-900">{job.unit}</p></div>
                    </div>
                  )}
                  {job.scheduledDate && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className="p-2 bg-emerald-100 rounded-lg"><Calendar className="h-5 w-5 text-emerald-600" /></div>
                      <div><p className="text-sm text-slate-500">Preferred Date</p><p className="font-medium text-slate-900">{new Date(job.scheduledDate).toLocaleDateString()}</p></div>
                    </div>
                  )}
                  {job.bidDeadline && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className="p-2 bg-amber-100 rounded-lg"><Timer className="h-5 w-5 text-amber-600" /></div>
                      <div><p className="text-sm text-slate-500">Bid Deadline</p><p className="font-medium text-slate-900">{new Date(job.bidDeadline).toLocaleDateString()}</p></div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* My Bid Status */}
            {myBid && (
              <Card className="border-cyan-200 bg-cyan-50/50">
                <CardHeader><CardTitle className="flex items-center gap-2 text-cyan-700"><CheckCircle className="h-5 w-5" />Your Proposal</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-3 gap-4 mb-4">
                    <div><p className="text-sm text-slate-500">Your Bid</p><p className="text-2xl font-bold text-cyan-700">${parseFloat(myBid.amount).toLocaleString()}</p></div>
                    {myBid.estimatedHours && <div><p className="text-sm text-slate-500">Estimated Hours</p><p className="text-lg font-semibold text-slate-900">{myBid.estimatedHours} hrs</p></div>}
                    <div><p className="text-sm text-slate-500">Status</p><Badge className={myBid.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' : myBid.status === 'declined' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}>{myBid.status.charAt(0).toUpperCase() + myBid.status.slice(1)}</Badge></div>
                  </div>
                  {myBid.message && <div className="p-3 bg-white rounded-lg border border-cyan-200"><p className="text-sm text-slate-500 mb-1">Your Cover Letter</p><p className="text-slate-700">{myBid.message}</p></div>}
                  {myBid.status === 'pending' && <Button variant="outline" className="mt-4 border-cyan-300 text-cyan-700 hover:bg-cyan-100" onClick={() => setBidDialogOpen(true)}><Edit2 className="h-4 w-4 mr-2" />Edit Proposal</Button>}
                </CardContent>
              </Card>
            )}

            {/* Similar Jobs */}
            {similarJobs.length > 0 && (
              <Card>
                <CardHeader><CardTitle>Similar Jobs</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {similarJobs.map((sj) => (
                    <Link key={sj.id} href={`/contractors/jobs/${sj.id}`}>
                      <div className="p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer">
                        <div className="flex items-start justify-between">
                          <div><h4 className="font-medium text-slate-900 hover:text-blue-600">{sj.title}</h4><p className="text-sm text-slate-500 mt-1">{sj.city} • {sj.bidCount} proposals</p></div>
                          <p className="font-semibold text-blue-600">{formatBudget(sj.budgetMin, sj.budgetMax)}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>


          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="sticky top-4">
              <CardContent className="p-6">
                {!isLoggedIn ? (
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                    <h3 className="font-semibold text-slate-900 mb-2">Sign in to Submit a Proposal</h3>
                    <p className="text-sm text-slate-500 mb-4">Create a contractor account to bid on jobs</p>
                    <Link href="/sign-in"><Button className="w-full bg-gradient-to-r from-blue-600 to-cyan-500">Sign In</Button></Link>
                    <Link href="/sign-up?role=contractor"><Button variant="outline" className="w-full mt-2">Create Account</Button></Link>
                  </div>
                ) : !isContractor ? (
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 mx-auto text-amber-400 mb-4" />
                    <h3 className="font-semibold text-slate-900 mb-2">Contractor Account Required</h3>
                    <p className="text-sm text-slate-500 mb-4">You need a contractor profile to submit proposals</p>
                    <Link href="/sign-up?role=contractor"><Button className="w-full bg-gradient-to-r from-blue-600 to-cyan-500">Become a Contractor</Button></Link>
                  </div>
                ) : myBid ? (
                  <div className="text-center">
                    <CheckCircle className="h-12 w-12 mx-auto text-emerald-500 mb-4" />
                    <h3 className="font-semibold text-slate-900 mb-2">Proposal Submitted</h3>
                    <p className="text-sm text-slate-500 mb-4">Your bid of ${parseFloat(myBid.amount).toLocaleString()} is {myBid.status}</p>
                    {myBid.status === 'pending' && <Button variant="outline" className="w-full" onClick={() => setBidDialogOpen(true)}><Edit2 className="h-4 w-4 mr-2" />Edit Proposal</Button>}
                  </div>
                ) : (
                  <>
                    <h3 className="font-semibold text-slate-900 mb-4 text-center">Submit Your Proposal</h3>
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90" size="lg" onClick={() => setBidDialogOpen(true)}><Send className="h-4 w-4 mr-2" />Submit Proposal</Button>
                    <p className="text-xs text-slate-500 text-center mt-3">$1 platform fee on accepted jobs</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">About the Client</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                    {job.landlord.logo ? <img src={job.landlord.logo} alt="" className="h-full w-full rounded-full object-cover" /> : job.landlord.name.charAt(0)}
                  </div>
                  <div><p className="font-semibold text-slate-900">{job.landlord.name}</p><p className="text-sm text-slate-500">Member since {memberSince}</p></div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm"><span className="text-slate-500 flex items-center gap-2"><Briefcase className="h-4 w-4" />Jobs Posted</span><span className="font-medium text-slate-900">{job.landlord.totalJobs}</span></div>
                  <div className="flex items-center justify-between text-sm"><span className="text-slate-500 flex items-center gap-2"><Building2 className="h-4 w-4" />Properties</span><span className="font-medium text-slate-900">{job.landlord.totalProperties}</span></div>
                  <div className="flex items-center justify-between text-sm"><span className="text-slate-500 flex items-center gap-2"><Shield className="h-4 w-4" />Payment Verified</span><Badge className="bg-emerald-100 text-emerald-700">Yes</Badge></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Bid Dialog */}
      <Dialog open={bidDialogOpen} onOpenChange={setBidDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{myBid ? 'Edit Your Proposal' : 'Submit a Proposal'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg"><h4 className="font-medium text-slate-900 mb-1">{job.title}</h4><p className="text-sm text-slate-500">Budget: {formatBudget(job.budgetMin, job.budgetMax)}</p></div>
            <div className="space-y-2">
              <Label htmlFor="bidAmount">Your Bid Amount *</Label>
              <div className="relative"><DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><Input id="bidAmount" type="number" step="0.01" min="0" placeholder="0.00" className="pl-9" value={bidForm.amount} onChange={(e) => setBidForm({ ...bidForm, amount: e.target.value })} /></div>
              <p className="text-xs text-slate-500">Total amount you'll receive (minus $1 platform fee)</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="estimatedHours">Estimated Hours</Label><Input id="estimatedHours" type="number" step="0.5" min="0" placeholder="e.g., 4" value={bidForm.estimatedHours} onChange={(e) => setBidForm({ ...bidForm, estimatedHours: e.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="proposedStartDate">Can Start By</Label><Input id="proposedStartDate" type="date" value={bidForm.proposedStartDate} onChange={(e) => setBidForm({ ...bidForm, proposedStartDate: e.target.value })} /></div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Cover Letter *</Label>
              <Textarea id="message" placeholder="Introduce yourself and explain why you're the best fit..." rows={6} value={bidForm.message} onChange={(e) => setBidForm({ ...bidForm, message: e.target.value })} />
              <p className="text-xs text-slate-500">A good cover letter increases your chances of being hired</p>
            </div>
            <Separator />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setBidDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmitBid} disabled={submitting || !bidForm.amount} className="bg-gradient-to-r from-blue-600 to-cyan-500">{submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{myBid ? 'Update Proposal' : 'Submit Proposal'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox */}
      {lightboxOpen && job.media.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={() => setLightboxOpen(false)}>
          <button className="absolute top-4 right-4 p-2 text-white/70 hover:text-white" onClick={() => setLightboxOpen(false)}><X className="h-8 w-8" /></button>
          {job.media.length > 1 && (
            <>
              <button className="absolute left-4 p-2 text-white/70 hover:text-white" onClick={(e) => { e.stopPropagation(); prevImage(); }}><ChevronLeft className="h-10 w-10" /></button>
              <button className="absolute right-4 p-2 text-white/70 hover:text-white" onClick={(e) => { e.stopPropagation(); nextImage(); }}><ChevronRight className="h-10 w-10" /></button>
            </>
          )}
          <div className="max-w-5xl max-h-[90vh] p-4" onClick={(e) => e.stopPropagation()}>
            {job.media[lightboxIndex].type === 'video' ? (
              <video src={job.media[lightboxIndex].url} controls autoPlay className="max-w-full max-h-[85vh] rounded-lg" />
            ) : (
              <img src={job.media[lightboxIndex].url} alt={job.media[lightboxIndex].caption || ''} className="max-w-full max-h-[85vh] object-contain rounded-lg" />
            )}
            {job.media[lightboxIndex].caption && <p className="text-white/80 text-center mt-3">{job.media[lightboxIndex].caption}</p>}
            <p className="text-white/50 text-center text-sm mt-2">{lightboxIndex + 1} / {job.media.length}</p>
          </div>
        </div>
      )}
    </div>
  );
}
