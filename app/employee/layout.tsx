'use client';

import { SessionProvider } from 'next-auth/react';
import { EmployeeSidebar } from '@/components/employee/employee-sidebar';
import { EmployeeHeader } from '@/components/employee/employee-header';

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <EmployeeSidebar />
        <div className="flex-1 flex flex-col">
          <EmployeeHeader />
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </SessionProvider>
  );
}
