import { APP_NAME } from '@/lib/constants';
import Image from 'next/image';
import SessionProviderWrapper from '@/components/session-provider-wrapper';
import { EmployeeSidebar } from '@/components/employee/employee-sidebar';
import { EmployeeHeader } from '@/components/employee/employee-header';

export default function EmployeeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionProviderWrapper>
      <div className='flex min-h-screen flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'>
        <EmployeeHeader />
        <div className='flex flex-1'>
          {/* Sidebar */}
          <EmployeeSidebar />

          {/* Main Content */}
          <div className='flex-1 flex flex-col min-w-0'>
            <main className='flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 py-6'>
              <div className='mx-auto max-w-6xl w-full'>
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    </SessionProviderWrapper>
  );
}
