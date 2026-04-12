'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  MapPin,
  DollarSign,
  Star,
  Shield,
  Award,
  Briefcase,
  X,
  SlidersHorizontal,
} from 'lucide-react';

interface AdvancedSearchProps {
  onSearch: (filters: any) => void;
  initialFilters?: any;
}

export function AdvancedSearch({ onSearch, initialFilters = {} }: AdvancedSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState({
    query: initialFilters.query || '',
    location: initialFilters.location || '',
    radius: initialFilters.radius || 25,
    serviceTypes: initialFilters.serviceTypes || [],
    minRating: initialFilters.minRating || 0,
    maxPrice: initialFilters.maxPrice || 10000,
    verified: initialFilters.verified || false,
    licensed: initialFilters.licensed || false,
    insured: initialFilters.insured || false,
    backgroundChecked: initialFilters.backgroundChecked || false,
    minExperience: initialFilters.minExperience || 0,
    availability: initialFilters.availability || 'any',
    sortBy: initialFilters.sortBy || 'relevance',
  });

  const serviceTypes = [
    'General Contractor',
    'Plumber',
    'Electrician',
    'HVAC',
    'Roofer',
    'Painter',
    'Carpenter',
    'Landscaper',
    'Handyman',
    'Flooring',
    'Drywall',
    'Tile Work',
    'Kitchen Remodel',
    'Bathroom Remodel',
    'Deck Building',
    'Fence Installation',
  ];

  const handleServiceTypeToggle = (service: string) => {
    setFilters((prev) => ({
      ...prev,
      serviceTypes: prev.serviceTypes.includes(service)
        ? prev.serviceTypes.filter((s: string) => s !== service)
        : [...prev.serviceTypes, service],
    }));
  };

  const handleSearch = () => {
    // Build query string
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'any' && value !== 0 && value !== false) {
        if (Array.isArray(value)) {
          if (value.length > 0) {
            params.set(key, value.join(','));
          }
        } else {
          params.set(key, String(value));
        }
      }
    });

    router.push(`/contractors?${params.toString()}`);
    onSearch(filters);
  };

  const handleReset = () => {
    const resetFilters = {
      query: '',
      location: '',
      radius: 25,
      serviceTypes: [],
      minRating: 0,
      maxPrice: 10000,
      verified: false,
      licensed: false,
      insured: false,
      backgroundChecked: false,
      minExperience: 0,
      availability: 'any',
      sortBy: 'relevance',
    };
    setFilters(resetFilters);
    router.push('/contractors');
    onSearch(resetFilters);
  };

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'query' || key === 'location' || key === 'sortBy') return false;
    if (key === 'radius' && value === 25) return false;
    if (key === 'maxPrice' && value === 10000) return false;
    if (key === 'minRating' && value === 0) return false;
    if (key === 'minExperience' && value === 0) return false;
    if (key === 'availability' && value === 'any') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    if (typeof value === 'boolean' && !value) return false;
    return true;
  }).length;

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5" />
            Search Filters
          </div>
          {activeFilterCount > 0 && (
            <Badge variant="secondary">{activeFilterCount} active</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search Query */}
        <div>
          <Label htmlFor="query" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search
          </Label>
          <Input
            id="query"
            value={filters.query}
            onChange={(e) => setFilters({ ...filters, query: e.target.value })}
            placeholder="Search contractors..."
            className="mt-2"
          />
        </div>

        {/* Location */}
        <div>
          <Label htmlFor="location" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Location
          </Label>
          <Input
            id="location"
            value={filters.location}
            onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            placeholder="City, State or ZIP"
            className="mt-2"
          />
          <div className="mt-3">
            <Label className="text-sm text-muted-foreground">
              Radius: {filters.radius} miles
            </Label>
            <Slider
              value={[filters.radius]}
              onValueChange={(value: number[]) => setFilters({ ...filters, radius: value[0] })}
              min={5}
              max={100}
              step={5}
              className="mt-2"
            />
          </div>
        </div>

        <Accordion type="multiple" className="w-full">
          {/* Service Types */}
          <AccordionItem value="services">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Service Types
                {filters.serviceTypes.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {filters.serviceTypes.length}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {serviceTypes.map((service) => (
                  <div key={service} className="flex items-center space-x-2">
                    <Checkbox
                      id={service}
                      checked={filters.serviceTypes.includes(service)}
                      onCheckedChange={() => handleServiceTypeToggle(service)}
                    />
                    <label
                      htmlFor={service}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {service}
                    </label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Rating */}
          <AccordionItem value="rating">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                Minimum Rating
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {[4.5, 4.0, 3.5, 3.0].map((rating) => (
                  <div key={rating} className="flex items-center space-x-2">
                    <Checkbox
                      id={`rating-${rating}`}
                      checked={filters.minRating === rating}
                      onCheckedChange={(checked) =>
                        setFilters({ ...filters, minRating: checked ? rating : 0 })
                      }
                    />
                    <label
                      htmlFor={`rating-${rating}`}
                      className="text-sm font-medium leading-none cursor-pointer flex items-center gap-1"
                    >
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {rating}+ stars
                    </label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Price Range */}
          <AccordionItem value="price">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Max Hourly Rate
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                <Label className="text-sm text-muted-foreground">
                  Up to ${filters.maxPrice}/hr
                </Label>
                <Slider
                  value={[filters.maxPrice]}
                  onValueChange={(value: number[]) => setFilters({ ...filters, maxPrice: value[0] })}
                  min={50}
                  max={500}
                  step={10}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Verification Badges */}
          <AccordionItem value="verification">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Verification
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="verified"
                    checked={filters.verified}
                    onCheckedChange={(checked) =>
                      setFilters({ ...filters, verified: !!checked })
                    }
                  />
                  <label htmlFor="verified" className="text-sm font-medium cursor-pointer">
                    Verified Identity
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="licensed"
                    checked={filters.licensed}
                    onCheckedChange={(checked) =>
                      setFilters({ ...filters, licensed: !!checked })
                    }
                  />
                  <label htmlFor="licensed" className="text-sm font-medium cursor-pointer">
                    Licensed
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="insured"
                    checked={filters.insured}
                    onCheckedChange={(checked) =>
                      setFilters({ ...filters, insured: !!checked })
                    }
                  />
                  <label htmlFor="insured" className="text-sm font-medium cursor-pointer">
                    Insured
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="backgroundChecked"
                    checked={filters.backgroundChecked}
                    onCheckedChange={(checked) =>
                      setFilters({ ...filters, backgroundChecked: !!checked })
                    }
                  />
                  <label
                    htmlFor="backgroundChecked"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Background Checked
                  </label>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Experience */}
          <AccordionItem value="experience">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                Experience
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                <Label className="text-sm text-muted-foreground">
                  Minimum {filters.minExperience} years
                </Label>
                <Slider
                  value={[filters.minExperience]}
                  onValueChange={(value: number[]) =>
                    setFilters({ ...filters, minExperience: value[0] })
                  }
                  min={0}
                  max={30}
                  step={1}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Availability */}
          <AccordionItem value="availability">
            <AccordionTrigger>Availability</AccordionTrigger>
            <AccordionContent>
              <Select
                value={filters.availability}
                onValueChange={(value) => setFilters({ ...filters, availability: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Time</SelectItem>
                  <SelectItem value="immediate">Available Now</SelectItem>
                  <SelectItem value="this_week">This Week</SelectItem>
                  <SelectItem value="this_month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Sort By */}
        <div>
          <Label htmlFor="sortBy">Sort By</Label>
          <Select
            value={filters.sortBy}
            onValueChange={(value) => setFilters({ ...filters, sortBy: value })}
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="reviews">Most Reviews</SelectItem>
              <SelectItem value="price_low">Price: Low to High</SelectItem>
              <SelectItem value="price_high">Price: High to Low</SelectItem>
              <SelectItem value="experience">Most Experience</SelectItem>
              <SelectItem value="recent">Recently Active</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button onClick={handleSearch} className="flex-1">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          {activeFilterCount > 0 && (
            <Button onClick={handleReset} variant="outline">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
