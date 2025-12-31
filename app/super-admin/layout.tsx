import { APP_NAME } from '@/lib/constants';
import Image from 'next/image';
import Link from 'next/link';
import Menu from '@/components/shared/header/menu';
import SessionProviderWrapper from '@/components/session-provider-wrapper';
import React from 'react';

export default function SuperAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionProviderWrapper>
      <div className='flex flex-col min-h-screen bg-blue-700 text-slate-50'>
        <div className='border-b border-white/10 bg-blue-800/80 backdrop-blur w-full'>
          <div className='flex items-center h-16 px-4 max-w-7xl mx-auto w-full'>
            <Link href='/' className='w-22 flex items-center space-x-2'>
              <Image
                src='/images/logo.svg'
                height={40}
                width={40}
                alt={APP_NAME}
              />
              <span className='text-sm font-semibold tracking-wide uppercase text-white'>
                Super Admin
              </span>
            </Link>
            <nav className='ml-8 flex items-center space-x-4'>
              <Link 
                href='/super-admin' 
                className='text-sm text-white/80 hover:text-white transition-colors'
              >
                Dashboard
              </Link>
              <Link 
                href='/super-admin/affiliates' 
                className='text-sm text-emerald-300 hover:text-emerald-200 transition-colors font-medium'
              >
                💰 Affiliates
              </Link>
              <Link 
                href='/super-admin/testing' 
                className='text-sm text-amber-300 hover:text-amber-200 transition-colors font-medium'
              >
                🧪 Testing
              </Link>
            </nav>
            <div className='ml-auto items-center flex space-x-4'>
              <Menu />
            </div>
          </div>
        </div>

        <div className='flex-1'>
          {children}
        </div>
      </div>
    </SessionProviderWrapper>
  );
}
