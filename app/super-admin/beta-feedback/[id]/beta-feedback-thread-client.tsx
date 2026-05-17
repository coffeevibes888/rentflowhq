'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Clock,
  Loader2,
  Lock,
  Mail,
  MessageCircle,
  Send,
  Shield,
  Star,
  User as UserIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  postBetaFeedbackReply,
  updateBetaFeedbackStatus,
} from '@/lib/actions/super-admin-beta.actions';

type Thread = Awaited<ReturnType<typeof import('@/lib/actions/super-admin-beta.actions').getBetaFeedbackThread>>;

interface Props {
  thread: NonNullable<Thread>;
}

const STATUSES = ['new', 'in_review', 'replied', 'resolved', 'archived'] as const;
const PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

export function BetaFeedbackThreadClient({ thread }: Props) {
  const router = useRouter();
  const { toast } = useToast();

  const [reply, setReply] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [pendingReply, startReply] = useTransition();
  const [pendingNote, startNote] = useTransition();
  const [pendingStatus, startStatus] = useTransition();

  const onReply = () => {
    startReply(async () => {
      const result = await postBetaFeedbackReply(thread.id, reply);
      if (!result.success) {
        toast({ title: 'Reply failed', description: result.message, variant: 'destructive' });
        return;
      }
      setReply('');
      toast({ title: 'Reply sent to tester' });
      router.refresh();
    });
  };

  const onInternalNote = () => {
    startNote(async () => {
      const result = await postBetaFeedbackReply(thread.id, internalNote, { isInternal: true });
      if (!result.success) {
        toast({ title: 'Note failed', description: result.message, variant: 'destructive' });
        return;
      }
      setInternalNote('');
      toast({ title: 'Internal note added' });
      router.refresh();
    });
  };

  const onPatch = (patch: Parameters<typeof updateBetaFeedbackStatus>[1]) => {
    startStatus(async () => {
      const result = await updateBetaFeedbackStatus(thread.id, patch);
      if (!result.success) {
        toast({ title: 'Update failed', description: result.message, variant: 'destructive' });
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className='space-y-4'>
      {/* Header */}
      <Card className='bg-white text-slate-900'>
        <CardHeader>
          <div className='flex flex-wrap items-start gap-3 justify-between'>
            <div className='flex-1'>
              <div className='flex flex-wrap items-center gap-2 text-xs'>
                <Badge className='bg-slate-900 text-white'>
                  {thread.audience === 'pm' ? 'PM' : 'Contractor'}
                </Badge>
                <Badge className='bg-violet-100 text-violet-800 border-violet-200 capitalize'>
                  {thread.category}
                </Badge>
                <Badge className='bg-blue-100 text-blue-800 border-blue-200 capitalize'>
                  {thread.status.replace('_', ' ')}
                </Badge>
                <Badge className='bg-rose-100 text-rose-800 border-rose-200 capitalize'>
                  {thread.priority} priority
                </Badge>
                {thread.isFeaturedTestimonial && (
                  <Badge className='bg-amber-100 text-amber-800 border-amber-200'>
                    <Star className='h-3 w-3 mr-1' /> Featured
                  </Badge>
                )}
                {thread.consentToUseInMarketing && (
                  <Badge className='bg-emerald-100 text-emerald-800 border-emerald-200'>
                    Marketing consent
                  </Badge>
                )}
                {typeof thread.npsScore === 'number' && (
                  <Badge className='bg-blue-100 text-blue-800 border-blue-200'>
                    NPS {thread.npsScore}
                  </Badge>
                )}
              </div>
              <CardTitle className='text-xl mt-2'>{thread.subject}</CardTitle>
              <div className='text-xs text-slate-500 mt-1'>
                Submitted {formatDateTime(thread.createdAt)}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-slate-700 whitespace-pre-wrap'>{thread.body}</p>
          {thread.attachments?.length ? (
            <div className='mt-3 flex flex-wrap gap-2'>
              {thread.attachments.map((a, i) => (
                <a
                  key={i}
                  href={a}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-xs text-blue-600 underline'
                >
                  Attachment {i + 1}
                </a>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Tester info + actions */}
      <div className='grid lg:grid-cols-3 gap-3'>
        <Card className='bg-white text-slate-900 lg:col-span-1'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-base'>
              <UserIcon className='h-4 w-4' /> Tester
            </CardTitle>
          </CardHeader>
          <CardContent className='text-sm space-y-2'>
            <div>
              <div className='font-semibold'>{thread.tester.userName ?? 'Unknown'}</div>
              <a
                className='inline-flex items-center gap-1 text-blue-600 text-xs'
                href={`mailto:${thread.tester.userEmail ?? ''}`}
              >
                <Mail className='h-3 w-3' /> {thread.tester.userEmail}
              </a>
            </div>
            <div className='text-xs text-slate-600 space-y-0.5'>
              <div>
                Code: <span className='font-mono'>{thread.tester.programCode}</span>
              </div>
              <div>Free until {formatDateTime(thread.tester.freePeriodEnd)}</div>
              <div>
                Discount {thread.tester.discountPercent}% × {thread.tester.discountMonths} mo until{' '}
                {formatDateTime(thread.tester.discountPeriodEnd)}
              </div>
              {typeof thread.tester.lastNps === 'number' && (
                <div>Last NPS: {thread.tester.lastNps}</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className='bg-white text-slate-900 lg:col-span-2'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-base'>
              <Shield className='h-4 w-4' /> Admin actions
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div className='grid sm:grid-cols-2 gap-3'>
              <div>
                <label className='text-xs font-semibold text-slate-700'>Status</label>
                <Select
                  value={thread.status}
                  onValueChange={(v) => onPatch({ status: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className='text-xs font-semibold text-slate-700'>Priority</label>
                <Select
                  value={thread.priority}
                  onValueChange={(v) => onPatch({ priority: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <label className='flex items-center gap-2 text-sm text-slate-700'>
              <input
                type='checkbox'
                checked={thread.isFeaturedTestimonial}
                onChange={(e) => onPatch({ isFeaturedTestimonial: e.target.checked })}
                disabled={!thread.consentToUseInMarketing}
              />
              <Star className='h-4 w-4 text-amber-500' />
              Mark as featured testimonial
              {!thread.consentToUseInMarketing && (
                <span className='text-xs text-slate-500'>
                  (requires tester consent)
                </span>
              )}
            </label>
            {pendingStatus && (
              <div className='text-xs text-slate-500 inline-flex items-center gap-1'>
                <Loader2 className='h-3 w-3 animate-spin' /> Saving...
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Conversation thread */}
      <Card className='bg-white text-slate-900'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-base'>
            <MessageCircle className='h-4 w-4' /> Conversation
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          {thread.messages.length === 0 ? (
            <p className='text-sm text-slate-500'>No replies yet.</p>
          ) : (
            thread.messages.map((m) => (
              <div
                key={m.id}
                className={`rounded-lg p-3 border ${
                  m.isInternal
                    ? 'bg-amber-50 border-amber-200'
                    : m.senderRole === 'superAdmin'
                      ? 'bg-violet-50 border-violet-200'
                      : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className='text-xs font-semibold text-slate-700 flex items-center gap-2'>
                  {m.senderRole === 'superAdmin' ? (
                    <>
                      <Shield className='h-3 w-3' />
                      You {m.isInternal ? '(internal note)' : '(replied to tester)'}
                    </>
                  ) : (
                    <>
                      <UserIcon className='h-3 w-3' />
                      Tester
                    </>
                  )}
                  <span className='text-slate-500 font-normal'>
                    {formatDateTime(m.createdAt)}
                  </span>
                  {m.isInternal && (
                    <Badge className='bg-amber-100 text-amber-800 border-amber-200 ml-auto'>
                      <Lock className='h-3 w-3 mr-1' /> Internal
                    </Badge>
                  )}
                </div>
                <p className='text-sm text-slate-700 whitespace-pre-wrap mt-1'>{m.body}</p>
              </div>
            ))
          )}

          <div className='border-t pt-4 mt-4 space-y-2'>
            <div className='text-xs font-semibold text-slate-700 inline-flex items-center gap-1'>
              <Send className='h-3 w-3' /> Reply to tester
            </div>
            <Textarea
              rows={3}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder='Visible to the tester on their dashboard...'
              maxLength={5000}
            />
            <div className='flex justify-between items-center'>
              <span className='text-xs text-slate-500'>{reply.length}/5000</span>
              <Button
                onClick={onReply}
                disabled={pendingReply || reply.trim().length === 0}
                size='sm'
              >
                {pendingReply ? <Loader2 className='h-3.5 w-3.5 mr-2 animate-spin' /> : null}
                Send reply
              </Button>
            </div>
          </div>

          <div className='border-t pt-4 mt-4 space-y-2'>
            <div className='text-xs font-semibold text-slate-700 inline-flex items-center gap-1'>
              <Lock className='h-3 w-3' /> Internal note (only visible to admins)
            </div>
            <Textarea
              rows={2}
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              placeholder='Notes for the team only...'
              maxLength={5000}
            />
            <div className='flex justify-end'>
              <Button
                onClick={onInternalNote}
                disabled={pendingNote || internalNote.trim().length === 0}
                size='sm'
                variant='outline'
              >
                {pendingNote ? <Loader2 className='h-3.5 w-3.5 mr-2 animate-spin' /> : null}
                Add note
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer status indicator */}
      <div className='text-xs text-white/60 inline-flex items-center gap-2'>
        <Clock className='h-3 w-3' />
        Last updated {formatDateTime(thread.updatedAt)}
        {thread.resolvedAt && (
          <>
            <span>·</span>
            <CheckCircle2 className='h-3 w-3 text-emerald-400' />
            Resolved {formatDateTime(thread.resolvedAt)}
          </>
        )}
      </div>
    </div>
  );
}
