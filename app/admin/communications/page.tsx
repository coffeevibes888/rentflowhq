import { requireAdmin } from '@/lib/auth-guard';
import { prisma } from '@/db/prisma';
import Link from 'next/link';
import TenantComms from '@/components/admin/tenant-comms';
import { RentAutomationSettings } from '@/components/admin/rent-automation-settings';
import { headers } from 'next/headers';
import { getCurrentLandlordSubscription } from '@/lib/actions/subscription.actions';

type ThreadWithMessages = {
  id: string;
  type: string;
  subject: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  messages: {
    id: string;
    content: string | null;
    senderName: string | null;
    senderEmail: string | null;
    createdAt: Date;
  }[];
};

export default async function AdminCommunicationsPage() {
  const session = await requireAdmin();

  const headersList = await headers();
  const landlordSlug = headersList.get('x-landlord-slug');

  const landlord = landlordSlug
    ? await prisma.landlord.findUnique({
        where: { subdomain: landlordSlug },
        select: { id: true },
      })
    : session?.user?.id
      ? await prisma.landlord.findFirst({
          where: { ownerUserId: session.user.id as string },
          select: { id: true },
        })
      : null;

  const landlordId = landlord?.id ?? null;

  // Get subscription to check if Pro
  let isPro = false;
  const subResult = await getCurrentLandlordSubscription();
  if (subResult.success && subResult.subscription) {
    isPro = subResult.subscription.tier === 'pro' || subResult.subscription.tier === 'enterprise';
  }

  const threads = (await prisma.thread.findMany({
    where: {
      type: { in: ['contact', 'support'] },
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        take: 1,
      },
    },
  })) as ThreadWithMessages[];

  const tenantLeases = landlordId
    ? await prisma.lease.findMany({
        where: {
          status: 'active',
          unit: {
            property: {
              landlordId,
            },
          },
        },
        distinct: ['tenantId'],
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          unit: {
            select: {
              name: true,
              property: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      })
    : [];

  const tenants = tenantLeases.map((lease) => ({
    id: lease.tenant.id,
    name: lease.tenant.name,
    email: lease.tenant.email,
    unitName: lease.unit.name,
    propertyName: lease.unit.property.name,
  }));

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight">
          Communications
        </h1>
        <p className="text-xs sm:text-sm text-slate-300/90">
          Contact inbox + tenant communications in one place.
        </p>
      </div>

      {/* Notification preferences moved from Settings */}
      <section className="rounded-xl sm:rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-xl shadow-[0_20px_70px_rgba(15,23,42,0.35)] overflow-hidden">
        <div className="border-b border-white/10 px-3 sm:px-5 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
          <div className="space-y-0.5 sm:space-y-1">
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-slate-300/80">
              Notifications
            </p>
            <h2 className="text-base sm:text-lg font-semibold text-slate-50">Alert preferences</h2>
            <p className="text-[10px] sm:text-xs text-slate-400/90">
              Where to send alerts for applications, maintenance, and rent status.
            </p>
          </div>
        </div>
        <div className="p-3 sm:p-5 grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-200/90">Notifications email</label>
            <input
              className="w-full rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-violet-400 focus:ring-1 focus:ring-violet-400"
              placeholder="notifications@company.com"
            />
            <div className="space-y-2 text-xs text-slate-200/90">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="h-4 w-4 rounded border-white/20 bg-slate-900" defaultChecked />
                <span>New rental applications</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="h-4 w-4 rounded border-white/20 bg-slate-900" defaultChecked />
                <span>New maintenance tickets</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="h-4 w-4 rounded border-white/20 bg-slate-900" defaultChecked />
                <span>Late rent & partial payments</span>
              </label>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-200/90">Tenant invite channels</p>
            <p className="text-xs text-slate-400/90">
              Choose how invites are sent when adding tenants.
            </p>
            <div className="space-y-2 text-xs text-slate-200/90">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="h-4 w-4 rounded border-white/20 bg-slate-900" defaultChecked />
                <span>Email invite (recommended)</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="h-4 w-4 rounded border-white/20 bg-slate-900" />
                <span>Text message invite (coming soon)</span>
              </label>
              <p className="text-[10px] sm:text-[11px] text-slate-400/90">
                We&apos;ll respect this preference when you send tenant invites; SMS may require verification before going live.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Rent Automation Settings - Pro Feature */}
      <section className="rounded-xl sm:rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-xl shadow-[0_20px_70px_rgba(15,23,42,0.35)] overflow-hidden">
        <div className="border-b border-white/10 px-3 sm:px-5 py-3 sm:py-4">
          <div className="space-y-0.5 sm:space-y-1">
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-slate-300/80">
              Automation
            </p>
            <h2 className="text-base sm:text-lg font-semibold text-slate-50">Rent Automation</h2>
            <p className="text-[10px] sm:text-xs text-slate-400/90">
              Automatic rent reminders and late fee application.
            </p>
          </div>
        </div>
        <div className="p-3 sm:p-5">
          <RentAutomationSettings isPro={isPro} />
        </div>
      </section>

      <div className="space-y-4 sm:space-y-6">
        <section className="rounded-xl sm:rounded-2xl border shadow-[0_20px_70px_rgba(15,23,42,0.35)] overflow-hidden">
          <div className="border-b px-3 sm:px-5 py-3 sm:py-4">
            <div className="space-y-0.5 sm:space-y-1">
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em]">
                Contact Inbox
              </p>
              <h2 className="text-base sm:text-lg font-semibold">Threads</h2>
            </div>
          </div>

          <div className="max-h-[400px] sm:max-h-[680px] overflow-y-auto p-3 sm:p-4 space-y-2">
            {threads.length === 0 && (
              <p className="text-sm">No messages yet.</p>
            )}
            {threads.map((thread) => {
              const first = thread.messages[0];
              const preview = first?.content?.slice(0, 120) ?? '';
              const created = new Date(thread.createdAt).toLocaleString();

              return (
                <Link
                  key={thread.id}
                  href={`/admin/messages/${thread.id}`}
                  className="block rounded-lg sm:rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2.5 sm:px-3.5 sm:py-3 text-xs text-slate-200/90 flex flex-col gap-1 hover:border-violet-400/60 hover:bg-slate-900/90 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center rounded-full bg-white/5 px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300/90">
                      {thread.type === 'contact' ? 'Contact' : 'Support'}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-slate-400/90">
                      {created}
                    </span>
                  </div>
                  {first?.senderName && (
                    <p className="text-[10px] sm:text-[11px] font-medium text-slate-100/90 truncate">
                      {first.senderName}{' '}
                      <span className="hidden sm:inline">{first.senderEmail ? `• ${first.senderEmail}` : ''}</span>
                    </p>
                  )}
                  <p className="text-[10px] sm:text-[11px] text-slate-300/90 line-clamp-2">
                    {preview || 'No message content'}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl sm:rounded-2xl border shadow-[0_20px_70px_rgba(15,23,42,0.35)] overflow-hidden">
          <div className="border-b px-3 sm:px-5 py-3 sm:py-4">
            <div className="space-y-0.5 sm:space-y-1">
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-slate-300/80">
                Tenant Communications
              </p>
              <h2 className="text-base sm:text-lg font-semibold text-slate-50">Messages</h2>
            </div>
          </div>
          <div className="p-3 sm:p-4 md:p-5">
            <TenantComms tenants={tenants} landlordId={landlordId ?? undefined} hideHeader />
          </div>
        </section>
      </div>
    </div>
  );
}
