import Link from 'next/link';
import Image from 'next/image';
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
import Pagination from '@/components/shared/pagination';
import { requireAdmin } from '@/lib/auth-guard';
import { prisma } from '@/db/prisma';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';
import PropertyActions from '@/components/admin/property-actions';
import ScheduleHoursButton from '@/components/admin/schedule-hours-button';


const PAGE_SIZE = 10;

const AdminProductsPage = async (props: {
  searchParams: Promise<{
    page: string;
    query: string;
  }>;
}) => {
  await requireAdmin();

  const landlordResult = await getOrCreateCurrentLandlord();
  if (!landlordResult.success) {
    throw new Error(landlordResult.message || 'Unable to determine landlord');
  }
  const landlordId = landlordResult.landlord.id;

  const searchParams = await props.searchParams;
  const page = Number(searchParams.page) || 1;
  const searchText = searchParams.query || '';

  const where = {
    landlordId,
    ...(searchText && searchText !== 'all'
      ? { name: { contains: searchText, mode: 'insensitive' as const } }
      : {}),
  };

  const [properties, totalCount] = await Promise.all([
    prisma.property.findMany({
      where,
      include: {
        units: {
          select: { id: true, rentAmount: true, images: true, isAvailable: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.property.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className='w-full px-4 py-8 md:px-0 space-y-4'>
      <div className='max-w-6xl mx-auto space-y-4'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
          <div className='flex flex-col sm:flex-row sm:items-center gap-3'>
            <h1 className='text-2xl md:text-3xl font-semibold text-slate-50'>Properties</h1>
            {searchText && (
              <div className='text-sm text-slate-300/80'>
                Filtered by <i>&quot;{searchText}&quot;</i>{' '}
                <Link href='/admin/products'>
                  <Button variant='outline' size='sm' className='border-white/10 text-slate-200/90 hover:bg-slate-900/80'>
                    Remove Filter
                  </Button>
                </Link>
              </div>
            )}
          </div>
          <div className='flex gap-2'>
            <Button asChild variant='default' className='w-full sm:w-auto'>
              <Link href='/admin/products/create'>Add Property</Link>
            </Button>
          </div>
        </div>

        {/* Mobile Card Layout */}
        <div className='md:hidden space-y-4'>
          {properties.length === 0 ? (
            <div className='text-center text-slate-400 py-8'>
              No properties found. Add your first property to get started.
            </div>
          ) : (
            properties.map((property) => {
              // Get first image from any unit (not just available ones)
              const firstImage = property.units.find(u => u.images?.length > 0)?.images?.[0];
              const availableUnits = property.units.filter(u => u.isAvailable);
              const lowestRent = availableUnits.length > 0
                ? Math.min(...availableUnits.map(u => Number(u.rentAmount)))
                : property.units.length > 0
                ? Math.min(...property.units.map(u => Number(u.rentAmount)))
                : 0;
              return (
                <div key={property.id} className='rounded-xl border border-white/10 bg-slate-900/60 p-4 hover:border-violet-400/60 hover:bg-slate-900/90 transition-colors'>
                  <Link href={`/admin/products/${property.id}/details`} className='block'>
                    <div className='flex gap-4'>
                      <div className='flex-shrink-0'>
                        {firstImage ? (
                          <Image
                            src={firstImage}
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
                              {lowestRent > 0 ? formatCurrency(lowestRent) : '—'}
                            </span>
                          </div>
                          <div className='flex items-center justify-between'>
                            <span className='text-sm text-slate-300/90'>Type:</span>
                            <span className='text-sm text-slate-200'>{property.type}</span>
                          </div>
                          <div className='flex items-center justify-between'>
                            <span className='text-sm text-slate-300/90'>Available Units:</span>
                            <span className='text-sm text-slate-200'>{availableUnits.length}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                  <div className='flex flex-col gap-2 mt-4'>
                    <ScheduleHoursButton propertyId={property.id} />
                    <div className='flex gap-2'>
                      <Button asChild variant='outline' size='sm' className='flex-1'>
                        <Link href={`/admin/products/${property.id}`}>Edit</Link>
                      </Button>
                      <PropertyActions propertyId={property.id} />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table Layout */}
        <div className='hidden md:block overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PHOTO</TableHead>
                <TableHead>PROPERTY</TableHead>
                <TableHead className='text-right'>MONTHLY RENT</TableHead>
                <TableHead>TYPE</TableHead>
                <TableHead>AVAILABLE UNITS</TableHead>
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
              {properties.map((property) => {
                // Get first image from any unit (not just available ones)
                const firstImage = property.units.find(u => u.images?.length > 0)?.images?.[0];
                const availableUnits = property.units.filter(u => u.isAvailable);
                const lowestRent = availableUnits.length > 0
                  ? Math.min(...availableUnits.map(u => Number(u.rentAmount)))
                  : property.units.length > 0
                  ? Math.min(...property.units.map(u => Number(u.rentAmount)))
                  : 0;
                return (
                  <TableRow key={property.id} className='group'>
                    <TableCell>
                      <Link href={`/admin/products/${property.id}/details`} className='block'>
                        {firstImage ? (
                          <Image
                            src={firstImage}
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
                      </Link>
                    </TableCell>
                    <TableCell className='text-slate-200'>
                      <Link
                        href={`/admin/products/${property.id}/details`}
                        className='hover:underline hover:text-violet-400 transition-colors'
                      >
                        {property.name}
                      </Link>
                    </TableCell>
                    <TableCell className='text-right text-slate-200'>
                      <Link href={`/admin/products/${property.id}/details`} className='block hover:text-violet-400 transition-colors'>
                        {lowestRent > 0 ? formatCurrency(lowestRent) : '—'}
                      </Link>
                    </TableCell>
                    <TableCell className='text-slate-300'>
                      <Link href={`/admin/products/${property.id}/details`} className='block hover:text-violet-400 transition-colors'>
                        {property.type}
                      </Link>
                    </TableCell>
                    <TableCell className='text-slate-300'>
                      <Link href={`/admin/products/${property.id}/details`} className='block hover:text-violet-400 transition-colors'>
                        {availableUnits.length}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className='flex flex-col gap-2'>
                        <ScheduleHoursButton propertyId={property.id} />
                        <div className='flex gap-1'>
                          <Button asChild variant='outline' size='sm' className='flex-1'>
                            <Link href={`/admin/products/${property.id}`}>Edit</Link>
                          </Button>
                          <PropertyActions propertyId={property.id} />
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {totalPages > 1 && (
          <Pagination page={page} totalPages={totalPages} />
        )}
      </div>
    </div>
  );
};

export default AdminProductsPage;
