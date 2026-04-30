import Link from 'next/link';

export default function AddPropertyButton() {
  return (
    <Link
      href='/admin/products/new'
      data-tour='add-property'
      className='w-full sm:w-auto bg-violet-600 hover:bg-violet-500 text-white font-semibold px-4 py-2 rounded-md cursor-pointer inline-flex items-center justify-center select-none'
    >
      <span className='text-base sm:text-sm'>+ Add Property</span>
    </Link>
  );
}
