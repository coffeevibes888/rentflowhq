import { APP_NAME } from '@/lib/constants';
import Image from 'next/image';
import Link from 'next/link';
import Menu from '@/components/shared/header/menu';
import React from 'react';

export default function SuperAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <div className='flex flex-col min-h-screen bg-slate-950 text-slate-50'>
        <div className='border-b border-slate-800 bg-slate-900/80 backdrop-blur w-full'>
          <div className='flex items-center h-16 px-4 max-w-6xl mx-auto w-full'>
            <Link href='/' className='w-22 flex items-center space-x-2'>
              <Image
                src='/images/logo.svg'
                height={40}
                width={40}
                alt={APP_NAME}
              />
              <span className='text-sm font-semibold tracking-wide uppercase text-slate-100'>
                Super Admin
              </span>
            </Link>
            <div className='ml-auto items-center flex space-x-4'>
              <Menu />
            </div>
          </div>
        </div>

        <div className='flex-1 space-y-4 px-4 py-6 w-full max-w-6xl mx-auto'>
          {children}
        </div>
      </div>
    </>
  );
}
