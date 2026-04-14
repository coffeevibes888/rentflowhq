import { APP_NAME } from '@/lib/constants';
import Image from 'next/image';
import Link from 'next/link';
import MainNav from './main-nav';
import Header from '@/components/shared/header';
import Footer from '@/components/footer';
import SessionProviderWrapper from '@/components/session-provider-wrapper';
import TenantMobileMenu from '@/components/mobile/tenant-mobile-menu';

export default function UserLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionProviderWrapper>
      <div className='flex min-h-screen flex-col bg-slate-950'>
        <Header />
        <div className='flex flex-1 text-white'>
          {/* Mobile slide-in nav — visible on small screens only */}
          <TenantMobileMenu>
            <MainNav />
          </TenantMobileMenu>

          {/* Desktop Sidebar */}
          <aside className='hidden md:flex flex-col w-64 border-r border-indigo-500/20 bg-slate-900/80 backdrop-blur-sm px-4 py-6 gap-6'>
            <Link href='/' className='flex items-center gap-3 px-2'>
              <div className='relative h-10 w-10 rounded-lg overflow-hidden flex items-center justify-center'>
                <Image
                  src='/images/logo.svg'
                  height={40}
                  width={40}
                  alt={APP_NAME}
                  className='object-contain'
                />
              </div>
              <div className='flex flex-col'>
                <span className='text-sm font-semibold text-white'>Resident Portal</span>
                <span className='text-xs text-indigo-300'>Profile & Rentals</span>
              </div>
            </Link>

            <MainNav className='flex-1' />
          </aside>

          {/* Content — extra left padding on mobile to clear hamburger button */}
          <div className='flex-1 flex flex-col bg-slate-950'>
            <main className='flex-1 overflow-y-auto px-3 sm:px-4 md:px-8 py-4 sm:py-6 md:pl-8 pl-14'>
              <div className='mx-auto max-w-6xl'>{children}</div>
            </main>
          </div>
        </div>
        <Footer />
      </div>
    </SessionProviderWrapper>
  );
}
