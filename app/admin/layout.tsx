import { APP_NAME } from '@/lib/constants';
import Image from 'next/image';
import Link from 'next/link';
import MainNav from './main-nav';
import Header from '@/components/shared/header';
import Footer from '@/components/footer';
import MobileMenu from '@/components/mobile/mobile-menu';
import SessionProviderWrapper from '@/components/session-provider-wrapper';

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionProviderWrapper>
      <div className='flex min-h-screen flex-col bg-gradient-to-br from-slate-950 via-violet-800/60 to-slate-900'>
        <Header />
        <div className='flex flex-1 text-slate-50'>
          {/* Sidebar - Mobile Responsive */}
          <aside className='hidden md:flex flex-col w-64 border-r border-white/10 glass-effect-dark px-4 py-6 gap-6 tablet-inspection-mode'>
            <Link
              href='/'
              className='flex items-center gap-3 px-2 hover:bg-white/5 rounded-lg p-2 transition-colors'
            >
              <div className='relative h-10 w-10 rounded-lg overflow-hidden flex items-center justify-center bg-white/10'>
                <Image
                  src='/images/logo.svg'
                  height={40}
                  width={40}
                  alt={APP_NAME}
                  className='object-contain filter brightness-0 invert'
                />
              </div>
              <div className='flex flex-col'>
                <span className='text-sm text-slate-300'>Properties, tenants & rent</span>
              </div>
            </Link>

            <MainNav className='flex-1' />

            {/* Mobile/Tablet Quick Actions */}
            <div className='tablet-hidden space-y-2 pt-4 border-t border-white/10'>
              <Link
                href='/admin/inspection-mode'
                className='btn-modern text-white px-3 py-2 rounded-lg text-sm font-medium tablet-touch-target'
              >
                📱 Inspection Mode
              </Link>
              <Link
                href='/admin/cash-collection'
                className='btn-modern text-white px-3 py-2 rounded-lg text-sm font-medium tablet-touch-target'
              >
                💰 Cash Collection
              </Link>
            </div>
          </aside>

          {/* Content - Mobile Responsive */}
          <div className='flex-1 flex flex-col'>
            <header className='h-12 md:h-14 border-b border-white/10 glass-effect-dark flex items-center justify-between px-3 md:px-4'>
              <div className='flex items-center gap-2 text-sm md:text-sm text-slate-300'>
                <span className='font-semibold text-white'>Landlord Dashboard</span>
                <span className='hidden sm:inline text-slate-400'>/ Overview</span>
              </div>
            </header>

            <main className='flex-1 overflow-y-auto px-3 md:px-6 lg:px-8 py-4 md:py-6'>
              <div className='mx-auto max-w-7xl w-full'>
                <div className='rounded-xl p-4 md:p-6'>{children}</div>
              </div>
            </main>
          </div>
        </div>
        <Footer />
      </div>
    </SessionProviderWrapper>
  );
}
