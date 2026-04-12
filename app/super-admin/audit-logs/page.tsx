import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prismaBase } from '@/db/prisma-base';
import AuditLogsClient from './audit-logs-client';

export const metadata = {
  title: 'Audit Logs | Super Admin',
  description: 'View security and financial audit logs',
};

export default async function AuditLogsPage() {
  const session = await auth();
  
  if (!session?.user?.id || session.user.role !== 'superAdmin') {
    redirect('/unauthorized');
  }

  // Fetch recent audit logs
  const auditLogs = await prismaBase.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  // Get summary stats
  const [totalLogs, criticalLogs, authEvents, financialEvents] = await Promise.all([
    prismaBase.auditLog.count(),
    prismaBase.auditLog.count({ where: { severity: 'CRITICAL' } }),
    prismaBase.auditLog.count({ where: { action: { startsWith: 'AUTH_' } } }),
    prismaBase.auditLog.count({ where: { action: { startsWith: 'PAYMENT_' } } }),
  ]);

  return (
    <div className='container mx-auto py-8 px-4'>
      <AuditLogsClient 
        initialLogs={auditLogs.map((log: any) => ({
          ...log,
          createdAt: log.createdAt.toISOString(),
        }))}
        stats={{
          totalLogs,
          criticalLogs,
          authEvents,
          financialEvents,
        }}
      />
    </div>
  );
}
