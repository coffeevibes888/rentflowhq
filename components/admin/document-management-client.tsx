'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Receipt,
  FileCheck,
  AlertCircle,
  Eye,
  Trash2,
  CheckCircle2,
  Clock,
  FileWarning,
  Sparkles,
} from 'lucide-react';
import DocumentUpload from './document-upload';
import DocumentClassificationWizard from './document-classification-wizard';
import LeaseDigitizationWizard from './lease-digitization-wizard';
import { formatDistanceToNow } from 'date-fns';
import { deleteDocument } from '@/lib/actions/document.actions';
import { toast } from '@/hooks/use-toast';
import { ScannedDocument } from '@/types/document-types';

interface DocumentManagementClientProps {
  documents: ScannedDocument[];
  properties: any[];
}

export default function DocumentManagementClient({ documents: initialDocuments, properties }: DocumentManagementClientProps) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [classificationWizardOpen, setClassificationWizardOpen] = useState(false);
  const [digitizationWizardOpen, setDigitizationWizardOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleClassify = (document: any) => {
    setSelectedDocument(document);
    setClassificationWizardOpen(true);
  };

  const handleDigitize = (document: any) => {
    setSelectedDocument(document);
    setDigitizationWizardOpen(true);
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    const result = await deleteDocument(documentId);
    if (result.success) {
      setDocuments(documents.filter((d) => d.id !== documentId));
      toast({
        title: 'Document Deleted',
        description: 'The document has been removed.',
      });
    } else {
      toast({
        title: 'Error',
        description: result.message || 'Failed to delete document',
        variant: 'destructive',
      });
    }
  };

  const getDocumentIcon = (type: string | null | undefined) => {
    switch (type) {
      case 'lease':
        return <FileText className="h-5 w-5 text-violet-400" />;
      case 'receipt':
        return <Receipt className="h-5 w-5 text-green-400" />;
      case 'application':
        return <FileCheck className="h-5 w-5 text-blue-400" />;
      case 'notice':
        return <AlertCircle className="h-5 w-5 text-amber-400" />;
      default:
        return <FileWarning className="h-5 w-5 text-slate-400" />;
    }
  };

  const getStatusBadge = (document: any) => {
    if (document.conversionStatus === 'completed') {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Digitized</Badge>;
    }
    if (document.classificationStatus === 'classified') {
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Classified</Badge>;
    }
    if (document.classificationStatus === 'manual_review') {
      return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Needs Review</Badge>;
    }
    return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">Pending</Badge>;
  };

  const filteredDocuments = documents.filter((doc) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return doc.classificationStatus === 'pending';
    if (activeTab === 'classified') return doc.classificationStatus === 'classified';
    if (activeTab === 'digitized') return doc.conversionStatus === 'completed';
    return true;
  });

  return (
    <div className="space-y-6">
      <DocumentUpload />

      <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-violet-400" />
                Uploaded Documents
              </CardTitle>
              <CardDescription className="text-slate-300">
                Review, classify, and convert your documents to digital records
              </CardDescription>
            </div>
            <Button onClick={handleRefresh} variant="outline" size="sm" className="border-white/20 text-white">
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-slate-800/50 border border-white/10">
              <TabsTrigger value="all" className="data-[state=active]:bg-violet-500">
                All ({documents.length})
              </TabsTrigger>
              <TabsTrigger value="pending" className="data-[state=active]:bg-violet-500">
                Pending ({documents.filter((d) => d.classificationStatus === 'pending').length})
              </TabsTrigger>
              <TabsTrigger value="classified" className="data-[state=active]:bg-violet-500">
                Classified ({documents.filter((d) => d.classificationStatus === 'classified').length})
              </TabsTrigger>
              <TabsTrigger value="digitized" className="data-[state=active]:bg-violet-500">
                Digitized ({documents.filter((d) => d.conversionStatus === 'completed').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {filteredDocuments.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-300">No documents found</p>
                  <p className="text-sm text-slate-400 mt-2">Upload documents to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredDocuments.map((document) => (
                    <div
                      key={document.id}
                      className="flex items-center gap-4 p-4 rounded-lg bg-slate-800/50 border border-white/10 hover:border-violet-400/50 transition-colors"
                    >
                      <div className="flex-shrink-0">{getDocumentIcon(document.documentType)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-white truncate">{document.originalFileName}</p>
                          {getStatusBadge(document)}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(document.createdAt), { addSuffix: true })}
                          </span>
                          {document.documentType && (
                            <span className="capitalize">{document.documentType}</span>
                          )}
                          {document.ocrConfidence && (
                            <span>OCR: {document.ocrConfidence}% confidence</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {document.classificationStatus === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleClassify(document)}
                            className="border-white/20 text-white hover:bg-violet-500/20"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Classify
                          </Button>
                        )}
                        {document.classificationStatus === 'classified' &&
                          document.conversionStatus === 'pending' &&
                          document.documentType === 'lease' && (
                            <Button
                              size="sm"
                              onClick={() => handleDigitize(document)}
                              className="bg-violet-500 hover:bg-violet-600"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Convert to Digital
                            </Button>
                          )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(document.id)}
                          className="hover:bg-red-500/20 text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {selectedDocument && (
        <>
          <DocumentClassificationWizard
            document={selectedDocument}
            open={classificationWizardOpen}
            onOpenChange={setClassificationWizardOpen}
            onComplete={handleRefresh}
          />
          <LeaseDigitizationWizard
            document={selectedDocument}
            properties={properties}
            open={digitizationWizardOpen}
            onOpenChange={setDigitizationWizardOpen}
            onComplete={handleRefresh}
          />
        </>
      )}
    </div>
  );
}
