import { APP_NAME } from '@/lib/constants';
import Image from 'next/image';
import AgentMainNav from './main-nav';
import Header from '@/components/shared/header';
import Footer from '@/components/footer';
import SessionProviderWrapper from '@/components/session-provider-wrapper';
import { AgentSidebarWrapper } from '@/components/agent/agent-sidebar-wrapper';

export default function AgentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionProviderWrapper>
      <div className='flex min-h-screen flex-col bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900'>
        <Header />
        <div className='flex flex-1 text-white'>
          {/* Collapsible Sidebar */}
          <AgentSidebarWrapper>
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
                <span className='text-sm text-white'>Real Estate Agent Portal</span>
              </div>
            </div>
            <AgentMainNav className='flex-1' />
          </AgentSidebarWrapper>

          {/* Content - Mobile Responsive */}
          <div className='flex-1 flex flex-col min-w-0'>
            <main className='flex-1 overflow-y-auto px-3 md:px-6 lg:px-8 py-4 md:py-6'>
              <div className='mx-auto max-w-7xl w-full'>
                <div className='rounded-xl p-4 md:p-6'>{children}</div>
              </div>
            </main>
          </div>
        </div>
        <Footer />
      </div>
    </SessionProviderWrapper>
  );
}
