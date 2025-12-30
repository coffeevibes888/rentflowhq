import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Pagination from '@/components/shared/pagination';
import { requireAdmin } from '@/lib/auth-guard';
import { prisma } from '@/db/prisma';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';
import { PropertiesMobileList, PropertiesDesktopTable } from '@/components/admin/properties-list';

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
          select: { 
            id: true, 
            name: true,
            rentAmount: true, 
            images: true, 
            isAvailable: true,
            leases: {
              where: { status: 'active' },
              select: {
                id: true,
                tenant: {
                  select: { name: true }
                }
              },
              take: 1
            }
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.property.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Transform properties for client components
  const transformedProperties = properties.map((property) => {
    const firstImage = property.units.find(u => u.images?.length > 0)?.images?.[0] || null;
    const availableUnits = property.units.filter(u => u.isAvailable);
    const lowestRent = availableUnits.length > 0
      ? Math.min(...availableUnits.map(u => Number(u.rentAmount)))
      : property.units.length > 0
      ? Math.min(...property.units.map(u => Number(u.rentAmount)))
      : 0;
    
    return {
      id: property.id,
      name: property.name,
      type: property.type,
      firstImage,
      lowestRent,
      availableUnitsCount: availableUnits.length,
      units: property.units.map(u => ({
        id: u.id,
        name: u.name,
        rentAmount: Number(u.rentAmount),
        isAvailable: u.isAvailable,
        hasActiveLease: u.leases && u.leases.length > 0,
        tenantName: u.leases?.[0]?.tenant?.name,
        leaseId: u.leases?.[0]?.id,
      })),
    };
  });

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
            <Button asChild variant='default' className='w-full sm:w-auto' data-tour="add-property">
              <Link href='/admin/products/create'>Add Property</Link>
            </Button>
          </div>
        </div>

        <PropertiesMobileList properties={transformedProperties} />
        <PropertiesDesktopTable properties={transformedProperties} />

        {totalPages > 1 && (
          <Pagination page={page} totalPages={totalPages} />
        )}
      </div>
    </div>
  );
};

export default AdminProductsPage;
