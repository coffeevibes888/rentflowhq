'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Star,
  MapPin,
  DollarSign,
  Shield,
  Award,
  Briefcase,
  CheckCircle2,
  Clock,
  TrendingUp,
} from 'lucide-react';

interface SearchResultsProps {
  contractors: any[];
  isLoading?: boolean;
}

export function SearchResults({ contractors, isLoading }: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="w-20 h-20 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-1/3" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (contractors.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Briefcase className="h-8 w-8 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">No contractors found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters or search criteria
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {contractors.map((contractor) => (
        <ContractorCard key={contractor.id} contractor={contractor} />
      ))}
    </div>
  );
}

function ContractorCard({ contractor }: { contractor: any }) {
  const verification = contractor.verification;
  const badges = verification?.badges || [];
  const isVerified = badges.includes('verified');
  const isLicensed = badges.includes('licensed');
  const isInsured = badges.includes('insured');
  const isBackgroundChecked = badges.includes('background_checked');

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex gap-6">
          {/* Avatar */}
          <Link href={`/contractors/${contractor.id}`}>
            <Avatar className="w-20 h-20 cursor-pointer">
              <AvatarImage src={contractor.profileImage} />
              <AvatarFallback className="text-lg">
                {contractor.businessName?.charAt(0) || 'C'}
              </AvatarFallback>
            </Avatar>
          </Link>

          {/* Main Content */}
          <div className="flex-1 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <Link href={`/contractors/${contractor.id}`}>
                  <h3 className="text-xl font-semibold hover:text-blue-600 transition-colors">
                    {contractor.businessName}
                  </h3>
                </Link>
                <p className="text-sm text-muted-foreground">{contractor.tagline}</p>
              </div>
              {isVerified && (
                <Badge className="bg-blue-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>

            {/* Rating & Reviews */}
            {contractor.rating && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{contractor.rating.toFixed(1)}</span>
                  <span className="text-muted-foreground text-sm">
                    ({contractor.reviewCount || 0} reviews)
                  </span>
                </div>
                {contractor.completedJobs > 0 && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Briefcase className="h-4 w-4" />
                    {contractor.completedJobs} jobs completed
                  </div>
                )}
              </div>
            )}

            {/* Verification Badges */}
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {isLicensed && (
                  <Badge variant="outline" className="text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    Licensed
                  </Badge>
                )}
                {isInsured && (
                  <Badge variant="outline" className="text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    Insured
                  </Badge>
                )}
                {isBackgroundChecked && (
                  <Badge variant="outline" className="text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Background Checked
                  </Badge>
                )}
              </div>
            )}

            {/* Services */}
            {contractor.services && contractor.services.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {contractor.services.slice(0, 5).map((service: string) => (
                  <Badge key={service} variant="secondary" className="text-xs">
                    {service}
                  </Badge>
                ))}
                {contractor.services.length > 5 && (
                  <Badge variant="secondary" className="text-xs">
                    +{contractor.services.length - 5} more
                  </Badge>
                )}
              </div>
            )}

            {/* Location & Price */}
            <div className="flex items-center gap-4 text-sm">
              {contractor.location && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {contractor.location}
                </div>
              )}
              {contractor.hourlyRate && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  ${contractor.hourlyRate}/hr
                </div>
              )}
              {contractor.yearsExperience && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Award className="h-4 w-4" />
                  {contractor.yearsExperience} years exp.
                </div>
              )}
            </div>

            {/* Description */}
            {contractor.bio && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {contractor.bio}
              </p>
            )}

            {/* Availability */}
            {contractor.availability && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600 font-medium">
                  {contractor.availability === 'immediate'
                    ? 'Available Now'
                    : contractor.availability === 'this_week'
                    ? 'Available This Week'
                    : 'Available Soon'}
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button asChild>
                <Link href={`/contractors/${contractor.id}`}>View Profile</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/contractors/${contractor.id}?action=request-quote`}>
                  Request Quote
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
