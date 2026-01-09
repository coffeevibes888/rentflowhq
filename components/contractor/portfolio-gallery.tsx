'use client';

import { useState, useTransition } from 'react';
import { deleteContractorPortfolioImage } from '@/lib/actions/contractor-profile.actions';
import { X, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface ContractorPortfolioGalleryProps {
  images: string[];
}

export function ContractorPortfolioGallery({ images }: ContractorPortfolioGalleryProps) {
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = (imageUrl: string) => {
    setDeletingUrl(imageUrl);
    startTransition(async () => {
      await deleteContractorPortfolioImage(imageUrl);
      setDeletingUrl(null);
    });
  };

  if (images.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <p>No portfolio images yet. Add some to showcase your work!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {images.map((url, idx) => (
        <div key={url} className="relative aspect-square rounded-lg overflow-hidden group">
          <Image
            src={url}
            alt={`Portfolio image ${idx + 1}`}
            fill
            className="object-cover"
          />
          <button
            type="button"
            onClick={() => handleDelete(url)}
            disabled={isPending && deletingUrl === url}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
          >
            {isPending && deletingUrl === url ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </button>
        </div>
      ))}
    </div>
  );
}
