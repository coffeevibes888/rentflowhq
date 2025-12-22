import { APP_NAME } from '@/lib/constants';
import Image from 'next/image';
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
      <div className='flex min-h-screen flex-col'>
        <Header />
        <div className='flex flex-1 text-slate-50'>
          {/* Sidebar */}
          <aside className='hidden md:flex flex-col w-64 border-r border-white/20 border-t-white/20 bg-transparent backdrop-blur-sm px-4 py-6 gap-6 text-slate-50'>
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
                <span className='text-sm font-semibold text-slate-50'>Resident Portal</span>
                <span className='text-sm text-slate-200'>Profile & Rentals</span>
              </div>
            </Link>

            <MainNav className='flex-1' />
          </aside>

          {/* Content */}
          <div className='flex-1 flex flex-col'>
            {/* <header className='h-9 md:h-10 border-b border-slate-200 bg-white/90 backdrop-blur flex items-center px-3 md:px-4'>
              <div className='flex items-center gap-2 text-[10px] md:text-xs text-slate-500'>
                <span className='font-semibold text-slate-900'>Resident Portal</span>
                <span className='hidden xs:inline'>/ Profile</span>
              </div>
            </div> */}

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
