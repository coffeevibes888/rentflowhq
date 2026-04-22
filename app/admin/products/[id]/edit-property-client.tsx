'use client';

import { useRouter } from 'next/navigation';
import { PropertyWizard } from '@/components/admin/property-wizard/property-wizard';

interface EditPropertyClientProps {
  propertyId: string;
}

export default function EditPropertyClient({ propertyId }: EditPropertyClientProps) {
  const router = useRouter();

  const handleComplete = (id: string) => {
    router.push(`/admin/products/${id}/details`);
  };

  const handleCancel = () => {
    router.push(`/admin/products/${propertyId}/details`);
  };

  return (
    <PropertyWizard
      mode="edit"
      propertyId={propertyId}
      onComplete={handleComplete}
      onCancel={handleCancel}
    />
  );
}
