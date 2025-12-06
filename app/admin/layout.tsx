import { APP_NAME } from '@/lib/constants';
import Image from 'next/image';
import Link from 'next/link';
import MainNav from './main-nav';
import Header from '@/components/shared/header';
import Footer from '@/components/footer';

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className='flex min-h-screen flex-col'>
      <Header />
      <div className='flex flex-1 text-black'>
        {/* Sidebar */}
        <aside className='hidden md:flex flex-col w-64 border-r border-slate-200 bg-white/90 backdrop-blur-sm px-4 py-6 gap-6'>
          <Link href='/' className='flex items-center gap-3 px-2'>
            <div className='relative h-10 w-10 rounded-lg overflow-hidden bg-slate-900 flex items-center justify-center'>
              <Image
                src='/images/logo.svg'
                height={40}
                width={40}
                alt={APP_NAME}
                className='object-contain'
              />
            </div>
            <div className='flex flex-col'>
              <span className='text-sm font-semibold text-slate-900'>Property Admin</span>
              <span className='text-xs text-slate-500'>Apartments & Tenants</span>
            </div>
          </Link>

          <MainNav className='flex-1' />
        </aside>

        {/* Content */}
        <div className='flex-1 flex flex-col'>
          <header className='h-9 md:h-10 border-b border-slate-200 bg-white/90 backdrop-blur flex items-center px-3 md:px-4'>
            <div className='flex items-center gap-2 text-[10px] md:text-xs text-slate-500'>
              <span className='font-semibold text-slate-900'>Property Admin</span>
              <span className='hidden xs:inline'>/ Dashboard</span>
            </div>
          </header>

          <main className='flex-1 overflow-y-auto px-4 md:px-8 py-6'>
            <div className='mx-auto max-w-6xl'>{children}</div>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
