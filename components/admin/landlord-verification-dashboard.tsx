'use client';

import { useState, useEffect } from 'react';
import { FileText, Eye, CheckCircle, XCircle, AlertTriangle, Loader2, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DocumentReviewModal } from './document-review-modal';

export function LandlordVerificationDashboard() {
  const [pendingDocuments, setPendingDocuments] = useState<any[]>([]);
  const [usageStats, setUsageStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  const fetchPendingDocuments = async () => {
    try {
      const response = await fetch('/api/admin/verification/pending');
      if (response.ok) {
        const data = await response.json();
        setPendingDocuments(data.documents);
      }
    } catch (error) {
      console.error('Failed to fetch pending documents:', error);
    }
  };

  const fetchUsageStats = async () => {
    try {
      const response = await fetch('/api/admin/verification/usage-stats');
      if (response.ok) {
        const data = await response.json();
        setUsageStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch usage stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingDocuments();
    fetchUsageStats();
  }, []);

  const handleReview = (document: any) => {
    setSelectedDocument(document);
    setReviewModalOpen(true);
  };

  const handleReviewComplete = () => {
    setReviewModalOpen(false);
    setSelectedDocument(null);
    fetchPendingDocuments();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Verification Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Review and manage tenant verification documents
        </p>
      </div>

      {/* Usage Statistics */}
      {usageStats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">{usageStats.currentPeriodUsage}</p>
                <p className="text-xs text-muted-foreground mt-1">Verifications</p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
          </Card>

          {usageStats.hasFreeChecks && (
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Free Checks</p>
                  <p className="text-2xl font-bold">{usageStats.freeChecksRemaining}</p>
                  <p className="text-xs text-muted-foreground mt-1">Remaining this month</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </Card>
          )}

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                <p className="text-2xl font-bold">${usageStats.totalCost.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">This month</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </Card>
        </div>
      )}

      {/* Pending Reviews */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Pending Reviews</h2>
          <Badge variant="secondary">
            {pendingDocuments.length} {pendingDocuments.length === 1 ? 'document' : 'documents'}
          </Badge>
        </div>

        {pendingDocuments.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <p className="text-lg font-medium mb-1">All caught up!</p>
            <p className="text-sm text-muted-foreground">
              No documents pending review at this time.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingDocuments.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    <FileText className="w-8 h-8 text-muted-foreground" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate">{doc.application.fullName}</p>
                      <Badge variant="outline" className="text-xs">
                        {doc.category === 'identity' ? 'ID' : 'Income'}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground truncate">
                      {doc.application.propertyName} • {doc.application.unitName}
                    </p>
                    
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      {doc.ocrConfidence && (
                        <span>Confidence: {doc.ocrConfidence.toFixed(1)}%</span>
                      )}
                      {doc.fraudScore && (
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Fraud Score: {doc.fraudScore.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => handleReview(doc)}
                  size="sm"
                  className="flex-shrink-0"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Review
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Review Modal */}
      {selectedDocument && (
        <DocumentReviewModal
          document={selectedDocument}
          open={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          onComplete={handleReviewComplete}
        />
      )}
    </div>
  );
}
