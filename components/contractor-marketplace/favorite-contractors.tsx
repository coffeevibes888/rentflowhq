'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import {
  Heart,
  Star,
  MapPin,
  Trash2,
  MessageSquare,
  ExternalLink,
} from 'lucide-react';
import { format } from 'date-fns';

interface FavoriteContractorsProps {
  favorites: any[];
}

export function FavoriteContractors({ favorites: initialFavorites }: FavoriteContractorsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState(initialFavorites);

  const handleRemoveFavorite = async (favoriteId: string) => {
    try {
      const response = await fetch(`/api/favorites/${favoriteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove favorite');
      }

      setFavorites(favorites.filter((f) => f.id !== favoriteId));
      toast({
        title: 'Removed from Favorites',
        description: 'Contractor has been removed from your favorites',
      });
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove favorite',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 fill-red-500 text-red-500" />
          Favorite Contractors
        </CardTitle>
      </CardHeader>
      <CardContent>
        {favorites.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Heart className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No favorite contractors yet</p>
            <p className="text-xs mt-1">
              Save contractors you like for easy access later
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {favorites.map((favorite) => {
              const contractor = favorite.contractor;
              return (
                <div
                  key={favorite.id}
                  className="flex gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {/* Avatar */}
                  <Link href={`/contractors/${contractor.id}`}>
                    <Avatar className="w-16 h-16 cursor-pointer">
                      <AvatarImage src={contractor.profileImage} />
                      <AvatarFallback>
                        {contractor.businessName?.charAt(0) || 'C'}
                      </AvatarFallback>
                    </Avatar>
                  </Link>

                  {/* Content */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <Link href={`/contractors/${contractor.id}`}>
                          <h4 className="font-semibold hover:text-blue-600 transition-colors">
                            {contractor.businessName}
                          </h4>
                        </Link>
                        {contractor.tagline && (
                          <p className="text-sm text-muted-foreground">
                            {contractor.tagline}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFavorite(favorite.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>

                    {/* Rating */}
                    {contractor.rating && (
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">
                          {contractor.rating.toFixed(1)}
                        </span>
                        <span className="text-muted-foreground">
                          ({contractor.reviewCount || 0} reviews)
                        </span>
                      </div>
                    )}

                    {/* Location */}
                    {contractor.location && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {contractor.location}
                      </div>
                    )}

                    {/* Tags */}
                    {favorite.tags && favorite.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {favorite.tags.map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Notes */}
                    {favorite.notes && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-2">
                        <p className="text-sm text-blue-900">
                          <MessageSquare className="h-3 w-3 inline mr-1" />
                          {favorite.notes}
                        </p>
                      </div>
                    )}

                    {/* Saved Date */}
                    <p className="text-xs text-muted-foreground">
                      Saved {format(new Date(favorite.createdAt), 'MMM d, yyyy')}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" asChild>
                        <Link href={`/contractors/${contractor.id}`}>
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View Profile
                        </Link>
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link
                          href={`/contractors/${contractor.id}?action=request-quote`}
                        >
                          Request Quote
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
