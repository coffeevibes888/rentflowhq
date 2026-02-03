import { APP_NAME } from '@/lib/constants';
import Image from 'next/image';
import Header from '@/components/shared/header';
import Footer from '@/components/footer';
import SessionProviderWrapper from '@/components/session-provider-wrapper';
import { ContractorSidebarWrapper } from '@/components/contractor/contractor-sidebar-wrapper';
import ContractorMainNav from './main-nav';
import { SubscriptionGate } from '@/components/subscription/subscription-gate';

export default async function ContractorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Ensure user has active subscription before accessing contractor dashboard
  await SubscriptionGate({ role: 'contractor', redirectTo: '/onboarding/contractor/subscription' });
  return (
    <SessionProviderWrapper>
      <div className='flex min-h-screen flex-col bg-white'>
        <Header />
        <div className='flex flex-1'>
          {/* Collapsible Sidebar */}
          <ContractorSidebarWrapper>
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
                <span className='text-sm text-black'>Contractor Portal</span>
              </div>
            </div>
            <ContractorMainNav className='flex-1' />
          </ContractorSidebarWrapper>

          {/* Content */}
          <div className='flex-1 flex flex-col min-w-0'>
            <main className='flex-1 overflow-y-auto px-3 md:px-6 lg:px-8 py-4 md:py-6'>
              <div className='mx-auto max-w-7xl w-full'>
                {children}
              </div>
            </main>
          </div>
        </div>
        <Footer />
      </div>
    </SessionProviderWrapper>
  );
}
