import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import Link from 'next/link';
import FriendRequestsPanel, { FriendRequestItem } from '@/components/user/friend-requests-panel';
import EmailComposeForm from '@/components/user/email-compose-form';

type UserThreadParticipant = {
  id: string;
  threadId: string;
  userId: string;
  lastReadAt: Date | null;
  thread: {
    type: string;
    updatedAt: Date;
    status?: string;
    createdByUserId?: string | null;
    subject?: string | null;
    fromEmail?: string | null;
    toEmail?: string | null;
    messages: {
      content: string | null;
      createdAt: Date | string;
    }[];
  };
};

export default async function UserInboxPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <main className="w-full min-h-screen px-4 py-8 md:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-slate-200">You need to be signed in to view your inbox.</p>
        </div>
      </main>
    );
  }

  const userId = session.user.id as string;

  const resolvedSearchParams = await searchParams;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const participantThreads = await (prisma as any).threadParticipant.findMany({
    where: { userId },
    include: {
      thread: {
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      },
    },
    orderBy: { thread: { updatedAt: 'desc' } },
  });

  const emailLikeThreads = participantThreads.filter(
    (p: UserThreadParticipant) => p.thread.type === 'email'
  );

  const inboxThreads = emailLikeThreads.filter(
    (p: UserThreadParticipant) =>
      p.thread.status !== 'archived' &&
      p.thread.status !== 'draft' &&
      (!p.thread.createdByUserId || p.thread.createdByUserId !== userId)
  );
  const sentThreads = emailLikeThreads.filter(
    (p: UserThreadParticipant) => p.thread.createdByUserId && p.thread.createdByUserId === userId
  );
  const draftThreads = emailLikeThreads.filter((p: UserThreadParticipant) => p.thread.status === 'draft');
  const archivedThreads = emailLikeThreads.filter((p: UserThreadParticipant) => p.thread.status === 'archived');

  const folder = (resolvedSearchParams.folder as string) || 'inbox';

  const currentThreads =
    folder === 'sent'
      ? sentThreads
      : folder === 'drafts'
      ? draftThreads
      : folder === 'archived'
      ? archivedThreads
      : inboxThreads;

  const unreadEmailThreadsCount = inboxThreads.filter((p: UserThreadParticipant) => {
    if (!p.thread.messages.length) return false;
    const last = p.thread.messages[0];
    if (!p.lastReadAt) return true;
    return new Date(last.createdAt) > new Date(p.lastReadAt);
  }).length;

  const friendships = await prisma.friend.findMany({
    where: {
      status: 'accepted',
      OR: [{ userId }, { friendId: userId }],
    },
    include: {
      user: true,
      friend: true,
    },
  });

  const friends = friendships.map((f) => {
    const other = f.userId === userId ? f.friend : f.user;
    return other;
  });

  const rawRequests = await prisma.friend.findMany({
    where: {
      status: 'pending',
      OR: [{ userId }, { friendId: userId }],
    },
    include: {
      user: true,
      friend: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const friendRequests: FriendRequestItem[] = rawRequests.map((r) => {
    const isIncoming = r.friendId === userId;
    const other = isIncoming ? r.user : r.friend;
    return {
      id: r.id,
      direction: isIncoming ? 'incoming' : 'outgoing',
      otherUser: {
        id: other.id,
        name: other.name,
        email: other.email,
      },
      status: r.status,
    };
  });

  return (
    <main className="w-full min-h-screen px-4 py-8 md:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl md:text-4xl font-bold text-white">Inbox</h1>
              {(unreadEmailThreadsCount > 0 || friendRequests.length > 0) && (
                <span className="inline-flex items-center justify-center rounded-full bg-violet-500 px-2 py-0.5 text-[11px] font-semibold text-white">
                  {unreadEmailThreadsCount + friendRequests.length}
                </span>
              )}
            </div>
            <p className="text-gray-300 text-sm md:text-base">
              Internal and external email-style messages for your workspace.
            </p>
          </div>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-lg bg-violet-500 px-3 py-1.5 text-xs md:text-sm font-semibold text-white shadow hover:bg-violet-400 transition-colors"
          >
            Support
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,260px)_minmax(0,1.8fr)]">
          <div className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-4 shadow-inner shadow-slate-950/60 text-sm text-slate-200/90">
            <FriendRequestsPanel requests={friendRequests} />

            <div className="space-y-3">
              <div className="border-b border-white/10 pb-2">
                <h2 className="text-[11px] font-semibold text-slate-200 uppercase tracking-[0.18em] mb-2">
                  Mailboxes
                </h2>
                <div className="space-y-1 text-xs text-slate-300">
                  <Link
                    href="/user/profile/inbox?folder=inbox"
                    className={`flex items-center justify-between rounded-lg px-2 py-1 cursor-pointer ${
                      folder === 'inbox' ? 'bg-slate-800/70 text-slate-50' : 'hover:bg-slate-800/50'
                    }`}
                  >
                    <span>Inbox</span>
                  </Link>
                  <Link
                    href="/user/profile/inbox?folder=sent"
                    className={`flex items-center justify-between rounded-lg px-2 py-1 cursor-pointer ${
                      folder === 'sent' ? 'bg-slate-800/70 text-slate-50' : 'hover:bg-slate-800/50'
                    }`}
                  >
                    <span>Sent</span>
                  </Link>
                  <Link
                    href="/user/profile/inbox?folder=drafts"
                    className={`flex items-center justify-between rounded-lg px-2 py-1 cursor-pointer ${
                      folder === 'drafts' ? 'bg-slate-800/70 text-slate-50' : 'hover:bg-slate-800/50'
                    }`}
                  >
                    <span>Drafts</span>
                  </Link>
                  <Link
                    href="/user/profile/inbox?folder=archived"
                    className={`flex items-center justify-between rounded-lg px-2 py-1 cursor-pointer ${
                      folder === 'archived' ? 'bg-slate-800/70 text-slate-50' : 'hover:bg-slate-800/50'
                    }`}
                  >
                    <span>Archived</span>
                  </Link>
                  <Link
                    href="/user/profile/inbox?folder=compose"
                    className={`flex items-center justify-between rounded-lg px-2 py-1 cursor-pointer text-[11px] font-semibold ${
                      folder === 'compose' ? 'bg-slate-800/70 text-violet-200' : 'text-violet-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <span>Compose</span>
                  </Link>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-[0.18em]">
                    Friends & Coworkers
                  </h2>
                  <span className="text-[10px] text-slate-400/90">{friends.length}</span>
                </div>
                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                  {friends.length === 0 && (
                    <p className="text-sm text-slate-400/80">No other users found yet.</p>
                  )}
                  {friends.map((u) => (
                    <div
                      key={u.id}
                      className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs flex flex-col gap-1"
                    >
                      <p className="text-[13px] font-medium text-slate-50">{u.name || 'User'}</p>
                      <p className="text-[11px] text-slate-300/90 break-all">{u.email}</p>
                      {u.phoneNumber && (
                        <p className="text-[11px] text-slate-400/90">Phone: {u.phoneNumber}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-4 shadow-inner shadow-slate-950/60">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-[0.18em]">
                Email
              </h2>
              <span className="text-[10px] text-slate-400/90">
                {currentThreads.length} thread{currentThreads.length === 1 ? '' : 's'}
              </span>
            </div>
            {folder === 'compose' && (
              <div
                id="compose-email"
                className="mb-3 rounded-xl border border-white/10 bg-slate-950/80 px-3 py-3"
              >
                <EmailComposeForm />
              </div>
            )}
            {folder !== 'compose' && (
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {currentThreads.length === 0 && (
                  <p className="text-sm text-slate-400/80">No messages in this folder yet.</p>
                )}
                {currentThreads.map((p: UserThreadParticipant) => {
                const t = p.thread;
                const last = t.messages[0];
                const preview = last?.content?.slice(0, 120) ?? '';
                const updated = new Date(t.updatedAt).toLocaleString();
                const senderLabel = (() => {
                  if (t.fromEmail) {
                    const atIndex = t.fromEmail.indexOf('@');
                    if (atIndex !== -1 && atIndex < t.fromEmail.length - 1) {
                      return t.fromEmail.slice(atIndex + 1);
                    }
                    return t.fromEmail;
                  }
                  if (t.toEmail) return t.toEmail;
                  return 'Email';
                })();

                return (
                  <Link
                    key={p.id}
                    href={`/user/profile/inbox/${p.threadId}`}
                    className="block rounded-xl border border-white/10 bg-slate-950/70 px-3.5 py-3 text-xs text-slate-200/90 flex flex-col gap-1 hover:border-violet-400/60 hover:bg-slate-900/90 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300/90">
                        {senderLabel}
                      </span>
                      <span className="text-[10px] text-slate-400/90">{updated}</span>
                    </div>
                    <p className="text-[11px] text-slate-300/90 line-clamp-2">
                      {preview || 'No message content'}
                    </p>
                  </Link>
                );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
