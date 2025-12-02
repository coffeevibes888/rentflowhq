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
      <body className='bg-gradient-to-br from-slate-950 via-violet-800/60 to-slate-900 text-foreground flex flex-col min-h-screen overflow-x-hidden'>
        <ThemeProvider
          attribute='class'
          defaultTheme='dark'
          enableSystem={false}
          forcedTheme='dark'
          disableTransitionOnChange
        >
          <PageViewTracker />
          <div
            className='w-full text-[11px] md:text-xs font-medium tracking-tight flex items-center overflow-hidden bg-gradient-to-r from-purple-700 via-purple-600 to-yellow-400 shadow-sm'
            style={{ height: '24px' }}
          >
            <div className='banner-marquee flex items-center gap-6 px-4 text-white whitespace-nowrap'>
              <span>Free shipping over $75 within the US.</span>
              <span className='text-white/70'>|</span>
              <span>Easy 30-day returns on unworn items.</span>
              <span className='text-white/70'>|</span>
              <span>Secure checkout powered by Stripe.</span>
              <span className='text-white/70'>|</span>
              <span>Need help deciding? Chat with us.</span>

              <span className='ml-10'>Free shipping over $75 within the US.</span>
              <span className='text-white/70'>|</span>
              <span>Easy 30-day returns on unworn items.</span>
              <span className='text-white/70'>|</span>
              <span>Secure checkout powered by Stripe.</span>
              <span className='text-white/70'>|</span>
              <span>Need help deciding? Chat with us.</span>
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

