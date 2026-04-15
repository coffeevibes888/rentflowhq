import { APP_NAME } from '@/lib/constants';
import Link from 'next/link';
import MainNav from './main-nav';
import Header from '@/components/shared/header';
import Footer from '@/components/footer';
import SessionProviderWrapper from '@/components/session-provider-wrapper';

export default function UserLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionProviderWrapper>
      <div className='flex min-h-screen flex-col bg-white'>
        <Header />
        <div className='flex flex-1'>
          {/* Desktop Sidebar */}
          <aside className='hidden md:flex flex-col w-64 border-r border-indigo-500/20 px-4 py-6 gap-6'>
            <Link href='/' className='flex items-center gap-3 px-2'>
              <div className='flex flex-col text-center'>
                <span className='text-sm font-semibold text-bold text-black '>Resident Portal</span>
                <span className='text-xs text-emerald-600 text-semibold'>Profile & Rentals</span>
              </div>
            </Link>

            <MainNav className='flex-1' />
          </aside>

          {/* Content — extra left padding on mobile to clear hamburger button */}
          <div className='flex-1 flex flex-col bg-white'>
            <main className='flex-1 overflow-y-auto px-3 sm:px-4 md:px-8 py-4 sm:py-6'>
              <div className='mx-auto max-w-6xl'>{children}</div>
            </main>
          </div>
        </div>
        <Footer />
      </div>
    </SessionProviderWrapper>
  );
}
