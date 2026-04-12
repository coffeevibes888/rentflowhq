'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Inbox,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  MapPin,
  Calendar,
  AlertCircle,
  Sparkles,
  TrendingUp,
  Filter,
  Search,
  Loader2,
  Eye,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { QuoteBuilder } from '@/components/contractor/quote-builder';

interface LeadsClientProps {
  leadMatches: any[];
  leadCredit: any;
  contractor: any;
}

export default function LeadsClient({
  leadMatches,
  leadCredit,
  contractor,
}: LeadsClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const filteredLeads = leadMatches.filter((match) => {
    const matchesSearch =
      match.lead.projectTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.lead.projectDescription?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.lead.customerName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      selectedStatus === 'all' || match.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    pending: leadMatches.filter((m) => m.status === 'pending').length,
    responded: leadMatches.filter((m) => m.status === 'responded').length,
    quoted: leadMatches.filter((m) => m.status === 'quoted').length,
    won: leadMatches.filter((m) => m.status === 'won').length,
  };

  const handleAcceptLead = async (matchId: string) => {
    setProcessingId(matchId);
    try {
      const res = await fetch(`/api/contractor/leads/${matchId}/accept`, {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to accept lead');
      }

      toast({
        title: '✅ Lead Accepted',
        description: 'You can now send a quote to the customer',
      });

      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectLead = async (matchId: string) => {
    setProcessingId(matchId);
    try {
      const res = await fetch(`/api/contractor/leads/${matchId}/reject`, {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to reject lead');
      }

      toast({
        title: 'Lead Rejected',
        description: 'The lead has been removed from your inbox',
      });

      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-700 border-amber-200',
      sent: 'bg-blue-100 text-blue-700 border-blue-200',
      viewed: 'bg-violet-100 text-violet-700 border-violet-200',
      responded: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      quoted: 'bg-purple-100 text-purple-700 border-purple-200',
      won: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      lost: 'bg-slate-100 text-slate-700 border-slate-200',
      expired: 'bg-red-100 text-red-700 border-red-200',
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const getUrgencyColor = (urgency: string) => {
    const colors: Record<string, string> = {
      emergency: 'bg-red-500 text-gray-900',
      urgent: 'bg-orange-500 text-gray-900',
      normal: 'bg-blue-500 text-gray-900',
      flexible: 'bg-slate-500 text-gray-900',
    };
    return colors[urgency] || 'bg-slate-500 text-gray-900';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-blue-600 flex items-center gap-2">
            <Inbox className="h-8 w-8" />
            Lead Inbox
          </h1>
          <p className="text-gray-600 mt-1">Manage your project leads and send quotes</p>
        </div>

        {/* Credit Balance */}
        {leadCredit && (
          <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 border-0 text-gray-900">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-900/80">Lead Credits</p>
                  <p className="text-2xl font-bold">{leadCredit.balance}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-2 border-gray-200 bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-gray-200 bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/20">
                <CheckCircle2 className="h-5 w-5 text-indigo-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.responded}</p>
                <p className="text-sm text-gray-600">Responded</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-gray-200 bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <FileText className="h-5 w-5 text-purple-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.quoted}</p>
                <p className="text-sm text-gray-600">Quoted</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-gray-200 bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.won}</p>
                <p className="text-sm text-gray-600">Won</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-2 border-gray-200 bg-white shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search leads..."
                  className="pl-10 bg-white/10 border-gray-300 text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedStatus('all')}
                className={selectedStatus === 'all' ? '' : 'border-gray-300 text-gray-900 hover:bg-gray-100'}
              >
                All
              </Button>
              <Button
                variant={selectedStatus === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedStatus('pending')}
                className={selectedStatus === 'pending' ? '' : 'border-gray-300 text-gray-900 hover:bg-gray-100'}
              >
                Pending
              </Button>
              <Button
                variant={selectedStatus === 'quoted' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedStatus('quoted')}
                className={selectedStatus === 'quoted' ? '' : 'border-gray-300 text-gray-900 hover:bg-gray-100'}
              >
                Quoted
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads List */}
      <div className="space-y-4">
        {filteredLeads.length === 0 ? (
          <Card className="border-2 border-gray-200 bg-white shadow-sm">
            <CardContent className="py-16">
              <div className="text-center">
                <Inbox className="h-16 w-16 mx-auto text-gray-900/30 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No leads found</h3>
                <p className="text-gray-600">
                  {searchQuery || selectedStatus !== 'all'
                    ? 'Try adjusting your filters'
                    : 'New leads will appear here'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredLeads.map((match) => {
            const lead = match.lead;
            const isProcessing = processingId === match.id;

            return (
              <Card
                key={match.id}
                className="border-2 border-gray-200 bg-white shadow-sm hover:border-blue-300 hover:shadow-md transition-colors"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Lead Info */}
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h3 className="font-bold text-xl text-gray-900">
                              {lead.projectTitle || lead.projectType}
                            </h3>
                            <Badge className={`${getStatusColor(match.status)} border`}>
                              {match.status}
                            </Badge>
                            <Badge className={getUrgencyColor(lead.urgency)}>
                              {lead.urgency}
                            </Badge>
                          </div>
                          <p className="text-gray-900/80 text-sm mb-2">
                            {lead.customerName} • {lead.customerEmail}
                          </p>
                        </div>
                      </div>

                      <p className="text-gray-900/90 leading-relaxed">
                        {lead.projectDescription}
                      </p>

                      <div className="grid md:grid-cols-3 gap-3 text-sm">
                        {lead.budgetMin && lead.budgetMax && (
                          <div className="flex items-center gap-2 text-gray-900/80">
                            <DollarSign className="h-4 w-4 text-emerald-400" />
                            <span>
                              {formatCurrency(Number(lead.budgetMin))} - {formatCurrency(Number(lead.budgetMax))}
                            </span>
                          </div>
                        )}
                        {lead.timeline && (
                          <div className="flex items-center gap-2 text-gray-900/80">
                            <Calendar className="h-4 w-4 text-blue-400" />
                            <span className="capitalize">{lead.timeline.replace('_', ' ')}</span>
                          </div>
                        )}
                        {lead.propertyCity && lead.propertyState && (
                          <div className="flex items-center gap-2 text-gray-900/80">
                            <MapPin className="h-4 w-4 text-violet-400" />
                            <span>
                              {lead.propertyCity}, {lead.propertyState}
                            </span>
                          </div>
                        )}
                      </div>

                      {match.matchScore > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <div className="flex-1 bg-white/10 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full"
                              style={{ width: `${match.matchScore}%` }}
                            />
                          </div>
                          <span className="text-gray-600">{match.matchScore}% match</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="lg:w-64 flex flex-col gap-3">
                      {match.status === 'pending' && (
                        <>
                          <Button
                            onClick={() => handleAcceptLead(match.id)}
                            disabled={isProcessing}
                            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                          >
                            {isProcessing ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                            )}
                            Accept Lead
                          </Button>
                          <Button
                            onClick={() => handleRejectLead(match.id)}
                            disabled={isProcessing}
                            variant="outline"
                            className="w-full border-gray-300 text-gray-900 hover:bg-gray-100"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Decline
                          </Button>
                        </>
                      )}

                      {['sent', 'viewed', 'responded'].includes(match.status) && (
                        <QuoteBuilder
                          leadId={lead.id}
                          leadTitle={lead.projectTitle || lead.projectType}
                          customerName={lead.customerName}
                        />
                      )}

                      {match.status === 'quoted' && (
                        <div className="bg-purple-500/20 border border-purple-400/30 rounded-lg p-3 text-center">
                          <FileText className="h-6 w-6 text-purple-300 mx-auto mb-1" />
                          <p className="text-sm font-semibold text-gray-900">Quote Sent</p>
                          <p className="text-xs text-gray-600 mt-1">
                            {formatCurrency(Number(match.quoteAmount))}
                          </p>
                        </div>
                      )}

                      {match.status === 'won' && (
                        <div className="bg-emerald-100 border border-emerald-400/30 rounded-lg p-3 text-center">
                          <TrendingUp className="h-6 w-6 text-emerald-600 mx-auto mb-1" />
                          <p className="text-sm font-semibold text-gray-900">Won!</p>
                        </div>
                      )}

                      {match.leadCost && (
                        <div className="text-xs text-gray-500 text-center">
                          Lead cost: {formatCurrency(Number(match.leadCost))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
