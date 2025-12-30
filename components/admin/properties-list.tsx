'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import PropertyActions from '@/components/admin/property-actions';
import ScheduleHoursButton from '@/components/admin/schedule-hours-button';
import { PropertyUnitsList } from '@/components/admin/property-units-list';

interface PropertyUnit {
  id: string;
  name: string;
  rentAmount: number;
  isAvailable: boolean;
  hasActiveLease?: boolean;
  tenantName?: string;
  leaseId?: string;
}

interface Property {
  id: string;
  name: string;
  type: string;
  firstImage: string | null;
  lowestRent: number;
  availableUnitsCount: number;
  units: PropertyUnit[];
}

interface PropertiesListProps {
  properties: Property[];
}

export function PropertiesMobileList({ properties }: PropertiesListProps) {
  const router = useRouter();

  const handleCardClick = (propertyId: string) => {
    router.push(`/admin/products/${propertyId}/details`);
  };

  return (
    <div className='md:hidden space-y-4'>
      {properties.length === 0 ? (
        <div className='text-center text-slate-400 py-8'>
          No properties found. Add your first property to get started.
        </div>
      ) : (
        properties.map((property) => (
          <div 
            key={property.id} 
            onClick={() => handleCardClick(property.id)}
            className='block rounded-xl border border-white/10 bg-slate-900/60 p-4 hover:border-violet-400/60 hover:bg-slate-900/90 transition-colors cursor-pointer'
          >
            <div className='flex gap-4'>
              <div className='flex-shrink-0'>
                {property.firstImage ? (
                  <Image
                    src={property.firstImage}
                    alt={property.name}
                    width={80}
                    height={80}
                    className='rounded-lg object-cover'
                  />
                ) : (
                  <div className='w-20 h-20 bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 text-sm'>
                    No Image
                  </div>
                )}
              </div>
              <div className='flex-1 min-w-0'>
                <h3 className='text-lg font-semibold text-slate-50 truncate'>{property.name}</h3>
                <div className='space-y-1 mt-2'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-slate-300/90'>Monthly Rent:</span>
                    <span className='text-sm font-medium text-slate-200'>
                      {property.lowestRent > 0 ? formatCurrency(property.lowestRent) : '—'}
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-slate-300/90'>Type:</span>
                    <span className='text-sm text-slate-200'>{property.type}</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-slate-300/90'>Available Units:</span>
                    <span className='text-sm text-slate-200'>{property.availableUnitsCount}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className='flex flex-col gap-2 mt-4' onClick={(e) => e.stopPropagation()}>
              <ScheduleHoursButton propertyId={property.id} />
              <div className='flex gap-2'>
                <Button 
                  variant='outline' 
                  size='sm' 
                  className='flex-1'
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/admin/products/${property.id}`);
                  }}
                >
                  Edit
                </Button>
                <PropertyActions propertyId={property.id} />
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export function PropertiesDesktopTable({ properties }: PropertiesListProps) {
  const router = useRouter();

  const handleRowClick = (propertyId: string) => {
    router.push(`/admin/products/${propertyId}/details`);
  };

  return (
    <div className='hidden md:block overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>PHOTO</TableHead>
            <TableHead>PROPERTY</TableHead>
            <TableHead className='text-right'>MONTHLY RENT</TableHead>
            <TableHead>TYPE</TableHead>
            <TableHead>UNIT AVAILABILITY</TableHead>
            <TableHead className='w-[100px]'>ACTIONS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {properties.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className='text-center text-slate-400 py-8'>
                No properties found. Add your first property to get started.
              </TableCell>
            </TableRow>
          )}
          {properties.map((property) => (
            <TableRow 
              key={property.id} 
              className='group cursor-pointer hover:bg-slate-800/60'
              onClick={() => handleRowClick(property.id)}
            >
              <TableCell>
                {property.firstImage ? (
                  <Image
                    src={property.firstImage}
                    alt={property.name}
                    width={80}
                    height={80}
                    className='rounded-lg object-cover group-hover:ring-2 group-hover:ring-violet-400 transition-all'
                  />
                ) : (
                  <div className='w-20 h-20 bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 text-sm group-hover:ring-2 group-hover:ring-violet-400 transition-all'>
                    No Image
                  </div>
                )}
              </TableCell>
              <TableCell className='text-slate-200'>
                {property.name}
              </TableCell>
              <TableCell className='text-right text-slate-200'>
                {property.lowestRent > 0 ? formatCurrency(property.lowestRent) : '—'}
              </TableCell>
              <TableCell className='text-slate-300'>
                {property.type}
              </TableCell>
              <TableCell className='text-slate-300' onClick={(e) => e.stopPropagation()}>
                <PropertyUnitsList
                  propertyId={property.id}
                  units={property.units}
                />
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <div className='flex flex-col gap-2'>
                  <ScheduleHoursButton propertyId={property.id} />
                  <div className='flex gap-1'>
                    <Button 
                      variant='outline' 
                      size='sm' 
                      className='flex-1'
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/admin/products/${property.id}`);
                      }}
                    >
                      Edit
                    </Button>
                    <PropertyActions propertyId={property.id} />
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
