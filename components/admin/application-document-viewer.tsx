'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, ExternalLink, FileText, X } from 'lucide-react';

interface Document {
  id: string;
  originalFileName: string;
  category: string;
  docType: string;
  verificationStatus?: string;
  status?: string;
}

interface ApplicationDocumentViewerProps {
  verificationDocuments: Document[];
  applicationDocuments: Document[];
  applicationId: string;
}

export function ApplicationDocumentViewer({
  verificationDocuments,
  applicationDocuments,
  applicationId,
}: ApplicationDocumentViewerProps) {
  const [loadingDocId, setLoadingDocId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);

  const handleViewDocument = async (docId: string, fileName: string, isVerification: boolean) => {
    setLoadingDocId(docId);
    try {
      const endpoint = isVerification
        ? `/api/documents/verification/${docId}/url`
        : `/api/documents/application/${docId}/url`;
      
      const res = await fetch(endpoint);
      if (!res.ok) {
        throw new Error('Failed to get document URL');
      }
      const data = await res.json();
      
      // Open in new tab
      window.open(data.url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Failed to view document:', error);
      alert('Failed to load document. Please try again.');
    } finally {
      setLoadingDocId(null);
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'verified': return { text: 'Approved', color: 'text-green-600', bg: 'border-green-200 bg-green-50' };
      case 'rejected': return { text: 'Rejected', color: 'text-red-600', bg: 'border-red-200 bg-red-50' };
      case 'processing':
      case 'pending':
      case 'needs_review':
      default: return { text: 'Needs Review', color: 'text-amber-600', bg: 'border-amber-200 bg-amber-50' };
    }
  };

  return (
    <>
      {/* Verification Documents (ID & Income) */}
      {verificationDocuments.length > 0 && (
        <div className='mt-4 space-y-2'>
          <p className='font-semibold text-slate-900 text-sm'>ID & Income Documents</p>
          <div className='space-y-2'>
            {verificationDocuments.map((doc) => {
              const statusDisplay = getStatusDisplay(doc.verificationStatus || 'pending');
              
              return (
                <div
                  key={doc.id}
                  className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 ${statusDisplay.bg}`}
                >
                  <div className='min-w-0'>
                    <p className='text-xs font-medium text-slate-900 truncate'>{doc.originalFileName}</p>
                    <p className='text-[11px] text-slate-500'>
                      {doc.category === 'identity' ? '🪪 ID' : '💰 Income'} • {String(doc.docType).replace(/_/g, ' ')} • 
                      <span className={`font-medium ${statusDisplay.color}`}>
                        {' '}{statusDisplay.text}
                      </span>
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleViewDocument(doc.id, doc.originalFileName, true)}
                    disabled={loadingDocId === doc.id}
                    className='rounded-full bg-blue-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-blue-700'
                  >
                    {loadingDocId === doc.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      'View'
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Other Documents */}
      <div className='mt-4 space-y-2'>
        <p className='font-semibold text-slate-900 text-sm'>Other documents</p>
        {applicationDocuments.length === 0 ? (
          <p className='text-xs text-slate-500'>No additional documents uploaded.</p>
        ) : (
          <div className='space-y-2'>
            {applicationDocuments.map((doc) => (
              <div
                key={doc.id}
                className='flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2'
              >
                <div className='min-w-0'>
                  <p className='text-xs font-medium text-slate-900 truncate'>{doc.originalFileName}</p>
                  <p className='text-[11px] text-slate-500'>
                    {String(doc.category).replace(/_/g, ' ')} • {String(doc.docType).replace(/_/g, ' ')} •{' '}
                    {doc.status}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleViewDocument(doc.id, doc.originalFileName, false)}
                  disabled={loadingDocId === doc.id}
                  className='rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-slate-800'
                >
                  {loadingDocId === doc.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    'View'
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
