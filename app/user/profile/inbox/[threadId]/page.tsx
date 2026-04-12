import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import Link from 'next/link';

export default async function UserThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <main className="w-full min-h-screen px-4 py-8 md:px-8">
        <div className="max-w-3xl mx-auto">
          <p className="text-slate-200">You need to be signed in to view this conversation.</p>
        </div>
      </main>
    );
  }

  const userId = session.user.id as string;

  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
      participants: true,
    },
  });

  if (!thread) {
    return (
      <main className="w-full min-h-screen px-4 py-8 md:px-8">
        <div className="max-w-3xl mx-auto">
          <p className="text-slate-200">Conversation not found.</p>
        </div>
      </main>
    );
  }

  const isParticipant = thread.participants.some((p) => p.userId === userId);

  if (!isParticipant) {
    return (
      <main className="w-full min-h-screen px-4 py-8 md:px-8">
        <div className="max-w-3xl mx-auto">
          <p className="text-slate-200">You do not have access to this conversation.</p>
        </div>
      </main>
    );
  }

  // Mark this thread as read for the current user when they view it
  await prisma.threadParticipant.updateMany({
    where: { threadId: thread.id, userId },
    data: { lastReadAt: new Date() },
  });

  return (
    <main className="w-full min-h-screen px-4 py-8 md:px-8">
      <div className="max-w-3xl mx-auto space-y-4">
        <header className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-white mb-1">
              {thread.subject || 'Conversation'}
            </h1>
            <p className="text-xs md:text-sm text-slate-300/90">
              Direct messages and support chats related to your account.
            </p>
          </div>
          <Link
            href="/user/profile/inbox"
            className="text-xs md:text-sm text-slate-300 hover:text-slate-100 underline-offset-2 hover:underline"
          >
            Back to inbox
          </Link>
        </header>

        <div className="rounded-2xl border border-white/10 bg-slate-900/70 shadow-inner shadow-slate-950/60 flex flex-col h-[65vh]">
          <div className="flex-1 px-4 md:px-5 py-4 space-y-3 overflow-y-auto">
            {thread.messages.length === 0 && (
              <p className="text-sm text-slate-400/80">No messages yet.</p>
            )}
            {thread.messages.map((m) => {
              const mine = m.senderUserId === userId;
              const created = new Date(m.createdAt).toLocaleString();

              return (
                <div
                  key={m.id}
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs md:text-sm shadow border border-white/5 ${
                    mine
                      ? 'ml-auto bg-violet-600/80 text-slate-50'
                      : 'mr-auto bg-slate-800/80 text-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-100/80">
                      {mine ? 'You' : m.senderName || 'Other' }
                    </span>
                    <span className="text-[9px] text-slate-200/70">{created}</span>
                  </div>
                  <p className="whitespace-pre-wrap leading-relaxed text-[11px] md:text-[13px]">
                    {m.content}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="px-4 md:px-5 py-4 border-t border-white/10 bg-slate-950/80">
            <form
              action={async (formData: FormData) => {
                'use server';

                const content = formData.get('content');

                if (!content || typeof content !== 'string' || !content.trim()) {
                  return;
                }

                const currentSession = await auth();

                if (!currentSession?.user?.id) {
                  return;
                }

                const trimmed = content.trim();

                await prisma.message.create({
                  data: {
                    threadId: thread.id,
                    senderUserId: currentSession.user.id as string,
                    senderName: currentSession.user.name ?? null,
                    senderEmail: currentSession.user.email ?? null,
                    content: trimmed,
                    role: 'user',
                  },
                });

                await prisma.thread.update({
                  where: { id: thread.id },
                  data: { updatedAt: new Date() },
                });

                await prisma.threadParticipant.updateMany({
                  where: { threadId: thread.id, userId: currentSession.user.id as string },
                  data: { lastReadAt: new Date() },
                });
              }}
              className="flex items-end gap-3"
            >
              <textarea
                name="content"
                rows={2}
                className="flex-1 resize-none rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-xs md:text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/70"
                placeholder="Type a message..."
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl bg-violet-500 px-4 py-2 text-xs md:text-sm font-medium text-white shadow hover:bg-violet-400 transition-colors"
              >
                Send
              </button>
            </form>
            <p className="mt-2 text-[10px] text-slate-400/80">
              Messages stay inside RockEnMyVibe and are only visible to participants in this thread.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
