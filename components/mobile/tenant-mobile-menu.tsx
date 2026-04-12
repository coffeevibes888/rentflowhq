'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TenantMobileMenuProps {
  children: React.ReactNode;
}

export default function TenantMobileMenu({ children }: TenantMobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* Hamburger button — visible only on mobile */}
      <Button
        variant='ghost'
        size='sm'
        className='md:hidden fixed top-3 left-3 z-50 h-9 w-9 p-0 bg-slate-800/80 hover:bg-slate-700 border border-white/10 text-slate-50 backdrop-blur-sm'
        onClick={toggleMenu}
        aria-label='Open navigation menu'
      >
        {isOpen ? <X className='h-4 w-4' /> : <Menu className='h-4 w-4' />}
      </Button>

      {/* Backdrop overlay */}
      {isOpen && (
        <div
          className='admin-overlay show md:hidden'
          onClick={closeMenu}
        />
      )}

      {/* Slide-in sidebar */}
      <div className={`tenant-sidebar md:hidden ${isOpen ? 'open' : ''}`}>
        <div className='p-4'>
          <div className='flex items-center justify-between mb-6 pt-1'>
            <h2 className='text-base font-semibold text-slate-50'>Resident Portal</h2>
            <Button
              variant='ghost'
              size='sm'
              className='h-8 w-8 p-0 text-slate-300 hover:text-white hover:bg-white/10'
              onClick={closeMenu}
            >
              <X className='h-4 w-4' />
            </Button>
          </div>
          {/* Close nav links on tap by wrapping in a click handler */}
          <div onClick={closeMenu}>
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
