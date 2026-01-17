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
                href='/super-admin/resume-builder' 
                className='text-sm text-green-300 hover:text-green-200 transition-colors font-medium'
              >
                📄 Resume Builder
              </Link>
              <Link 
                href='/super-admin/affiliates' 
                className='text-sm text-emerald-300 hover:text-emerald-200 transition-colors font-medium'
              >
                💰 Affiliates
              </Link>
              <Link 
                href='/super-admin/audit-logs' 
                className='text-sm text-violet-300 hover:text-violet-200 transition-colors font-medium'
              >
                🔒 Audit Logs
              </Link>
              <Link 
                href='/super-admin/newsletter' 
                className='text-sm text-cyan-300 hover:text-cyan-200 transition-colors font-medium'
              >
                📧 Newsletter
              </Link>
              <Link 
                href='/super-admin/referrals' 
                className='text-sm text-pink-300 hover:text-pink-200 transition-colors font-medium'
              >
                🎁 Referrals
              </Link>
              <Link 
                href='/super-admin/security' 
                className='text-sm text-red-300 hover:text-red-200 transition-colors font-medium'
              >
                🛡️ Security
              </Link>
              <Link 
                href='/super-admin/testing' 
                className='text-sm text-amber-300 hover:text-amber-200 transition-colors font-medium'
              >
                🧪 Testing
              </Link>
              <Link 
                href='/super-admin/analytics' 
                className='text-sm text-blue-300 hover:text-blue-200 transition-colors font-medium'
              >
                📊 Analytics
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
