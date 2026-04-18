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
    <main className="w-full">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Inbox</h1>
              {(unreadEmailThreadsCount > 0 || friendRequests.length > 0) && (
                <span className="inline-flex items-center justify-center rounded-full bg-indigo-500 px-2 py-0.5 text-[11px] font-semibold text-white">
                  {unreadEmailThreadsCount + friendRequests.length}
                </span>
              )}
            </div>
            <p className="text-slate-600 text-sm">
              Internal and external email-style messages for your workspace.
            </p>
          </div>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-500 px-3 py-1.5 text-xs md:text-sm font-semibold text-white shadow hover:bg-indigo-400 transition-colors"
          >
            Support
          </Link>
        </div>

        {/* Gmail-style layout */}
        <div className="flex gap-0 rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-cyan-900/30" style={{minHeight: '75vh'}}>
          {/* Sidebar */}
          <div className="w-52 flex-shrink-0 bg-linear-to-r from-cyan-700 to-cyan-700 border-r border-white/10 flex flex-col text-sm text-slate-200/90">
            {/* Compose button */}
            <div className="p-3">
              <Link
                href="/user/profile/inbox?folder=compose"
                className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                  folder === 'compose'
                    ? 'bg-indigo-500 text-white'
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                }`}
              >
                + Compose
              </Link>
            </div>

            {/* Mailboxes */}
            <div className="px-2 pb-2">
              <p className="text-[10px] font-bold text-slate-300/60 uppercase tracking-[0.18em] px-2 mb-1">Mailboxes</p>
              {[
                { label: 'Inbox', key: 'inbox', count: inboxThreads.length },
                { label: 'Sent', key: 'sent', count: sentThreads.length },
                { label: 'Drafts', key: 'drafts', count: draftThreads.length },
                { label: 'Archived', key: 'archived', count: archivedThreads.length },
              ].map(({ label, key, count }) => (
                <Link
                  key={key}
                  href={`/user/profile/inbox?folder=${key}`}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors ${
                    folder === key ? 'bg-cyan-500/40 text-white font-semibold' : 'text-slate-300 hover:bg-cyan-600/40'
                  }`}
                >
                  <span>{label}</span>
                  {count > 0 && <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full">{count}</span>}
                </Link>
              ))}
            </div>

            {/* Friends */}
            <div className="px-2 flex-1 overflow-y-auto">
              <div className="flex items-center justify-between px-2 mb-1">
                <p className="text-[10px] font-bold text-slate-300/60 uppercase tracking-[0.18em]">People</p>
                <span className="text-[10px] text-slate-400/80">{friends.length}</span>
              </div>
              <FriendRequestsPanel requests={friendRequests} />
              {friends.length === 0 ? (
                <p className="text-xs text-slate-400/70 px-3 py-2">No contacts yet.</p>
              ) : (
                <div className="space-y-1">
                  {friends.map((u) => (
                    <div key={u.id} className="rounded-lg bg-cyan-600/30 border border-white/5 px-3 py-2">
                      <p className="text-xs font-medium text-white truncate">{u.name || 'User'}</p>
                      <p className="text-[10px] text-slate-300/80 truncate">{u.email}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main email panel */}
          <div className="flex-1 bg-linear-to-r from-cyan-700 to-cyan-700 flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
              <h2 className="text-sm font-semibold text-white capitalize">{folder}</h2>
              <span className="text-[11px] text-slate-300/70">
                {currentThreads.length} thread{currentThreads.length === 1 ? '' : 's'}
              </span>
            </div>

            {/* Compose form */}
            {folder === 'compose' && (
              <div className="p-5">
                <div className="rounded-xl border border-white/10 bg-linear-to-r from-cyan-400 via-sky-200 to-cyan-500 p-5">
                  <EmailComposeForm />
                </div>
              </div>
            )}

            {/* Thread list */}
            {folder !== 'compose' && (
              <div className="flex-1 overflow-y-auto divide-y divide-white/5">
                {currentThreads.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-cyan-600/40 flex items-center justify-center mb-4">
                      <span className="text-2xl">📭</span>
                    </div>
                    <p className="text-sm font-medium text-slate-200">No messages in this folder yet.</p>
                    <p className="text-xs text-slate-400 mt-1">Messages will appear here when they arrive.</p>
                  </div>
                )}
                {currentThreads.map((p: UserThreadParticipant) => {
                  const t = p.thread;
                  const last = t.messages[0];
                  const preview = last?.content?.slice(0, 160) ?? '';
                  const updated = new Date(t.updatedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                  const isUnread = !p.lastReadAt || (last && new Date(last.createdAt) > new Date(p.lastReadAt));
                  const senderLabel = (() => {
                    if (t.fromEmail) return t.fromEmail;
                    if (t.toEmail) return t.toEmail;
                    return 'PropertyFlow HQ';
                  })();
                  const subject = t.subject || senderLabel;

                  return (
                    <Link
                      key={p.id}
                      href={`/user/profile/inbox/${p.threadId}`}
                      className={`flex items-start gap-4 px-5 py-4 hover:bg-cyan-600/30 transition-colors cursor-pointer ${
                        isUnread ? 'bg-cyan-600/20' : ''
                      }`}
                    >
                      {/* Avatar */}
                      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-indigo-500/30 flex items-center justify-center text-xs font-bold text-white uppercase">
                        {senderLabel.charAt(0)}
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className={`text-sm truncate ${isUnread ? 'font-bold text-white' : 'font-medium text-slate-200'}`}>
                            {senderLabel}
                          </span>
                          <span className="text-[10px] text-slate-400 flex-shrink-0">{updated}</span>
                        </div>
                        <p className={`text-xs truncate mb-0.5 ${isUnread ? 'text-white' : 'text-slate-300'}`}>
                          {subject}
                        </p>
                        <p className="text-[11px] text-slate-400/80 line-clamp-1">
                          {preview || 'No message content'}
                        </p>
                      </div>
                      {isUnread && <div className="flex-shrink-0 w-2 h-2 rounded-full bg-indigo-400 mt-2" />}
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
