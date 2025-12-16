import { auth } from '@/auth';
import { requireAdmin } from '@/lib/auth-guard';
import { prisma } from '@/db/prisma';
import Link from 'next/link';

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

export default async function AdminMessagesPage() {
  await requireAdmin();
  const session = await auth();

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

  return (
    <main className="min-h-[calc(100vh-4rem)] w-full bg-gradient-to-br from-slate-950 via-violet-800/60 to-slate-900 text-slate-50 flex items-center justify-center px-4 py-10">
      <div className="relative w-full max-w-6xl">
        <div className="pointer-events-none absolute -inset-1 rounded-3xl bg-gradient-to-r from-violet-500/40 via-fuchsia-500/20 to-cyan-400/40 blur-3xl opacity-70" />

        <div className="relative rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-2xl shadow-[0_20px_70px_rgba(15,23,42,0.9)] overflow-hidden">
          <div className="grid gap-8 md:grid-cols-[minmax(0,2.2fr)_minmax(0,3fr)] p-6 sm:p-8 lg:p-10">
            <section className="space-y-4">
              <header className="space-y-2">
                <p className="inline-flex items-center rounded-full bg-white/5 px-3 py-1 text-xs font-medium tracking-wide text-violet-200/80 ring-1 ring-white/10">
                  Admin Message Center
                </p>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight">
                  Inbox
                </h1>
                <p className="text-sm sm:text-base text-slate-300/80 max-w-xl">
                  View contact requests and support chats from visitors and customers.
                </p>
              </header>

              <div className="mt-4 space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {threads.length === 0 && (
                  <p className="text-sm text-slate-400/80">No messages yet.</p>
                )}
                {threads.map((thread) => {
                  const first = thread.messages[0];
                  const preview = first?.content?.slice(0, 80) ?? '';
                  const created = new Date(thread.createdAt).toLocaleString();

                  return (
                    <Link
                      key={thread.id}
                      href={`/admin/messages/${thread.id}`}
                      className="block rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-3 text-xs text-slate-200/90 flex flex-col gap-1 hover:border-violet-400/60 hover:bg-slate-900/90 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300/90">
                          {thread.type === 'contact' ? 'Contact' : 'Support'}
                        </span>
                        <span className="text-[10px] text-slate-400/90">{created}</span>
                      </div>
                      {first?.senderName && (
                        <p className="text-[11px] font-medium text-slate-100/90">
                          {first.senderName} {first.senderEmail ? `• ${first.senderEmail}` : ''}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-300/90 line-clamp-2">
                        {preview || 'No message content'}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </section>

            <aside className="relative flex flex-col justify-between rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-violet-900/60 px-5 py-6 sm:px-6 lg:px-7 lg:py-8 shadow-inner shadow-slate-950/60 overflow-hidden">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-violet-500/30 blur-3xl" />
              <div className="pointer-events-none absolute -left-16 bottom-[-3rem] h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />

              <div className="relative space-y-4">
                <h2 className="text-lg sm:text-xl font-semibold text-slate-50">
                  How this inbox works
                </h2>
                <ul className="space-y-2 text-sm text-slate-200/90 list-disc list-inside">
                  <li>Contact form submissions create <span className="font-semibold">contact</span> threads.</li>
                  <li>Support chat creates <span className="font-semibold">support</span> threads with AI + agent notes.</li>
                  <li>Future: assign threads to team members or convert into user DMs.</li>
                </ul>
                <p className="text-xs text-slate-300/80">
                  For now this is a read-only overview. We can later add reply tools and status controls (open, pending, closed).
                </p>

                <div className="mt-4 space-y-2 text-xs text-slate-300/90">
                  <p>
                    Logged in as:{' '}
                    <span className="font-semibold">{session?.user?.email ?? 'Admin'}</span>
                  </p>
                  <Link href="/contact" className="inline-flex text-violet-200 hover:text-violet-100 text-xs">
                    View public contact page
                  </Link>
                </div>
              </div>

              <div className="relative mt-6 flex items-center justify-between gap-3 text-[11px] text-slate-300/80">
                <p className="max-w-[70%]">
                  This is the central inbox for RockEnMyVibe. Every contact and live chat ends up here.
                </p>
                <div className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1.5 text-[10px] font-medium tracking-wide text-emerald-200/90 ring-1 ring-emerald-400/40">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
                  <span>Inbox online</span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}
