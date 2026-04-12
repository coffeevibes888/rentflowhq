import { notFound } from 'next/navigation';
import { prisma } from '@/db/prisma';
import BookingCalendarWidget from '@/components/contractor/calendar/booking-calendar-widget';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star, Calendar } from 'lucide-react';

interface BookingPageProps {
  params: {
    subdomain: string;
  };
}

export default async function ContractorBookingPage({ params }: BookingPageProps) {
  const { subdomain } = params;

  const contractor = await prisma.contractorProfile.findUnique({
    where: { subdomain },
    select: {
      id: true,
      businessName: true,
      displayName: true,
      bio: true,
      profileImage: true,
      specialties: true,
      serviceArea: true,
      rating: true,
      reviewCount: true,
      instantBookingEnabled: true,
      depositRequired: true,
      depositAmount: true,
      cancellationPolicy: true,
      cancellationHours: true,
    },
  });

  if (!contractor || !contractor.instantBookingEnabled) {
    notFound();
  }

  const name = contractor.displayName || contractor.businessName || 'Contractor';

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto py-8 space-y-8">
        {/* Contractor Info Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={contractor.profileImage || undefined} alt={name} />
                <AvatarFallback className="text-2xl">
                  {name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-3">
                <div>
                  <h1 className="text-3xl font-bold">{name}</h1>
                  {contractor.businessName && contractor.displayName && (
                    <p className="text-muted-foreground">{contractor.businessName}</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {contractor.rating && contractor.reviewCount ? (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {contractor.rating.toFixed(1)} ({contractor.reviewCount} reviews)
                    </Badge>
                  ) : null}
                  {contractor.serviceArea && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {contractor.serviceArea}
                    </Badge>
                  )}
                  <Badge className="flex items-center gap-1 bg-green-100 text-green-800 hover:bg-green-200">
                    <Calendar className="h-3 w-3" />
                    Instant Booking Available
                  </Badge>
                </div>

                {contractor.bio && (
                  <p className="text-muted-foreground">{contractor.bio}</p>
                )}

                {contractor.specialties && contractor.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {contractor.specialties.map((specialty) => (
                      <Badge key={specialty} variant="outline" className="capitalize">
                        {specialty.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Booking Policies */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {contractor.depositRequired && contractor.depositAmount && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Deposit Required</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">${contractor.depositAmount.toString()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Refundable based on cancellation policy
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Cancellation Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold capitalize">
                {contractor.cancellationPolicy || 'Moderate'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {contractor.cancellationHours || 24} hours notice required
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">Instant Confirmation</p>
              <p className="text-xs text-muted-foreground mt-1">
                Your booking is confirmed immediately
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Booking Calendar */}
        <BookingCalendarWidget
          contractorId={contractor.id}
          contractorName={name}
          serviceTypes={contractor.specialties || []}
        />
      </div>
    </div>
  );
}
