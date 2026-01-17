import SessionProviderWrapper from '@/components/session-provider-wrapper';
import React from 'react';
import SuperAdminNav from './super-admin-nav';

export default function SuperAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionProviderWrapper>
      <div className='flex flex-col min-h-screen bg-blue-700 text-slate-50'>
        <SuperAdminNav />
        <div className='flex-1'>
          {children}
        </div>
      </div>
    </SessionProviderWrapper>
  );
}
