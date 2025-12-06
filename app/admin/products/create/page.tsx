import { Metadata } from 'next';
import ProductForm from '@/components/admin/product-form';
import { requireAdmin } from '@/lib/auth-guard';
export const metadata: Metadata = {
  title: 'Add Property',
};

const CreateProductPage = async () => {
  await requireAdmin();
  return (
    <>
      <h2 className='h2-bold'>Add Property</h2>
      <div className='my-8'>
        <ProductForm type='Create' />
      </div>
    </>
  );
};

export default CreateProductPage;
