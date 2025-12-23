'use client';

import { useState } from 'react';
import { 
  Home, MapPin, Bed, Bath, Square, Calendar, DollarSign, 
  Building2, School, Loader2,
  RefreshCw, ExternalLink, BarChart3, History, AlertCircle, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import Image from 'next/image';

interface PropertyZillowDataProps {
  propertyAddress: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  // Basic property info from the form (always available)
  propertyInfo?: {
    bedrooms?: number;
    bathrooms?: number;
    sizeSqFt?: number;
    yearBuilt?: number;
    propertyType?: string;
    rentAmount?: number;
  };
  zpid?: string;
  isPro?: boolean;
}

interface ZillowData {
  property: {
    zpid: string;
    address: {
      streetAddress: string;
      city: string;
      state: string;
      zipcode: string;
      neighborhood?: string;
      county?: string;
    };
    bedrooms: number;
    bathrooms: number;
    livingArea: number;
    lotSize: number;
    yearBuilt: number;
    homeType: string;
    zestimate: number;
    rentZestimate: number;
    taxAssessedValue: number;
    taxAssessedYear: number;
    description: string;
    features: string[];
    images: string[];
    schools: Array<{
      name: string;
      rating: number;
      distance: number;
      type: string;
      grades: string;
    }>;
    priceHistory: Array<{
      date: string;
      price: number;
      event: string;
    }>;
    taxHistory: Array<{
      year: number;
      taxPaid: number;
      value: number;
    }>;
  };
  comps: Array<{
    zpid: string;
    address: string;
    bedrooms: number;
    bathrooms: number;
    livingArea: number;
    yearBuilt: number;
    zestimate: number;
    rentZestimate: number;
    distance: number;
    imgSrc: string;
    lastSoldPrice?: number;
    lastSoldDate?: string;
  }>;
}

export function PropertyZillowData({ propertyAddress, propertyInfo, isPro = false }: PropertyZillowDataProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ZillowData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchZillowData = async () => {
    if (!propertyAddress.street) {
      setError('Property address is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fullAddress = `${propertyAddress.street}, ${propertyAddress.city}, ${propertyAddress.state} ${propertyAddress.zipCode}`;
      const response = await fetch(`/api/zillow/search?address=${encodeURIComponent(fullAddress)}`);
      const result = await response.json();

      if (!response.ok) {
        if (result.requiresUpgrade) {
          setError('Zillow data requires a Pro subscription');
        } else {
          setError(result.error || 'Failed to fetch property data');
        }
        return;
      }

      if (!result.success) {
        setError(result.message || 'Property not found');
        return;
      }

      setData({
        property: result.property,
        comps: result.comps || [],
      });
      setLastFetched(new Date());
    } catch (err: any) {
      console.error('Zillow fetch error:', err);
      setError('Failed to fetch property data');
    } finally {
      setLoading(false);
    }
  };

  // Determine what data to display - Zillow data if available, otherwise form data
  const displayData = data?.property || null;

  // Show basic property details section (always visible)
  const BasicPropertyDetails = () => (
    <Card className="border-white/10 bg-slate-900/60">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Home className="w-5 h-5" />
          Property Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-slate-800/60">
            <Bed className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-slate-400">Beds</p>
              <p className="text-base sm:text-lg font-semibold text-white">
                {displayData?.bedrooms || propertyInfo?.bedrooms || '—'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-slate-800/60">
            <Bath className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-slate-400">Baths</p>
              <p className="text-base sm:text-lg font-semibold text-white">
                {displayData?.bathrooms || propertyInfo?.bathrooms || '—'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-slate-800/60">
            <Square className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-slate-400">Area</p>
              <p className="text-base sm:text-lg font-semibold text-white">
                {(displayData?.livingArea || propertyInfo?.sizeSqFt)?.toLocaleString() || '—'}<span className="text-xs"> sqft</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-slate-800/60">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-slate-400">Built</p>
              <p className="text-base sm:text-lg font-semibold text-white">
                {displayData?.yearBuilt || propertyInfo?.yearBuilt || '—'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-slate-800/60">
            <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-slate-400">Type</p>
              <p className="text-sm sm:text-lg font-semibold text-white capitalize truncate">
                {(displayData?.homeType || propertyInfo?.propertyType)?.replace(/_/g, ' ').toLowerCase() || '—'}
              </p>
            </div>
          </div>
          {propertyInfo?.rentAmount && (
            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-slate-800/60">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-slate-400">Rent</p>
                <p className="text-base sm:text-lg font-semibold text-white">
                  {formatCurrency(propertyInfo.rentAmount)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Address */}
        {propertyAddress.street && (
          <div className="pt-4 border-t border-white/10">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-white truncate">{propertyAddress.street}</p>
                <p className="text-xs text-slate-400">
                  {[propertyAddress.city, propertyAddress.state, propertyAddress.zipCode].filter(Boolean).join(', ')}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Pro upgrade prompt for Zillow features
  const ProUpgradePrompt = () => (
    <Card className="border-violet-400/30 bg-violet-500/10">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-violet-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white mb-1">Unlock Zillow Market Data</h3>
            <p className="text-sm text-slate-300 mb-3">
              Upgrade to Pro to access Zestimate® home values, comparable properties, 
              nearby schools, price history, and neighborhood insights.
            </p>
            <Button className="bg-violet-600 hover:bg-violet-700" size="sm">
              Upgrade to Pro
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // If not Pro, show basic info + upgrade prompt
  if (!isPro) {
    return (
      <div className="space-y-6">
        <BasicPropertyDetails />
        <ProUpgradePrompt />
      </div>
    );
  }

  // Pro user - show basic info + Zillow fetch option
  if (loading) {
    return (
      <div className="space-y-6">
        <BasicPropertyDetails />
        <Card className="border-white/10 bg-slate-900/60">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
            <p className="text-slate-400">Fetching market data from Zillow...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <BasicPropertyDetails />
        <Card className="border-white/10 bg-slate-900/60">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-amber-300 text-sm mb-3">{error}</p>
                <Button onClick={fetchZillowData} variant="outline" size="sm" className="border-white/20 text-black">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pro user without Zillow data yet - show fetch button
  if (!data) {
    return (
      <div className="space-y-6">
        <BasicPropertyDetails />
        
        {/* Zillow Fetch Option */}
        <Card className="border-blue-400/30 bg-blue-500/10">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-1">Zillow Market Data</h3>
                <p className="text-sm text-slate-300 mb-3">
                  Fetch Zestimate® home value, comparable properties, nearby schools, 
                  and price history for this property.
                </p>
                <Button 
                  onClick={fetchZillowData} 
                  className="bg-blue-600 hover:bg-blue-700"
                  size="sm"
                  disabled={!propertyAddress.street}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Fetch Zillow Data
                </Button>
                {!propertyAddress.street && (
                  <p className="text-xs text-slate-500 mt-2">Property address required</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pro user with Zillow data - show everything
  const { property, comps } = data;

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">Property & Market Data</h3>
          {lastFetched && (
            <p className="text-xs text-slate-400">
              Zillow data updated: {lastFetched.toLocaleString()}
            </p>
          )}
        </div>
        <Button onClick={fetchZillowData} variant="outline" size="sm" className="border-white/20 text-black w-fit">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Property Value Card */}
      <div className="relative rounded-3xl border border-white/10 shadow-2xl overflow-hidden backdrop-blur-md">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600" />
        <div className="relative p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-bold text-white">Property Valuation</h3>
            <Badge className="bg-white/20 text-white text-xs">Zestimate®</Badge>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="rounded-xl bg-white/10 border border-white/20 p-3 sm:p-4 backdrop-blur-sm">
              <p className="text-[10px] sm:text-xs text-white/80 mb-1">Home Value</p>
              <p className="text-lg sm:text-2xl font-bold text-white">
                {formatCurrency(property.zestimate)}
              </p>
            </div>
            <div className="rounded-xl bg-white/10 border border-white/20 p-3 sm:p-4 backdrop-blur-sm">
              <p className="text-[10px] sm:text-xs text-white/80 mb-1">Rent Estimate</p>
              <p className="text-lg sm:text-2xl font-bold text-white">
                {formatCurrency(property.rentZestimate)}<span className="text-xs sm:text-sm">/mo</span>
              </p>
            </div>
            <div className="rounded-xl bg-white/10 border border-white/20 p-3 sm:p-4 backdrop-blur-sm">
              <p className="text-[10px] sm:text-xs text-white/80 mb-1">Tax Assessed</p>
              <p className="text-lg sm:text-2xl font-bold text-white">
                {formatCurrency(property.taxAssessedValue)}
              </p>
              <p className="text-[10px] text-white/60">({property.taxAssessedYear})</p>
            </div>
            <div className="rounded-xl bg-white/10 border border-white/20 p-3 sm:p-4 backdrop-blur-sm">
              <p className="text-[10px] sm:text-xs text-white/80 mb-1">Price/SqFt</p>
              <p className="text-lg sm:text-2xl font-bold text-white">
                {property.livingArea > 0 
                  ? formatCurrency(Math.round(property.zestimate / property.livingArea))
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Property Details */}
        <Card className="border-white/10 bg-slate-900/60">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Home className="w-5 h-5" />
              Property Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-slate-800/60">
                <Bed className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-slate-400">Beds</p>
                  <p className="text-base sm:text-lg font-semibold text-white">{property.bedrooms}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-slate-800/60">
                <Bath className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-slate-400">Baths</p>
                  <p className="text-base sm:text-lg font-semibold text-white">{property.bathrooms}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-slate-800/60">
                <Square className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-slate-400">Area</p>
                  <p className="text-base sm:text-lg font-semibold text-white">{property.livingArea?.toLocaleString()}<span className="text-xs"> sqft</span></p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-slate-800/60">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-slate-400">Lot</p>
                  <p className="text-base sm:text-lg font-semibold text-white">{property.lotSize?.toLocaleString() || 'N/A'}<span className="text-xs"> sqft</span></p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-slate-800/60">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-slate-400">Built</p>
                  <p className="text-base sm:text-lg font-semibold text-white">{property.yearBuilt}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-slate-800/60">
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-slate-400">Type</p>
                  <p className="text-sm sm:text-lg font-semibold text-white capitalize truncate">{property.homeType?.replace(/_/g, ' ').toLowerCase()}</p>
                </div>
              </div>
            </div>

            {/* Features */}
            {property.features && property.features.length > 0 && (
              <div className="pt-4 border-t border-white/10">
                <p className="text-sm font-medium text-slate-300 mb-2">Features</p>
                <div className="flex flex-wrap gap-2">
                  {property.features.map((feature, i) => (
                    <Badge key={i} variant="outline" className="border-white/20 text-slate-300">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Schools */}
        {property.schools && property.schools.length > 0 && (
          <Card className="border-white/10 bg-slate-900/60">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <School className="w-5 h-5" />
                Nearby Schools
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {property.schools.slice(0, 5).map((school, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/60">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{school.name}</p>
                    <p className="text-xs text-slate-400">{school.type} • {school.grades}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-slate-400">{school.distance} mi</p>
                    </div>
                    {school.rating > 0 && (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        school.rating >= 8 ? 'bg-emerald-500/20 text-emerald-400' :
                        school.rating >= 5 ? 'bg-amber-500/20 text-amber-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {school.rating}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Comparable Properties */}
      {comps && comps.length > 0 && (
        <Card className="border-white/10 bg-slate-900/60">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Comparable Properties
            </CardTitle>
            <CardDescription className="text-slate-400">
              Similar properties in the area
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {comps.slice(0, 6).map((comp, i) => (
                <div key={i} className="rounded-xl border border-white/10 bg-slate-800/60 overflow-hidden">
                  {comp.imgSrc && (
                    <div className="relative aspect-[16/10]">
                      <Image
                        src={comp.imgSrc}
                        alt={comp.address}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="p-3 space-y-2">
                    <p className="text-sm font-medium text-white truncate">{comp.address}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>{comp.bedrooms} bd</span>
                      <span>{comp.bathrooms} ba</span>
                      <span>{comp.livingArea?.toLocaleString()} sqft</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <div>
                        <p className="text-xs text-slate-400">Zestimate</p>
                        <p className="text-sm font-semibold text-emerald-400">
                          {formatCurrency(comp.zestimate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Distance</p>
                        <p className="text-sm text-slate-300">{comp.distance} mi</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Price History */}
      {property.priceHistory && property.priceHistory.length > 0 && (
        <Card className="border-white/10 bg-slate-900/60">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <History className="w-5 h-5" />
              Price History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {property.priceHistory.slice(0, 10).map((event, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/60">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      event.event.toLowerCase().includes('sold') ? 'bg-emerald-400' :
                      event.event.toLowerCase().includes('listed') ? 'bg-blue-400' :
                      'bg-slate-400'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-white">{event.event}</p>
                      <p className="text-xs text-slate-400">{new Date(event.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-white">
                    {event.price > 0 ? formatCurrency(event.price) : '—'}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Zillow Attribution */}
      <div className="text-center text-xs text-slate-500">
        <p>Data provided by Zillow. Zestimate® is a registered trademark of Zillow, Inc.</p>
        <a 
          href={`https://www.zillow.com/homes/${property.zpid}_zpid/`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-blue-400 hover:underline mt-1"
        >
          View on Zillow <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
