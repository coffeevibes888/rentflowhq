'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Loader2 } from 'lucide-react';
import { startInspection } from '@/lib/actions/inspection.actions';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';

interface StartInspectionButtonProps {
  propertyId: string;
  unitId?: string;
}

export default function StartInspectionButton({ propertyId, unitId }: StartInspectionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleStartInspection = async () => {
    setIsLoading(true);
    try {
      const result = await startInspection(propertyId, unitId);
      
      if (result.success && result.inspection) {
        toast({
          title: 'Inspection Started',
          description: 'Redirecting to inspection mode...',
        });
        router.push(`/admin/inspection-mode?inspectionId=${result.inspection.id}`);
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to start inspection',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleStartInspection}
      disabled={isLoading}
      className='bg-blue-500 hover:bg-blue-600 text-white'
    >
      {isLoading ? (
        <>
          <Loader2 className='h-4 w-4 mr-2 animate-spin' />
          Starting...
        </>
      ) : (
        <>
          <Camera className='h-4 w-4 mr-2' />
          Start Inspection
        </>
      )}
    </Button>
  );
}
