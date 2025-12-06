import type { Metadata } from 'next';
import '@/assets/styles/globals.css';
import { APP_DESCRIPTION, APP_NAME, SERVER_URL } from '@/lib/constants';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/toaster';
import { ChatWidget } from '@/components/shared/chat-widget';
import PageViewTracker from '@/components/analytics/page-view-tracker';

export const metadata: Metadata = {
  title: {
    template: `%s | Rocken My Vibe`,
    default: APP_NAME,
  },
  description: APP_DESCRIPTION,
  metadataBase: new URL(SERVER_URL),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className='bg-gradient-to-r from-sky-700 via-blue-500 to-cyan-500 text-black flex flex-col min-h-screen overflow-x-hidden'>
        <ThemeProvider
          attribute='class'
          defaultTheme='light'
          enableSystem={false}
          forcedTheme='light'
          disableTransitionOnChange
        >
          <PageViewTracker />
          <div
            className='w-full text-[11px] md:text-xs font-medium tracking-tight flex items-center overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-500 shadow-sm'
            style={{ height: '24px' }}
          >
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
          <ChatWidget />
        </ThemeProvider>
      </body>
    </html>
  );
}

