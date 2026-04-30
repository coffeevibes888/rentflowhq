'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PropertyWizard } from '@/components/admin/property-wizard/property-wizard';

export default function AddPropertyButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleComplete = (_propertyId: string) => {
    setOpen(false);
    router.refresh();
  };

  const handleCancel = () => {
    setOpen(false);
  };

  const handleClick = () => {
    setOpen(true);
  };

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleClick();
          }
        }}
        className='w-full sm:w-auto bg-violet-600 hover:bg-violet-500 text-white font-semibold px-4 py-2 rounded-md cursor-pointer inline-flex items-center justify-center select-none'
        data-tour='add-property'
      >
        <span className='text-base sm:text-sm'>+ Add Property</span>
      </div>

      {open && (
        <div className='fixed inset-0 z-[100] overflow-y-auto bg-black/50 backdrop-blur-sm'>
          <PropertyWizard onComplete={handleComplete} onCancel={handleCancel} />
        </div>
      )}
    </>
  );
}
