'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FileCheck, FileText, ExternalLink } from 'lucide-react';

interface LeaseViewerProps {
  leaseHtml: string;
  signedPdfUrl?: string | null;
  triggerLabel?: string;
}

export default function LeaseViewer({ leaseHtml, signedPdfUrl, triggerLabel = 'View lease' }: LeaseViewerProps) {
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'pdf' | 'html'>(signedPdfUrl ? 'pdf' : 'html');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='outline' className='rounded-full border-white/30 text-white hover:bg-white/10'>
          {signedPdfUrl && <FileCheck className='w-4 h-4 mr-2 text-emerald-400' />}
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-6xl h-[90dvh] max-h-[900px] overflow-hidden border border-black/10 bg-[#fafaf9] p-0'>
        <DialogHeader className='px-4 sm:px-6 py-3 sm:py-4 border-b border-black/10 bg-white'>
          <div className='flex items-center justify-between'>
            <DialogTitle className='text-lg sm:text-2xl font-semibold text-gray-900'>
              {signedPdfUrl ? 'Signed Lease Document' : 'Lease Preview'}
            </DialogTitle>
            {signedPdfUrl && (
              <div className='flex items-center gap-2'>
                <Button
                  variant={viewMode === 'pdf' ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => setViewMode('pdf')}
                  className='text-xs'
                >
                  <FileCheck className='w-3 h-3 mr-1' />
                  Signed PDF
                </Button>
                <Button
                  variant={viewMode === 'html' ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => setViewMode('html')}
                  className='text-xs'
                >
                  <FileText className='w-3 h-3 mr-1' />
                  Preview
                </Button>
                <a
                  href={signedPdfUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800'
                >
                  <ExternalLink className='w-3 h-3' />
                  Download
                </a>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className='flex-1 min-h-0 overflow-auto p-4 sm:p-6 bg-white'>
          {viewMode === 'pdf' && signedPdfUrl ? (
            <div className='h-full'>
              <iframe
                src={signedPdfUrl}
                className='w-full h-full min-h-[600px] rounded-xl border border-black/10'
                title='Signed Lease PDF'
              />
            </div>
          ) : (
            <div className='rounded-xl border border-black/10 bg-white p-4 sm:p-6'>
              {leaseHtml ? (
                <div
                  className='prose prose-sm max-w-none text-gray-800'
                  style={{ fontSize: '14px', lineHeight: '1.6' }}
                  dangerouslySetInnerHTML={{ __html: leaseHtml }}
                />
              ) : (
                <p className='text-sm text-gray-500'>Lease content is unavailable.</p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
