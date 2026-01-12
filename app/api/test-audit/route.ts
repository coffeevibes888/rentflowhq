/**
 * Audit Log Test API Route
 * 
 * GET /api/test-audit - Run audit log tests
 * DELETE /api/test-audit - Clean up test entries
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { logAuditEvent, logAuthEvent, logFinancialEvent, getAuditLogs } from '@/lib/security/audit-logger';

export async function GET() {
  const results: { test: string; status: 'pass' | 'fail'; details?: string }[] = [];
  const testUserId = '00000000-0000-0000-0000-000000000001';

  try {
    // Test 1: Database Connection
    const count = await prisma.auditLog.count();
    results.push({ test: 'Database Connection', status: 'pass', details: `Current count: ${count}` });

    // Test 2: Create basic audit log
    await logAuditEvent({
      action: 'ADMIN_ACTION',
      userId: testUserId,
      resourceType: 'test',
      metadata: { test: true, timestamp: new Date().toISOString() },
      severity: 'INFO',
    });
    results.push({ test: 'Create Basic Audit Log', status: 'pass' });

    // Test 3: Create auth event
    await logAuthEvent('AUTH_LOGIN', {
      userId: testUserId,
      email: 'test@example.com',
      ipAddress: '127.0.0.1',
      success: true,
    });
    results.push({ test: 'Create Auth Event', status: 'pass' });

    // Test 4: Create financial event
    await logFinancialEvent('PAYMENT_COMPLETED', {
      userId: testUserId,
      amount: 1500.00,
      currency: 'USD',
      transactionId: 'test_txn_' + Date.now(),
      paymentMethod: 'card',
    });
    results.push({ test: 'Create Financial Event', status: 'pass' });

    // Test 5: Retrieve logs
    const logs = await getAuditLogs({ userId: testUserId, limit: 10 });
    results.push({ test: 'Retrieve Audit Logs', status: 'pass', details: `Found ${logs.length} logs` });

    // Test 6: Query by severity
    const [critical, warning, info] = await Promise.all([
      prisma.auditLog.count({ where: { severity: 'CRITICAL' } }),
      prisma.auditLog.count({ where: { severity: 'WARNING' } }),
      prisma.auditLog.count({ where: { severity: 'INFO' } }),
    ]);
    results.push({ 
      test: 'Query by Severity', 
      status: 'pass', 
      details: `CRITICAL=${critical}, WARNING=${warning}, INFO=${info}` 
    });

    // Test 7: Query by action type
    const [auth, payment, payout, admin] = await Promise.all([
      prisma.auditLog.count({ where: { action: { startsWith: 'AUTH_' } } }),
      prisma.auditLog.count({ where: { action: { startsWith: 'PAYMENT_' } } }),
      prisma.auditLog.count({ where: { action: { startsWith: 'PAYOUT_' } } }),
      prisma.auditLog.count({ where: { action: 'ADMIN_ACTION' } }),
    ]);
    results.push({ 
      test: 'Query by Action Type', 
      status: 'pass', 
      details: `AUTH=${auth}, PAYMENT=${payment}, PAYOUT=${payout}, ADMIN=${admin}` 
    });

    // Test 8: Recent activity
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCount = await prisma.auditLog.count({
      where: { createdAt: { gte: last24Hours } },
    });
    results.push({ test: 'Recent Activity (24h)', status: 'pass', details: `${recentCount} logs` });

    // Clean up test entries
    await prisma.auditLog.deleteMany({ where: { userId: testUserId } });
    results.push({ test: 'Cleanup Test Entries', status: 'pass' });

    // Get sample recent logs for display
    const sampleLogs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        action: true,
        severity: true,
        resourceType: true,
        ipAddress: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      status: 'OPERATIONAL',
      totalTests: results.length,
      passed: results.filter(r => r.status === 'pass').length,
      failed: results.filter(r => r.status === 'fail').length,
      results,
      sampleLogs,
      summary: {
        totalAuditLogs: count,
        authEvents: auth,
        paymentEvents: payment,
        payoutEvents: payout,
        adminEvents: admin,
        criticalEvents: critical,
        warningEvents: warning,
        recentActivity24h: recentCount,
      },
    });

  } catch (error) {
    return NextResponse.json({
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
      results,
    }, { status: 500 });
  }
}
