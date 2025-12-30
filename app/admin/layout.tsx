import { APP_NAME } from '@/lib/constants';
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

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionProviderWrapper>
      <SubscriptionProvider>
        <div className='flex min-h-screen flex-col bg-gradient-to-r from-blue-400 via-cyan-400 to-sky-600'>
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
              <main className='flex-1 overflow-y-auto px-2 sm:px-4 md:px-6 lg:px-8 py-3 md:py-6'>
                <div className='mx-auto max-w-7xl w-full'>
                  {children}
                </div>
              </main>
            </div>
          </div>
          <Footer />
        </div>
        <OnboardingWrapper />
      </SubscriptionProvider>
    </SessionProviderWrapper>
  );
}
