'use client';

import DeleteDialog from '@/components/shared/delete-dialog';
import { deletePropertyById } from '@/lib/actions/property.actions';

export function PropertyActions({ propertyId }: { propertyId: string }) {
  return <DeleteDialog id={propertyId} action={deletePropertyById} />;
}

export default PropertyActions;
