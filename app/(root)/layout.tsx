import Header from '@/components/shared/header';
import Footer from '@/components/footer';
import { SessionProvider } from 'next-auth/react';
export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionProvider>
      <div className='flex h-screen flex-col bg-gradient-to-br from-slate-950 via-violet-800/60 to-slate-900'>
        <Header />
        <main className='flex-1 wrapper'>{children}</main>
        <Footer />
      </div>
    </SessionProvider>
  );
}
