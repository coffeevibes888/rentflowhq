import Header from '@/components/shared/header';
import Footer from '@/components/footer';
import { SessionProvider } from 'next-auth/react';
import AnalyticsProvider from '@/components/analytics-provider';
import { Suspense } from 'react';
import AudienceTabBar from '@/components/home/audience-tab-bar';
export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionProvider>
      <AnalyticsProvider />
      <div className='flex min-h-screen flex-col'>
        <Suspense fallback={null}>
          <AudienceTabBar />
        </Suspense>
        <Header />
        <main className='flex-1'>{children}</main>
        <Footer />
      </div>
    </SessionProvider>
  );
}

// bg-gradient-to-r from-teal-50 to-sky-500