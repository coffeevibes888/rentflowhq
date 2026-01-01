import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prismaBase } from '@/db/prisma-base';
import SecurityClient from './security-client';

export const metadata = {
  title: 'Security | Super Admin',
  description: 'Security dashboard and threat monitoring',
};

export default async function SecurityPage() {
  const session = await auth();
  
  if (!session?.user?.id || session.user.role !== 'super_admin') {
    redirect('/unauthorized');
  }

  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Get landlords without 2FA
  const landlordUsers = await prismaBase.user.findMany({
    where: {
      role: { in: ['property_manager', 'admin'] },
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  // Check which have 2FA enabled
  const twoFARecords = await prismaBase.twoFactorAuth.findMany({
    where: {
      userId: { in: landlordUsers.map((u) => u.id) },
      isEnabled: true,
    },
    select: { userId: true },
  });

  const usersWithTwoFA = new Set(twoFARecords.map((r) => r.userId));
  const usersWithout2FAList = landlordUsers.filter((u) => !usersWithTwoFA.has(u.id));

  // Get failed login attempts in last 24h
  const failedLoginAttempts = await prismaBase.auditLog.count({
    where: {
      action: 'AUTH_FAILED_LOGIN',
      createdAt: { gte: yesterday },
    },
  });

  // Get blocked IPs count
  const blockedIPs = await prismaBase.blockedIP.count({
    where: {
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: now } },
      ],
    },
  });

  // Get recent security events
  const recentSecurityEvents = await prismaBase.auditLog.findMany({
    where: {
      OR: [
        { severity: { in: ['WARNING', 'CRITICAL'] } },
        { action: { startsWith: 'AUTH_' } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return (
    <div className='container mx-auto py-8 px-4'>
      <SecurityClient 
        stats={{
          usersWithout2FA: usersWithout2FAList.length,
          usersWithout2FAList,
          failedLoginAttempts,
          blockedIPs,
          recentSecurityEvents: recentSecurityEvents.map((e) => ({
            id: e.id,
            action: e.action,
            userId: e.userId,
            ipAddress: e.ipAddress,
            severity: e.severity,
            createdAt: e.createdAt.toISOString(),
          })),
        }}
      />
    </div>
  );
}
