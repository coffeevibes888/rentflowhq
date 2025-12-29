'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  ArrowRight,
  Plus,
  Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeaseDocument {
  id: string;
  name: string;
  type: string;
  isFieldsConfigured: boolean;
  createdAt: string;
  fileUrl: string | null;
}

interface LeaseSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  propertyName: string;
  onComplete?: () => void;
}

export default function LeaseSelectionModal({
  open,
  onOpenChange,
  propertyId,
  propertyName,
  onComplete,
}: LeaseSelectionModalProps) {
  const router = useRouter();
  const [documents, setDocuments] = useState<LeaseDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (open) {
      fetchDocuments();
    }
  }, [open]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/legal-documents');
      if (res.ok) {
        const data = await res.json();
        // Filter to only show lease documents
        const leaseDocuments = (data.documents || []).filter(
          (doc: LeaseDocument) => doc.type === 'lease'
        );
        setDocuments(leaseDocuments);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignLease = async () => {
    if (!selectedDocId) return;

    setAssigning(true);
    try {
      const res = await fetch('/api/legal-documents/set-default', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: selectedDocId,
          propertyId,
        }),
      });

      if (res.ok) {
        onOpenChange(false);
        onComplete?.();
      } else {
        const error = await res.json();
        alert(error.message || 'Failed to assign lease');
      }
    } catch (error) {
      console.error('Failed to assign lease:', error);
      alert('Failed to assign lease');
    } finally {
      setAssigning(false);
    }
  };

  const handleSkip = () => {
    onOpenChange(false);
    onComplete?.();
  };

  const handleGoToDocuments = () => {
    onOpenChange(false);
    router.push('/admin/legal-documents?returnTo=' + encodeURIComponent(`/admin/products/${propertyId}/edit`));
  };

  const configuredDocuments = documents.filter(d => d.isFieldsConfigured);
  const unconfiguredDocuments = documents.filter(d => !d.isFieldsConfigured);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-5 w-5 text-violet-400" />
            Select Lease Template
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Choose a lease agreement template for <span className="text-white font-medium">{propertyName}</span>. 
            This will be used when creating leases for tenants in this property.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
            </div>
          ) : documents.length === 0 ? (
            /* No documents - prompt to upload */
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">No Lease Templates Found</h3>
                <p className="text-slate-400 text-sm max-w-md mx-auto">
                  You haven't uploaded any lease templates yet. Upload a lease document to use for this property.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <Button
                  onClick={handleGoToDocuments}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Lease Template
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  className="border-white/20 text-slate-300 hover:bg-white/10"
                >
                  Skip for Now
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Ready to use documents */}
              {configuredDocuments.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    Ready to Use ({configuredDocuments.length})
                  </h3>
                  <div className="grid gap-3">
                    {configuredDocuments.map((doc) => (
                      <Card
                        key={doc.id}
                        className={cn(
                          "cursor-pointer transition-all border-2",
                          selectedDocId === doc.id
                            ? "bg-violet-600/20 border-violet-500"
                            : "bg-white/5 border-white/10 hover:border-white/30"
                        )}
                        onClick={() => setSelectedDocId(doc.id)}
                      >
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            selectedDocId === doc.id ? "bg-violet-500" : "bg-white/10"
                          )}>
                            <FileText className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white truncate">{doc.name}</p>
                            <p className="text-xs text-slate-400">
                              Uploaded {new Date(doc.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Configured
                          </Badge>
                          {selectedDocId === doc.id && (
                            <CheckCircle2 className="h-5 w-5 text-violet-400" />
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Unconfigured documents */}
              {unconfiguredDocuments.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-400" />
                    Needs Configuration ({unconfiguredDocuments.length})
                  </h3>
                  <div className="grid gap-3">
                    {unconfiguredDocuments.map((doc) => (
                      <Card
                        key={doc.id}
                        className="bg-white/5 border-white/10 opacity-60"
                      >
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-slate-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-300 truncate">{doc.name}</p>
                            <p className="text-xs text-slate-500">
                              Signature fields not configured
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/admin/legal-documents?edit=${doc.id}`);
                            }}
                          >
                            Configure
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload new option */}
              <Card
                className="bg-white/5 border-white/10 border-dashed cursor-pointer hover:border-violet-500/50 transition-colors"
                onClick={handleGoToDocuments}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                    <Plus className="h-5 w-5 text-violet-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-300">Upload New Lease Template</p>
                    <p className="text-xs text-slate-500">Add a new lease document</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-500" />
                </CardContent>
              </Card>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  className="border-white/20 text-slate-300 hover:bg-white/10"
                >
                  Skip for Now
                </Button>
                <Button
                  onClick={handleAssignLease}
                  disabled={!selectedDocId || assigning}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  {assigning ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <Building2 className="h-4 w-4 mr-2" />
                      Assign to Property
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
