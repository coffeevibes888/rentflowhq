'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { format, addDays, startOfDay, isSameDay } from 'date-fns';
import Link from 'next/link';

interface AvailabilityPreviewProps {
  contractorId: string;
  subdomain: string;
}

export default function AvailabilityPreview({ contractorId, subdomain }: AvailabilityPreviewProps) {
  const [nextAvailable, setNextAvailable] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNextAvailable();
  }, [contractorId]);

  const fetchNextAvailable = async () => {
    try {
      const today = startOfDay(new Date());
      const endDate = addDays(today, 14); // Check next 2 weeks

      const res = await fetch(
        `/api/contractor/calendar/next-available?contractorId=${contractorId}&start=${today.toISOString()}&end=${endDate.toISOString()}`
      );

      if (res.ok) {
        const data = await res.json();
        if (data.nextAvailable) {
          setNextAvailable(new Date(data.nextAvailable));
        }
      }
    } catch (error) {
      console.error('Failed to fetch availability:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Loading availability...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Instant Booking Available
        </CardTitle>
        <CardDescription>
          Book your appointment online in minutes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {nextAvailable ? (
          <>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-900 dark:text-green-100">
                  Next Available
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {isSameDay(nextAvailable, new Date()) ? 'Today' : format(nextAvailable, 'EEEE, MMMM d')}
                  {' at '}
                  {format(nextAvailable, 'h:mm a')}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Instant confirmation</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4" />
                <span>Flexible scheduling</span>
              </div>
            </div>

            <Link href={`/c/${subdomain}/book`}>
              <Button className="w-full" size="lg">
                <Calendar className="h-4 w-4 mr-2" />
                View Calendar & Book Now
              </Button>
            </Link>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-4">
              No immediate availability. Contact for scheduling.
            </p>
            <Link href={`/c/${subdomain}/book`}>
              <Button variant="outline" className="w-full">
                View Full Calendar
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
