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

interface LeaseViewerProps {
  leaseHtml: string;
  triggerLabel?: string;
}

export default function LeaseViewer({ leaseHtml, triggerLabel = 'View lease' }: LeaseViewerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='outline' className='rounded-full border-white/30 text-white hover:bg-white/10'>
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-6xl h-[90dvh] max-h-[900px] overflow-hidden border border-black/10 bg-[#fafaf9] p-0'>
        <DialogHeader className='px-4 sm:px-6 py-3 sm:py-4 border-b border-black/10 bg-white'>
          <DialogTitle className='text-lg sm:text-2xl font-semibold text-gray-900'>Lease preview</DialogTitle>
        </DialogHeader>

        <div className='flex-1 min-h-0 overflow-auto p-4 sm:p-6 bg-white'>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
