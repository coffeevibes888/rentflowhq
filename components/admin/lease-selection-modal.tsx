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
      <DialogContent className="bg-slate-900 border-white/10 text-white w-[calc(100%-2rem)] max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl sm:rounded-2xl p-4 sm:p-6">
        <DialogHeader className="space-y-2 sm:space-y-3">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <FileText className="h-5 w-5 text-violet-400 flex-shrink-0" />
            Select Lease Template
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-sm sm:text-base">
            Choose a lease for <span className="text-white font-medium">{propertyName}</span>.
            <span className="block mt-2 text-amber-400 text-xs sm:text-sm">
              ⚠️ You won't be able to list units until a lease is assigned.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 mt-3 sm:mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-8 sm:py-12">
              <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-violet-400" />
            </div>
          ) : documents.length === 0 ? (
            /* No documents - prompt to upload */
            <div className="text-center py-6 sm:py-8 space-y-3 sm:space-y-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-full bg-amber-500/20 flex items-center justify-center">
                <AlertCircle className="h-7 w-7 sm:h-8 sm:w-8 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2">No Lease Templates Found</h3>
                <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto px-2">
                  Upload a lease document to use for this property.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 justify-center pt-2 sm:pt-4">
                <Button
                  onClick={handleGoToDocuments}
                  className="bg-violet-600 hover:bg-violet-700 h-11 sm:h-10 text-sm"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Lease Template
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  className="border-white/20 text-slate-300 hover:bg-white/10 h-11 sm:h-10 text-sm"
                >
                  Skip for Now
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Ready to use documents */}
              {configuredDocuments.length > 0 && (
                <div className="space-y-2 sm:space-y-3">
                  <h3 className="text-xs sm:text-sm font-medium text-slate-300 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    Ready to Use ({configuredDocuments.length})
                  </h3>
                  <div className="grid gap-2 sm:gap-3">
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
                        <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                          <div className={cn(
                            "w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                            selectedDocId === doc.id ? "bg-violet-500" : "bg-white/10"
                          )}>
                            <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white text-sm sm:text-base truncate">{doc.name}</p>
                            <p className="text-[10px] sm:text-xs text-slate-400">
                              {new Date(doc.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] sm:text-xs px-1.5 sm:px-2">
                              <CheckCircle2 className="h-3 w-3 mr-0.5 sm:mr-1 hidden sm:inline" />
                              Ready
                            </Badge>
                            {selectedDocId === doc.id && (
                              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-violet-400" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Unconfigured documents */}
              {unconfiguredDocuments.length > 0 && (
                <div className="space-y-2 sm:space-y-3">
                  <h3 className="text-xs sm:text-sm font-medium text-slate-300 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0" />
                    Needs Setup ({unconfiguredDocuments.length})
                  </h3>
                  <p className="text-[10px] sm:text-xs text-slate-500">
                    Can still be used with standard signature area.
                  </p>
                  <div className="grid gap-2 sm:gap-3">
                    {unconfiguredDocuments.map((doc) => (
                      <Card
                        key={doc.id}
                        className={cn(
                          "cursor-pointer transition-all border-2",
                          selectedDocId === doc.id
                            ? "bg-amber-600/20 border-amber-500"
                            : "bg-white/5 border-white/10 hover:border-white/30"
                        )}
                        onClick={() => setSelectedDocId(doc.id)}
                      >
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className={cn(
                              "w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                              selectedDocId === doc.id ? "bg-amber-500" : "bg-white/10"
                            )}>
                              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-white text-sm sm:text-base truncate">{doc.name}</p>
                              <p className="text-[10px] sm:text-xs text-slate-400">
                                {new Date(doc.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            {selectedDocId === doc.id && (
                              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400 flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2 sm:mt-3 ml-12 sm:ml-14">
                            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] sm:text-xs px-1.5 sm:px-2">
                              Basic Signing
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-violet-500/30 text-violet-400 hover:bg-violet-500/10 h-7 sm:h-8 text-[10px] sm:text-xs px-2 sm:px-3"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/admin/legal-documents?edit=${doc.id}`);
                              }}
                            >
                              Configure
                            </Button>
                          </div>
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
                <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                    <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-300 text-sm sm:text-base">Upload New Lease</p>
                    <p className="text-[10px] sm:text-xs text-slate-500">Add a new document</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-500 flex-shrink-0" />
                </CardContent>
              </Card>

              {/* Action buttons */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-white/10">
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  className="border-white/20 text-slate-300 hover:bg-white/10 h-11 sm:h-10 text-sm"
                >
                  Skip for Now
                </Button>
                <Button
                  onClick={handleAssignLease}
                  disabled={!selectedDocId || assigning}
                  className="bg-violet-600 hover:bg-violet-700 h-11 sm:h-10 text-sm"
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
