import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import { Lock, Zap } from 'lucide-react';
import Link from 'next/link';
import { PayrollDashboard } from '@/components/contractor/payroll/payroll-dashboard';
import { resolveContractorAuth, can, meetsMinTier } from '@/lib/contractor-auth';

export const metadata: Metadata = { title: 'Payroll' };

export default async function PayrollPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');

  const contractorAuth = await resolveContractorAuth(session.user.id);
  if (!contractorAuth) redirect('/onboarding/contractor');

  const contractorProfile = await prisma.contractorProfile.findUnique({
    where: { id: contractorAuth.contractorId },
    select: { id: true, businessName: true },
  });
  if (!contractorProfile) redirect('/onboarding/contractor');

  const tier = contractorAuth.tier;
  const hasAccess = meetsMinTier(contractorAuth, 'pro') && can(contractorAuth, 'payroll.view');

  if (!hasAccess) {
    return (
      <main className="w-full px-4 py-10 md:px-0">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-8 text-center">
            <Lock className="h-12 w-12 text-amber-400 mx-auto mb-4" />
            <h1 className="text-2xl font-semibold text-white mb-2">Payroll</h1>
            <p className="text-slate-300 mb-6">
              Payroll processing is available on the Pro plan. Upgrade to calculate
              gross pay, deductions, net pay, and generate pay stubs for your team.
            </p>
            <Link
              href="/contractor/settings/subscription"
              className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-full font-semibold transition-colors"
            >
              <Zap className="h-5 w-5" />
              Upgrade to Pro
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const db = prisma as any;
  const [payrolls, employees] = await Promise.all([
    db.contractorPayroll.findMany({
      where: { contractorId: contractorProfile.id },
      include: {
        paychecks: {
          select: { id: true, status: true, grossPay: true, netPay: true },
        },
      },
      orderBy: { periodStart: 'desc' },
      take: 20,
    }),
    db.contractorEmployee.findMany({
      where: { contractorId: contractorProfile.id, status: 'active' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        payRate: true,
        payType: true,
        employeeType: true,
      },
      orderBy: [{ lastName: 'asc' }],
    }),
  ]);

  return (
    <main className="w-full pb-8">
      <PayrollDashboard
        contractorId={contractorProfile.id}
        businessName={contractorProfile.businessName}
        initialPayrolls={JSON.parse(JSON.stringify(payrolls))}
        employees={JSON.parse(JSON.stringify(employees))}
        canRun={can(contractorAuth, 'payroll.run')}
        canMarkPaid={can(contractorAuth, 'payroll.mark_paid')}
      />
    </main>
  );
}
