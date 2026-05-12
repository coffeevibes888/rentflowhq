import { APP_NAME, SERVER_URL } from '@/lib/constants';
import Image from 'next/image';
import Link from 'next/link';
import MainNav from './main-nav';
import Header from '@/components/shared/header';
import Footer from '@/components/footer';
import MobileMenu from '@/components/mobile/mobile-menu';
import SessionProviderWrapper from '@/components/session-provider-wrapper';
import { SubscriptionProvider } from '@/components/subscription/subscription-provider';
import { AdminSidebarWrapper } from '@/components/admin/admin-sidebar-wrapper';
import { OnboardingWrapper } from '@/components/onboarding/onboarding-wrapper';
import { SubscriptionGate } from '@/components/subscription/subscription-gate';
import { TeamChatWidgetWrapper } from '@/components/team/team-chat-widget-wrapper';
import { cookies, headers } from 'next/headers';

export default async function AdminLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params?: unknown;
}>) {
  // If arriving from a successful Stripe checkout, sync the subscription into
  // the DB *before* SubscriptionGate runs. This prevents the gate from
  // bouncing the user back to the subscription page due to a timing race
  // where the subscription hasn't been written yet.
  const headersList = await headers();
  const referer = headersList.get('referer') || '';
  const isFromStripeCheckout = referer.includes('checkout.stripe.com');

  if (isFromStripeCheckout) {
    try {
      const cookieStore = await cookies();
      const cookieHeader = cookieStore
        .getAll()
        .map((c) => `${c.name}=${c.value}`)
        .join('; ');

      let origin = SERVER_URL;
      try {
        origin = new URL(SERVER_URL).origin;
      } catch {}

      await fetch(`${origin}/api/landlord/subscription/sync`, {
        method: 'POST',
        headers: cookieHeader ? { cookie: cookieHeader } : undefined,
        cache: 'no-store',
      });
    } catch {
      // Non-fatal — the page-level sync will still run as a fallback
    }
  }

  // Ensure user has active subscription before accessing admin dashboard
  await SubscriptionGate({ role: 'landlord', redirectTo: '/onboarding/landlord/subscription' });

  return (
    <SessionProviderWrapper>
      <SubscriptionProvider>
        <div className='flex min-h-screen flex-col bg-white'>
          <Header />
          <div className='flex flex-1 text-black'>
            {/* Collapsible Sidebar */}
            <AdminSidebarWrapper>
              <div className='flex items-center gap-3 px-2 p-2'>
                <div className='relative h-10 w-10 rounded-lg overflow-hidden flex items-center justify-center bg-white/10'>
                  <Image
                    src='/images/logo.svg'
                    height={40}
                    width={40}
                    alt={APP_NAME}
                    className='object-contain filter brightness-0 invert'
                  />
                </div>
                <div className='flex flex-col sidebar-expanded-only'>
                  <span className='text-sm text-black'>Properties, tenants & rent</span>
                </div>
              </div>
              <MainNav className='flex-1' />
            </AdminSidebarWrapper>

            {/* Content - Mobile Responsive */}
            <div className='flex-1 flex flex-col min-w-0'>
              <main className='flex-1 overflow-y-auto px-2 sm:px-4 md:px-6 lg:px-8 py-3 md:py-6 bg-gray-50/50'>
                <div className='mx-auto max-w-7xl w-full'>
                  {children}
                </div>
              </main>
            </div>
          </div>
          <Footer />
        </div>
        <TeamChatWidgetWrapper />
        <OnboardingWrapper />
      </SubscriptionProvider>
    </SessionProviderWrapper>
  );
}
