'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Clock, FileText, Briefcase, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';

export function DashboardQuickActions() {
  const router = useRouter();
  const [isClockDialogOpen, setIsClockDialogOpen] = useState(false);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleClockAction = async () => {
    setIsLoading(true);
    try {
      const action = isClockedIn ? 'clock_out' : 'clock_in';
      
      // Get location if available
      let location = null;
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
        } catch (error) {
          console.log('Location not available');
        }
      }

      const response = await fetch('/api/contractor/time/clock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, location }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process clock action');
      }

      setIsClockedIn(!isClockedIn);
      toast({
        title: 'Success',
        description: data.message,
      });
      setIsClockDialogOpen(false);
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to process clock action',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
      {/* Browse Jobs */}
      <Button
        onClick={() => router.push('/contractors?view=jobs')}
        className='h-auto flex-col gap-2 p-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-2 border-black shadow-xl'
      >
        <Briefcase className='h-6 w-6' />
        <span className='text-sm font-semibold'>Browse Jobs</span>
      </Button>

      {/* Create Quote */}
      <Button
        onClick={() => router.push('/contractor/leads')}
        className='h-auto flex-col gap-2 p-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-2 border-black shadow-xl'
      >
        <FileText className='h-6 w-6' />
        <span className='text-sm font-semibold'>Create Quote</span>
      </Button>

      {/* Clock In/Out */}
      <Dialog open={isClockDialogOpen} onOpenChange={setIsClockDialogOpen}>
        <DialogTrigger asChild>
          <Button
            className='h-auto flex-col gap-2 p-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-2 border-black shadow-xl'
          >
            <Clock className='h-6 w-6' />
            <span className='text-sm font-semibold'>Clock In/Out</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isClockedIn ? 'Clock Out' : 'Clock In'}</DialogTitle>
            <DialogDescription>
              {isClockedIn
                ? 'End your work session and log your hours'
                : 'Start tracking your work time'}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <p className='text-sm text-muted-foreground'>
              {isClockedIn
                ? 'Your time will be automatically calculated and saved.'
                : 'Location will be captured if available for GPS tracking.'}
            </p>
            <Button
              onClick={handleClockAction}
              disabled={isLoading}
              className='w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700'
            >
              {isLoading
                ? 'Processing...'
                : isClockedIn
                ? 'Clock Out Now'
                : 'Clock In Now'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Leads */}
      <Button
        onClick={() => router.push('/contractor/leads')}
        className='h-auto flex-col gap-2 p-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-2 border-black shadow-xl'
      >
        <TrendingUp className='h-6 w-6' />
        <span className='text-sm font-semibold'>View Leads</span>
      </Button>
    </div>
  );
}
