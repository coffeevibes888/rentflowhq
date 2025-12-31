'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  Loader2, 
  Home, 
  MapPin, 
  Bed, 
  Bath, 
  Square, 
  Calendar,
  DollarSign,
  ImageIcon,
  CheckCircle2,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Image from 'next/image';

interface ZillowPropertyData {
  zpid: string;
  address: {
    streetAddress: string;
    city: string;
    state: string;
    zipcode: string;
  };
  bedrooms: number;
  bathrooms: number;
  livingArea: number;
  yearBuilt: number;
  homeType: string;
  zestimate: number;
  rentZestimate: number;
  description: string;
  images: string[];
  features: string[];
}

interface ZillowPropertyLookupProps {
  onPropertyFound: (data: {
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
    bedrooms: number;
    bathrooms: number;
    sizeSqFt: number;
    yearBuilt: number;
    propertyType: string;
    description: string;
    images: string[];
    zestimate: number;
    rentZestimate: number;
    zpid: string;
  }) => void;
  disabled?: boolean;
  isPro?: boolean;
}

export function ZillowPropertyLookup({ onPropertyFound, disabled, isPro = false }: ZillowPropertyLookupProps) {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [property, setProperty] = useState<ZillowPropertyData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!address.trim()) {
      toast({
        title: 'Address required',
        description: 'Please enter a property address to search',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setError(null);
    setProperty(null);

    try {
      const response = await fetch(`/api/zillow/search?address=${encodeURIComponent(address)}`);
      const data = await response.json();

      if (!response.ok) {
        if (data.requiresUpgrade) {
          setError('Zillow property lookup requires a Pro subscription. Upgrade to auto-populate property details.');
        } else {
          setError(data.error || 'Failed to search property');
        }
        return;
      }

      if (!data.success || !data.property) {
        setError(data.message || 'No property found at this address');
        return;
      }

      setProperty(data.property);
      
      toast({
        title: 'Property found!',
        description: 'Click "Use This Property" to auto-fill the form',
      });
    } catch (err: any) {
      console.error('Zillow search error:', err);
      setError('Failed to search property. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseProperty = () => {
    if (!property) return;

    onPropertyFound({
      address: {
        street: property.address.streetAddress,
        city: property.address.city,
        state: property.address.state,
        zipCode: property.address.zipcode,
      },
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      sizeSqFt: property.livingArea,
      yearBuilt: property.yearBuilt,
      propertyType: mapHomeType(property.homeType),
      description: property.description || '',
      images: property.images || [],
      zestimate: property.zestimate,
      rentZestimate: property.rentZestimate,
      zpid: property.zpid,
    });

    toast({
      title: 'Property data applied!',
      description: 'Form has been auto-filled with Zillow data',
    });
  };

  const mapHomeType = (zillowType: string): string => {
    const typeMap: Record<string, string> = {
      'SINGLE_FAMILY': 'house',
      'CONDO': 'condo',
      'TOWNHOUSE': 'townhouse',
      'MULTI_FAMILY': 'multi-family',
      'APARTMENT': 'apartment',
      'MANUFACTURED': 'manufactured',
      'LOT': 'land',
    };
    return typeMap[zillowType] || 'house';
  };

  if (!isPro) {
    return (
      <div className="rounded-xl border border-violet-400/30 bg-violet-500/10 p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-violet-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white mb-1">Pro Feature: Zillow Auto-Fill</h3>
            <p className="text-sm text-slate-300 mb-3">
              Upgrade to Pro to automatically populate property details from Zillow, including photos, 
              property specs, and estimated values.
            </p>
            <Button variant="outline" size="sm" className="border-violet-400/50 text-violet-300 hover:bg-violet-500/20">
              Upgrade to Pro
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-blue-400/30 bg-blue-500/10 p-4">
        {/* <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-white">Auto-Fill from Zillow</h3>
        </div> */}
        <p className="text-sm text-slate-300 mb-4">
          Enter an address to automatically populate property details, photos, and estimated values.
        </p>
        
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Enter property address (e.g., 123 Main St, Las Vegas, NV 89101)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              disabled={loading || disabled}
              className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-500"
            />
          </div>
          <Button 
            onClick={handleSearch} 
            disabled={loading || disabled || !address.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span className="ml-2">Search</span>
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-red-400/30 bg-red-500/10 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Property Preview */}
      {property && (
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h3 className="font-semibold text-white">Property Found</h3>
            </div>
            <Button 
              onClick={handleUseProperty}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Use This Property
            </Button>
          </div>

          <div className="grid md:grid-cols-[200px_1fr] gap-4">
            {/* Property Image */}
            {property.images && property.images.length > 0 && (
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-slate-800">
                <Image
                  src={property.images[0]}
                  alt="Property"
                  fill
                  className="object-cover"
                />
                {property.images.length > 1 && (
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    +{property.images.length - 1} photos
                  </div>
                )}
              </div>
            )}

            {/* Property Details */}
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-white font-medium">{property.address.streetAddress}</p>
                  <p className="text-sm text-slate-400">
                    {property.address.city}, {property.address.state} {property.address.zipcode}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <Bed className="w-4 h-4 text-slate-400" />
                  <span className="text-white">{property.bedrooms} beds</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Bath className="w-4 h-4 text-slate-400" />
                  <span className="text-white">{property.bathrooms} baths</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Square className="w-4 h-4 text-slate-400" />
                  <span className="text-white">{property.livingArea?.toLocaleString()} sqft</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-white">Built {property.yearBuilt}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
                <div>
                  <p className="text-xs text-slate-400">Zestimate®</p>
                  <p className="text-lg font-bold text-emerald-400">
                    ${property.zestimate?.toLocaleString() || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Rent Zestimate®</p>
                  <p className="text-lg font-bold text-blue-400">
                    ${property.rentZestimate?.toLocaleString() || 'N/A'}/mo
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
