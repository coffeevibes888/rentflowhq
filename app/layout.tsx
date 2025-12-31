import type { Metadata } from 'next';
import '@/assets/styles/globals.css';
import { APP_DESCRIPTION, APP_NAME, SERVER_URL } from '@/lib/constants';
import { Toaster } from '@/components/ui/toaster';
import PageViewTracker from '@/components/analytics/page-view-tracker';
import SessionProviderWrapper from '@/components/session-provider-wrapper';
import { ThemeProvider } from 'next-themes';
import { TeamChatWidgetWrapper } from '@/components/team/team-chat-widget-wrapper';
import PrivacyConsentBanner from '@/components/privacy/privacy-consent-banner';
import { Suspense } from 'react';
import AffiliateTracker from '@/components/affiliate-tracker';

let resolvedMetadataBase: URL;
try {
  resolvedMetadataBase = new URL(SERVER_URL);
} catch {
  resolvedMetadataBase = new URL('https://www.propertyflowhq.com');
}

export const metadata: Metadata = {
  title: {
    template: `%s | Property Flow HQ`,
    default: APP_NAME,
  },
  description: APP_DESCRIPTION,
  metadataBase: resolvedMetadataBase,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className='bg-gradient-to-r from-blue-400 via-cyan-400 to-sky-600 text-black font-semibold flex flex-col min-h-screen overflow-x-hidden'>
        <SessionProviderWrapper>
          <ThemeProvider attribute='class' defaultTheme='light' enableSystem={false} disableTransitionOnChange>
            <PageViewTracker />
            <Suspense fallback={null}>
              <AffiliateTracker />
            </Suspense>
            <div
              className='w-full text-sm md:text-sm font-medium tracking-tight flex items-center overflow-hidden bg-linear-to-r from-slate-950 via-slate-900 to-emerald-500 shadow-sm' style={{ height: '24px' }}>
              <div className='banner-marquee flex items-center gap-6 px-4 text-white whitespace-nowrap'>
                <span>Modern apartments, offices, and homes professionally managed.</span>
                <span className='text-white/70'>|</span>
                <span>24/7 online rent payments and maintenance requests.</span>
                <span className='text-white/70'>|</span>
                <span>Secure payments powered by Stripe.</span>
                <span className='text-white/70'>|</span>
                <span>Speak with our management team anytime.</span>
                <span className='ml-10'>Now accepting new tenant applications.</span>
                <span className='text-white/70'>|</span>
                <span>Schedule a tour or apply online in minutes.</span>
                <span className='text-white/70'>|</span>
                <span>Professional property management you can trust.</span>
                <span className='text-white/70'>|</span>
                <span>Residents: log in to submit a work ticket.</span>
              </div>
            </div>
            {children}
            <Toaster />
            <TeamChatWidgetWrapper />
            <PrivacyConsentBanner />
          </ThemeProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
