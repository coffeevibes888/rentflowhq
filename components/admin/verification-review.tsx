'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  CheckCircle2,
  XCircle,
  Eye,
  FileText,
  Shield,
  CreditCard,
  Building,
  UserCheck,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';

interface VerificationReviewProps {
  contractor: any;
  verification: any;
  documents: any[];
}

export function VerificationReview({
  contractor,
  verification,
  documents,
}: VerificationReviewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<string>('');
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const verificationFields = [
    {
      id: 'identity',
      title: 'Identity Verification',
      icon: UserCheck,
      status: verification?.identityStatus || 'not_started',
      data: {
        documentType: verification?.identityDocumentType,
        documentUrl: verification?.identityDocumentUrl,
        provider: verification?.identityProvider,
      },
    },
    {
      id: 'license',
      title: 'Business License',
      icon: FileText,
      status: verification?.licenseStatus || 'not_started',
      data: {
        number: verification?.licenseNumber,
        state: verification?.licenseState,
        type: verification?.licenseType,
        documentUrl: verification?.licenseDocumentUrl,
        expiresAt: verification?.licenseExpiresAt,
      },
    },
    {
      id: 'insurance',
      title: 'Insurance',
      icon: Shield,
      status: verification?.insuranceStatus || 'not_started',
      data: {
        provider: verification?.insuranceProvider,
        policyNumber: verification?.insurancePolicyNumber,
        coverageAmount: verification?.insuranceCoverageAmount,
        certificateUrl: verification?.insuranceCertificateUrl,
        expiresAt: verification?.insuranceExpiresAt,
      },
    },
    {
      id: 'background',
      title: 'Background Check',
      icon: UserCheck,
      status: verification?.backgroundCheckStatus || 'not_started',
      data: {
        provider: verification?.backgroundCheckProvider,
        result: verification?.backgroundCheckResult,
        date: verification?.backgroundCheckDate,
      },
    },
    {
      id: 'bank',
      title: 'Bank Account',
      icon: CreditCard,
      status: verification?.bankAccountStatus || 'not_started',
      data: {
        verified: verification?.bankAccountVerified,
        stripeAccountId: verification?.stripeAccountId,
      },
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-500">Verified</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending Review</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Not Started</Badge>;
    }
  };

  const handleReview = (fieldId: string, action: 'approve' | 'reject') => {
    setSelectedField(fieldId);
    setReviewAction(action);
    setReviewModalOpen(true);
  };

  const handleSubmitReview = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/verification/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationId: verification.id,
          field: selectedField,
          action: reviewAction,
          notes: reviewNotes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit review');
      }

      toast({
        title: 'Review Submitted',
        description: `Verification ${reviewAction === 'approve' ? 'approved' : 'rejected'} successfully`,
      });

      setReviewModalOpen(false);
      setReviewNotes('');
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit review',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Contractor Info */}
      <Card>
        <CardHeader>
          <CardTitle>Contractor Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Business Name</p>
              <p className="font-medium">{contractor.businessName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{contractor.user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{contractor.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Overall Status</p>
              {getStatusBadge(verification?.verificationStatus || 'unverified')}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification Fields */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Verification Items</h3>
        {verificationFields.map((field) => {
          const Icon = field.icon;
          const isPending = field.status === 'pending';
          const fieldDocs = documents.filter((doc) => doc.documentType === field.id);

          return (
            <Card key={field.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg">{field.title}</CardTitle>
                  </div>
                  {getStatusBadge(field.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Field Data */}
                {Object.entries(field.data).map(([key, value]) => {
                  if (!value) return null;

                  if (key.includes('Url')) {
                    return (
                      <div key={key}>
                        <p className="text-sm text-muted-foreground capitalize">
                          {key.replace('Url', '')}
                        </p>
                        <Button
                          variant="link"
                          className="p-0 h-auto"
                          onClick={() => window.open(value as string, '_blank')}
                        >
                          View Document
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    );
                  }

                  if (key.includes('At') && value) {
                    return (
                      <div key={key}>
                        <p className="text-sm text-muted-foreground capitalize">
                          {key.replace('At', '')}
                        </p>
                        <p className="font-medium">
                          {format(new Date(value as string), 'PPP')}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div key={key}>
                      <p className="text-sm text-muted-foreground capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="font-medium">{String(value)}</p>
                    </div>
                  );
                })}

                {/* Documents */}
                {fieldDocs.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Uploaded Documents
                    </p>
                    <div className="space-y-2">
                      {fieldDocs.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-600" />
                            <span className="text-sm">{doc.documentName}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(doc.documentUrl, '_blank')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Review Actions */}
                {isPending && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleReview(field.id, 'approve')}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleReview(field.id, 'reject')}
                      variant="destructive"
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Review Modal */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' ? 'Approve' : 'Reject'} Verification
            </DialogTitle>
            <DialogDescription>
              {reviewAction === 'approve'
                ? 'Confirm that the verification documents are valid'
                : 'Provide a reason for rejection'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="reviewNotes">
                {reviewAction === 'approve' ? 'Notes (Optional)' : 'Rejection Reason *'}
              </Label>
              <Textarea
                id="reviewNotes"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder={
                  reviewAction === 'approve'
                    ? 'Add any notes...'
                    : 'Explain why this verification is being rejected...'
                }
                rows={4}
                required={reviewAction === 'reject'}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={isSubmitting || (reviewAction === 'reject' && !reviewNotes)}
              className={
                reviewAction === 'approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : ''
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  {reviewAction === 'approve' ? (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  {reviewAction === 'approve' ? 'Approve' : 'Reject'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
