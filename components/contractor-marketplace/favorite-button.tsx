'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Heart, Loader2 } from 'lucide-react';

interface FavoriteButtonProps {
  contractorId: string;
  isFavorited?: boolean;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
}

export function FavoriteButton({
  contractorId,
  isFavorited: initialFavorited = false,
  size = 'default',
  variant = 'ghost',
}: FavoriteButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsLoading(true);

    try {
      if (isFavorited) {
        // Remove from favorites
        // We need to find the favorite ID first
        const response = await fetch('/api/favorites');
        const data = await response.json();
        const favorite = data.favorites?.find(
          (f: any) => f.contractorId === contractorId
        );

        if (favorite) {
          await fetch(`/api/favorites/${favorite.id}`, {
            method: 'DELETE',
          });
        }

        setIsFavorited(false);
        toast({
          title: 'Removed from Favorites',
          description: 'Contractor has been removed from your favorites',
        });
      } else {
        // Add to favorites
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contractorId }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to add favorite');
        }

        setIsFavorited(true);
        toast({
          title: 'Added to Favorites',
          description: 'Contractor has been added to your favorites',
        });
      }

      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update favorites',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggleFavorite}
      disabled={isLoading}
      className="relative"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart
          className={`h-4 w-4 ${
            isFavorited ? 'fill-red-500 text-red-500' : ''
          }`}
        />
      )}
    </Button>
  );
}
