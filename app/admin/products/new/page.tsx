'use client';

import { useRouter } from 'next/navigation';
import { PropertyWizard } from '@/components/admin/property-wizard/property-wizard';

export default function NewPropertyPage() {
  const router = useRouter();

  const handleComplete = (propertyId: string) => {
    router.push(`/admin/products/${propertyId}`);
  };

  const handleCancel = () => {
    router.push('/admin/products');
  };

  return (
    <PropertyWizard
      onComplete={handleComplete}
      onCancel={handleCancel}
    />
  );
}
