import type { Metadata } from 'next';
import Script from 'next/script';
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
// import LiveChatWidget from '@/components/shared/live-chat-widget';

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
  keywords: [
    'property management',
    'rent collection',
    'landlord software',
    'tenant portal',
    'maintenance tracking',
    'lease management',
    'rental property',
    'property management software',
    'online rent payment',
    'landlord tools',
  ],
  authors: [{ name: 'Property Flow HQ' }],
  creator: 'Property Flow HQ',
  publisher: 'Property Flow HQ',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: resolvedMetadataBase.toString(),
    siteName: APP_NAME,
    title: APP_NAME,
    description: APP_DESCRIPTION,
    images: [
      {
        url: `${resolvedMetadataBase.toString()}images/propertyflowhqOG.png`,
        width: 1200,
        height: 630,
        alt: 'Property Flow HQ - Property Management Software',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: APP_NAME,
    description: APP_DESCRIPTION,
    images: [`${resolvedMetadataBase.toString()}images/propertyflowhqOG.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your verification codes here when you have them
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-98GMCN3RXZ"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-98GMCN3RXZ');
          `}
        </Script>
      </head>
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
            {/* Team Chat Widget - Available for Pro+ team members and tenants */}
            {/* <TeamChatWidgetWrapper /> */}
            <PrivacyConsentBanner />
            {/* <LiveChatWidget /> */}
          </ThemeProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
