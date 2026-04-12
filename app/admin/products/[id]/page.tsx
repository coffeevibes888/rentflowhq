import ProductForm from '@/components/admin/product-form';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth-guard';
import { prisma } from '@/db/prisma';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';
import type { Product } from '@/types';
import PropertyLeaseAssignment from '@/components/admin/property-lease-assignment';

export const metadata: Metadata = {
  title: 'Update Property',
};

const AdminProductUpdatePage = async (props: {
  params: Promise<{
    id: string;
  }>;
}) => {
  await requireAdmin();

  const { id } = await props.params;

  const landlordResult = await getOrCreateCurrentLandlord();
  if (!landlordResult.success || !landlordResult.landlord) return notFound();

  // First try to find as a property (new system)
  const property = await prisma.property.findFirst({
    where: { 
      id, 
      landlordId: landlordResult.landlord.id 
    },
    include: {
      units: {
        orderBy: { createdAt: 'asc' },
      },
      defaultLeaseDocument: {
        select: {
          id: true,
          name: true,
          isFieldsConfigured: true,
        },
      },
    },
  });

  if (property) {
    // Convert property to product format for the form
    const unit = property.units[0];
    // Get images from any unit that has them
    const allImages = property.units.flatMap(u => u.images || []);
    const uniqueImages = [...new Set(allImages)];
    const address = property.address as { street?: string; city?: string; state?: string; zipCode?: string } | null;
    
    const productForForm: Product = {
      id: property.id,
      name: property.name,
      slug: property.slug,
      category: property.type || 'Apartment',
      subCategory: undefined,
      brand: property.name,
      description: property.description || '',
      streetAddress: address ? `${address.street || ''}, ${address.city || ''}, ${address.state || ''} ${address.zipCode || ''}`.trim() : undefined,
      unitNumber: unit?.name || undefined,
      stock: property.units.length,
      images: uniqueImages,
      imageColors: [],
      bedrooms: unit?.bedrooms || undefined,
      bathrooms: unit?.bathrooms ? Number(unit.bathrooms) : undefined,
      sizeSqFt: unit?.sizeSqFt || undefined,
      price: unit?.rentAmount ? Number(unit.rentAmount) : 0,
      rating: 0,
      numReviews: 0,
      isFeatured: false,
      banner: null,
      createdAt: property.createdAt,
      onSale: false,
      salePercent: undefined,
      saleUntil: null,
      cleaningFee: undefined,
      petDepositAnnual: undefined,
    };

    return (
      <div className='space-y-8 max-w-5xl mx-auto'>
        <h1 className='h2-bold'>Update Property</h1>
        
        {/* Lease Assignment Section */}
        <PropertyLeaseAssignment 
          propertyId={property.id}
          propertyName={property.name}
          currentLease={property.defaultLeaseDocument}
        />
        
        <ProductForm type='Update' product={productForForm} productId={property.id} />
      </div>
    );
  }

  // Fallback: try to find as a product (legacy system)
  const product = await prisma.product.findFirst({
    where: { id },
  });

  if (!product) return notFound();

  const productForForm: Product = {
    ...product,
    streetAddress: product.streetAddress ?? undefined,
    unitNumber: product.unitNumber ?? undefined,
    subCategory: product.subCategory ?? undefined,
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
    price: Number(product.price),
    rating: Number(product.rating),
  };

  return (
    <div className='space-y-8 max-w-5xl mx-auto'>
      <h1 className='h2-bold'>Update Product</h1>
      <ProductForm type='Update' product={productForForm} productId={product.id} />
    </div>
  );
};

export default AdminProductUpdatePage;
