import Link from 'next/link';
import Image from 'next/image';
import { getAllProducts, deleteProduct } from '@/lib/actions/product.actions';
import ProductPromoDialog from '@/components/admin/product-promo-dialog';
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
import DeleteDialog from '@/components/shared/delete-dialog';
import { requireAdmin } from '@/lib/auth-guard';

interface Product {
  id: string;
  name: string;
  price: number | string;
  category: string;
  stock: number;
  images: string[];
}

const AdminProductsPage = async (props: {
  searchParams: Promise<{
    page: string;
    query: string;
    category: string;
  }>;
}) => {
  await requireAdmin();

  const searchParams = await props.searchParams;

  const page = Number(searchParams.page) || 1;
  const searchText = searchParams.query || '';
  const category = searchParams.category || '';

  const products = await getAllProducts({
    query: searchText,
    page,
    category,
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
            <Button asChild variant='default' className='w-full sm:w-auto'>
              <Link href='/admin/products/create'>Add Property</Link>
            </Button>
          </div>
        </div>

        <div className='overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0'>
          <Table>
        <TableHeader>
          <TableRow>
            <TableHead>PHOTO</TableHead>
            <TableHead>PROPERTY</TableHead>
            <TableHead className='text-right'>MONTHLY RENT</TableHead>
            <TableHead>TYPE</TableHead>
            <TableHead>AVAILABLE UNITS</TableHead>
            <TableHead>MARKETING</TableHead>
            <TableHead className='w-[100px]'>ACTIONS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.data.map((product: Product) => (
            <TableRow key={product.id}>
              <TableCell>
                {product.images && product.images.length > 0 ? (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    width={80}
                    height={80}
                    className='rounded-lg object-cover'
                  />
                ) : (
                  <div className='w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 text-sm'>
                    No Image
                  </div>
                )}
              </TableCell>
              <TableCell>{product.name}</TableCell>
              <TableCell className='text-right'>
                {formatCurrency(product.price)}
              </TableCell>
              <TableCell>{product.category}</TableCell>
              <TableCell>{product.stock}</TableCell>
              <TableCell>
                <ProductPromoDialog productId={product.id} />
              </TableCell>
              <TableCell className='flex gap-1'>
                <Button asChild variant='outline' size='sm'>
                  <Link href={`/admin/products/${product.id}`}>Edit</Link>
                </Button>
                <DeleteDialog id={product.id} action={deleteProduct} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
        </div>
        {products.totalPages > 1 && (
          <Pagination page={page} totalPages={products.totalPages} />
        )}
      </div>
    </div>
  );
};

export default AdminProductsPage;
