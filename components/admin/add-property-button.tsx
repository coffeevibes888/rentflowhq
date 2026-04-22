'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PropertyWizard } from '@/components/admin/property-wizard/property-wizard';

export default function AddPropertyButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleComplete = (propertyId: string) => {
    setOpen(false);
    router.push(`/admin/products/${propertyId}/details`);
    router.refresh();
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <>
      <Button
        type='button'
        onClick={() => {
          console.log('[AddPropertyButton] clicked, opening wizard');
          setOpen(true);
        }}
        className='w-full sm:w-auto bg-violet-600 hover:bg-violet-500 text-white font-semibold'
        data-tour='add-property'
      >
        <span className='text-base sm:text-sm'>+ Add Property</span>
      </Button>

      {open && (
        <div className='fixed inset-0 z-[100] overflow-y-auto bg-black/50 backdrop-blur-sm'>
          <PropertyWizard onComplete={handleComplete} onCancel={handleCancel} />
        </div>
      )}
    </>
  );
}
