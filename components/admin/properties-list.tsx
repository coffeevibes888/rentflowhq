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
    <div className='md:hidden space-y-3'>
      {properties.length === 0 ? (
        <div className='text-center text-slate-400 py-8 text-sm'>
          No properties found. Add your first property to get started.
        </div>
      ) : (
        properties.map((property) => (
          <div 
            key={property.id} 
            onClick={() => handleCardClick(property.id)}
            className='block rounded-xl border border-white/10 bg-slate-900/60 p-3 hover:border-violet-400/60 hover:bg-slate-900/90 transition-colors cursor-pointer active:scale-[0.98]'
          >
            <div className='flex gap-3'>
              <div className='flex-shrink-0'>
                {property.firstImage ? (
                  <Image
                    src={property.firstImage}
                    alt={property.name}
                    width={72}
                    height={72}
                    className='rounded-lg object-cover w-[72px] h-[72px]'
                  />
                ) : (
                  <div className='w-[72px] h-[72px] bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 text-xs'>
                    No Image
                  </div>
                )}
              </div>
              <div className='flex-1 min-w-0'>
                <h3 className='text-base font-semibold text-slate-50 truncate'>{property.name}</h3>
                <p className='text-xs text-slate-400 mt-0.5'>{property.type}</p>
                <div className='flex items-center gap-3 mt-2'>
                  <div className='text-sm font-medium text-emerald-400'>
                    {property.lowestRent > 0 ? formatCurrency(property.lowestRent) : '—'}
                    <span className='text-xs text-slate-400 font-normal'>/mo</span>
                  </div>
                  <div className='text-xs text-slate-400'>
                    {property.availableUnitsCount} available
                  </div>
                </div>
              </div>
            </div>
            <div className='flex gap-2 mt-3 pt-3 border-t border-white/5' onClick={(e) => e.stopPropagation()}>
              <ScheduleHoursButton propertyId={property.id} />
              <Button 
                variant='outline' 
                size='sm' 
                className='flex-1 h-9 text-sm'
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
