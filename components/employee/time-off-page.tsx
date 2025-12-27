'use client';

import { useState } from 'react';
import { Umbrella, Plus, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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

interface TimeOffRequest {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  reason?: string;
  status: string;
  createdAt: string;
}

interface TimeOffPageProps {
  requests: TimeOffRequest[];
}

export function TimeOffPage({ requests: initialRequests }: TimeOffPageProps) {
  const [requests, setRequests] = useState(initialRequests);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newRequest, setNewRequest] = useState({
    type: 'vacation',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const handleSubmit = async () => {
    if (!newRequest.startDate || !newRequest.endDate) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/employee/time-off', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRequest),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setRequests([data.request, ...requests]);
        setShowNewRequest(false);
        setNewRequest({ type: 'vacation', startDate: '', endDate: '', reason: '' });
      } else {
        alert(data.message || 'Failed to submit request');
      }
    } catch {
      alert('Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; icon: any }> = {
      pending: { bg: 'bg-amber-500/20', text: 'text-amber-400', icon: Clock },
      approved: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', icon: CheckCircle },
      rejected: { bg: 'bg-red-500/20', text: 'text-red-400', icon: XCircle },
    };
    const c = config[status] || config.pending;
    const Icon = c.icon;
    return (
      <Badge className={`${c.bg} ${c.text} border-0`}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Time Off</h1>
          <p className="text-slate-400">Request and manage your time off</p>
        </div>
        <Button onClick={() => setShowNewRequest(true)} className="bg-emerald-600 hover:bg-emerald-500">
          <Plus className="h-4 w-4 mr-2" />
          Request Time Off
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-white/10 bg-slate-800/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Clock className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{pendingCount}</p>
                <p className="text-xs text-slate-400">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-white/10 bg-slate-800/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{approvedCount}</p>
                <p className="text-xs text-slate-400">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-white/10 bg-slate-800/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Umbrella className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">10</p>
                <p className="text-xs text-slate-400">Days Available</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-white/10 bg-slate-800/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/20">
                <Calendar className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">5</p>
                <p className="text-xs text-slate-400">Days Used</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests List */}
      <Card className="border-white/10 bg-slate-800/60">
        <CardHeader>
          <CardTitle className="text-white">My Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Umbrella className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No time off requests yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <div 
                  key={request.id}
                  className="p-4 rounded-lg bg-slate-900/60 border border-white/5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-medium capitalize">{request.type}</p>
                        {getStatusBadge(request.status)}
                      </div>
                      <p className="text-sm text-slate-400">
                        {formatDate(request.startDate)} - {formatDate(request.endDate)}
                      </p>
                      {request.reason && (
                        <p className="text-sm text-slate-500 mt-1">{request.reason}</p>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      Submitted {formatDate(request.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Request Dialog */}
      <Dialog open={showNewRequest} onOpenChange={setShowNewRequest}>
        <DialogContent className="bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Request Time Off</DialogTitle>
            <DialogDescription className="text-slate-400">
              Submit a request for vacation, sick leave, or personal time.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Type</label>
              <Select 
                value={newRequest.type} 
                onValueChange={(v) => setNewRequest({ ...newRequest, type: v })}
              >
                <SelectTrigger className="bg-slate-800 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10">
                  <SelectItem value="vacation" className="text-white">Vacation</SelectItem>
                  <SelectItem value="sick" className="text-white">Sick Leave</SelectItem>
                  <SelectItem value="personal" className="text-white">Personal</SelectItem>
                  <SelectItem value="bereavement" className="text-white">Bereavement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Start Date</label>
                <Input
                  type="date"
                  value={newRequest.startDate}
                  onChange={(e) => setNewRequest({ ...newRequest, startDate: e.target.value })}
                  className="bg-slate-800 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">End Date</label>
                <Input
                  type="date"
                  value={newRequest.endDate}
                  onChange={(e) => setNewRequest({ ...newRequest, endDate: e.target.value })}
                  className="bg-slate-800 border-white/10 text-white"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Reason (optional)</label>
              <Textarea
                placeholder="Add any notes or details..."
                value={newRequest.reason}
                onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
                className="bg-slate-800 border-white/10 text-white"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNewRequest(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting || !newRequest.startDate || !newRequest.endDate}
              className="bg-emerald-600 hover:bg-emerald-500"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
