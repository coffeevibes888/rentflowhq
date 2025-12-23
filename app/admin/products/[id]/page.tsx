import ProductForm from '@/components/admin/product-form';
import { getProductById } from '@/lib/actions/product.actions';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth-guard';
import type { Product } from '@/types';

export const metadata: Metadata = {
  title: 'Update Product',
};

const AdminProductUpdatePage = async (props: {
  params: Promise<{
    id: string;
  }>;
}) => {
  await requireAdmin();

  const { id } = await props.params;

  console.log('Fetching product with ID:', id);
  
  const product = await getProductById(id);

  console.log('Product found:', product ? 'yes' : 'no');

  if (!product) return notFound();

  const productForForm: Product = {
    ...product,
    // Normalize Prisma-specific / nullable fields to match Product type
    streetAddress: product.streetAddress ?? undefined,
    unitNumber: product.unitNumber ?? undefined,
    bedrooms: product.bedrooms ?? undefined,
    bathrooms:
      product.bathrooms !== null && product.bathrooms !== undefined
        ? Number(product.bathrooms as unknown as number | string)
        : undefined,
    sizeSqFt: product.sizeSqFt ?? undefined,
    salePercent:
      product.salePercent !== null && product.salePercent !== undefined
        ? Number(product.salePercent as unknown as number | string)
        : undefined,
    saleUntil: product.saleUntil ? product.saleUntil.toISOString() : null,
  };

  return (
    <div className='space-y-8 max-w-5xl mx-auto'>
      <h1 className='h2-bold'>Update Product</h1>

      <ProductForm type='Update' product={productForForm} productId={product.id} />
    </div>
  );
};

export default AdminProductUpdatePage;
