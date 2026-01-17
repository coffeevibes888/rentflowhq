'use client';

import { APP_NAME } from '@/lib/constants';
import Image from 'next/image';
import Link from 'next/link';
import Menu from '@/components/shared/header/menu';
import SessionProviderWrapper from '@/components/session-provider-wrapper';
import React, { useState } from 'react';

export default function SuperAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/super-admin', label: 'Dashboard', color: 'text-white/80 hover:text-white' },
    { href: '/super-admin/resume-builder', label: '📄 Resume Builder', color: 'text-green-300 hover:text-green-200' },
    { href: '/super-admin/affiliates', label: '💰 Affiliates', color: 'text-emerald-300 hover:text-emerald-200' },
    { href: '/super-admin/audit-logs', label: '🔒 Audit Logs', color: 'text-violet-300 hover:text-violet-200' },
    { href: '/super-admin/newsletter', label: '📧 Newsletter', color: 'text-cyan-300 hover:text-cyan-200' },
    { href: '/super-admin/referrals', label: '🎁 Referrals', color: 'text-pink-300 hover:text-pink-200' },
    { href: '/super-admin/security', label: '🛡️ Security', color: 'text-red-300 hover:text-red-200' },
    { href: '/super-admin/testing', label: '🧪 Testing', color: 'text-amber-300 hover:text-amber-200' },
    { href: '/super-admin/analytics', label: '📊 Analytics', color: 'text-blue-300 hover:text-blue-200' },
  ];

  return (
    <SessionProviderWrapper>
      <div className='flex flex-col min-h-screen bg-blue-700 text-slate-50'>
        <div className='border-b border-white/10 bg-blue-800/80 backdrop-blur w-full'>
          <div className='flex items-center h-16 px-4 max-w-7xl mx-auto w-full'>
            <Link href='/' className='flex items-center space-x-2 flex-shrink-0'>
              <Image
                src='/images/logo.svg'
                height={40}
                width={40}
                alt={APP_NAME}
              />
              <span className='text-sm font-semibold tracking-wide uppercase text-white hidden sm:inline'>
                Super Admin
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className='hidden lg:flex ml-8 items-center space-x-4 overflow-x-auto'>
              {navLinks.map((link) => (
                <Link 
                  key={link.href}
                  href={link.href} 
                  className={`text-sm ${link.color} transition-colors font-medium whitespace-nowrap`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className='lg:hidden ml-4 p-2 text-white hover:bg-white/10 rounded-md transition-colors'
              aria-label='Toggle menu'
            >
              <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                {mobileMenuOpen ? (
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                ) : (
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6h16M4 12h16M4 18h16' />
                )}
              </svg>
            </button>

            <div className='ml-auto items-center flex space-x-4'>
              <Menu />
            </div>
          </div>

          {/* Mobile Navigation Dropdown */}
          {mobileMenuOpen && (
            <div className='lg:hidden border-t border-white/10 bg-blue-800/95 backdrop-blur'>
              <nav className='flex flex-col py-2 px-4 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto'>
                {navLinks.map((link) => (
                  <Link 
                    key={link.href}
                    href={link.href} 
                    onClick={() => setMobileMenuOpen(false)}
                    className={`text-sm ${link.color} transition-colors font-medium py-2 px-3 rounded-md hover:bg-white/5`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          )}
        </div>

        <div className='flex-1'>
          {children}
        </div>
      </div>
    </SessionProviderWrapper>
  );
}
