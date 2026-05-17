'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  CheckCircle2,
  Crown,
  Loader2,
  MessageCircle,
  Sparkles,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  redeemBetaCode,
  submitBetaFeedback,
  postBetaFeedbackReplyAsTester,
} from '@/lib/actions/beta-tester.actions';

export type Audience = 'pm' | 'contractor';

export interface BetaTesterRecord {
  id: string;
  audience: Audience;
  code: string;
  freePeriodStart: string;
  freePeriodEnd: string;
  discountPeriodEnd: string;
  discountPercent: number;
  discountMonths: number;
  redeemedAt: string;
}

export interface BetaFeedbackItem {
  id: string;
  audience: string;
  category: string;
  subject: string;
  body: string;
  npsScore: number | null;
  consentToUseInMarketing: boolean;
  status: string;
  isFeaturedTestimonial: boolean;
  createdAt: string;
  messages: Array<{
    id: string;
    senderRole: string;
    body: string;
    createdAt: string;
  }>;
}

export interface BetaProgramAvailability {
  maxRedemptions: number;
  redeemedCount: number;
  spotsRemaining: number;
  freeMonths: number;
  postFreeDiscountPercent: number;
  postFreeDiscountMonths: number;
  expiresAt: string | null;
}

interface BetaTestersPageProps {
  audience: Audience;
  testerRecord: BetaTesterRecord | null;
  feedback: BetaFeedbackItem[];
  programAvailability: BetaProgramAvailability | null;
  expectedCode: string; // e.g. 'BETAPM2026' — for the placeholder
}

const CATEGORY_LABELS: Record<string, { label: string; tone: string; description: string }> = {
  like: {
    label: 'What I like',
    tone: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    description: 'What is working well — be specific so we keep doing it.',
  },
  dislike: {
    label: "What I don't like",
    tone: 'bg-amber-100 text-amber-700 border-amber-200',
    description: 'Friction, confusion, or anything that slows you down.',
  },
  complaint: {
    label: 'Complaint',
    tone: 'bg-red-100 text-red-700 border-red-200',
    description: 'Something is broken or wrong. Be blunt.',
  },
  bug: {
    label: 'Bug',
    tone: 'bg-rose-100 text-rose-700 border-rose-200',
    description: 'Steps to reproduce, expected vs. actual, screenshots if helpful.',
  },
  feature: {
    label: 'Feature request',
    tone: 'bg-violet-100 text-violet-700 border-violet-200',
    description: 'Something missing that would change your day.',
  },
  testimonial: {
    label: 'Testimonial',
    tone: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    description:
      'Honest words we may use on the website, ads, or socials (only with your consent).',
  },
};

const STATUS_LABELS: Record<string, { label: string; tone: string }> = {
  new: { label: 'New', tone: 'bg-slate-100 text-slate-700' },
  in_review: { label: 'In review', tone: 'bg-blue-100 text-blue-700' },
  replied: { label: 'Reply from team', tone: 'bg-emerald-100 text-emerald-700' },
  resolved: { label: 'Resolved', tone: 'bg-emerald-100 text-emerald-700' },
  archived: { label: 'Archived', tone: 'bg-gray-100 text-gray-600' },
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

export function BetaTestersPage(props: BetaTestersPageProps) {
  const { audience, testerRecord, feedback, programAvailability, expectedCode } = props;

  if (!testerRecord) {
    return (
      <div className='space-y-4'>
        <PageHeader audience={audience} />
        <RedeemPanel
          expectedCode={expectedCode}
          programAvailability={programAvailability}
          audience={audience}
        />
        <ProgramExplanation />
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <PageHeader audience={audience} testerRecord={testerRecord} />
      <FeedbackSubmitForm audience={audience} />
      <FeedbackHistory feedback={feedback} />
    </div>
  );
}

function PageHeader({
  audience,
  testerRecord,
}: {
  audience: Audience;
  testerRecord?: BetaTesterRecord;
}) {
  const audienceLabel = audience === 'pm' ? 'Property Manager' : 'Contractor';
  return (
    <div className='relative rounded-xl border-2 border-black shadow-xl overflow-hidden'>
      <div className='absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-600' />
      <div className='relative p-4 sm:p-6'>
        <div className='flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3'>
          <div className='flex-1'>
            <div className='inline-flex items-center gap-2 text-white/90 text-xs uppercase tracking-wide font-bold'>
              <Sparkles className='h-4 w-4' />
              {audienceLabel} Beta Program
            </div>
            <h1 className='text-2xl sm:text-3xl font-bold text-white mt-1'>
              {testerRecord ? 'You are in. Welcome to the inside.' : 'Become a beta tester'}
            </h1>
            <p className='text-sm text-white/80 mt-1 max-w-2xl'>
              {testerRecord
                ? 'You agreed to share honest, unfiltered feedback so we can build the right thing for you. The team reads every entry.'
                : 'A small group of operators getting Enterprise free for two months in exchange for honest feedback we can use anywhere.'}
            </p>
          </div>
          {testerRecord && (
            <div className='rounded-lg border border-white/30 bg-white/15 px-3 py-2 text-white text-xs sm:text-sm'>
              <div className='flex items-center gap-2 font-semibold'>
                <Crown className='h-4 w-4' />
                Free Enterprise through {formatDate(testerRecord.freePeriodEnd)}
              </div>
              <div className='text-white/80 mt-0.5'>
                Then {testerRecord.discountPercent}% off through{' '}
                {formatDate(testerRecord.discountPeriodEnd)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RedeemPanel({
  expectedCode,
  programAvailability,
  audience,
}: {
  expectedCode: string;
  programAvailability: BetaProgramAvailability | null;
  audience: Audience;
}) {
  const [code, setCode] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const sold = programAvailability?.spotsRemaining === 0;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await redeemBetaCode(code);
      if (!result.success) {
        setError(result.message);
        return;
      }
      toast({ title: 'Welcome to the beta', description: result.message });
      router.refresh();
    });
  };

  return (
    <Card className='border-2 border-black'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Star className='h-5 w-5 text-amber-500' />
          Redeem your beta code
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {programAvailability ? (
          <div className='flex flex-wrap items-center gap-2 text-sm text-gray-600'>
            <Badge className='bg-violet-100 text-violet-700 border-violet-200'>
              {programAvailability.spotsRemaining} of {programAvailability.maxRedemptions} spots
              left
            </Badge>
            <span>
              {programAvailability.freeMonths} months free Enterprise · then{' '}
              {programAvailability.postFreeDiscountPercent}% off for{' '}
              {programAvailability.postFreeDiscountMonths} months
            </span>
          </div>
        ) : (
          <div className='text-sm text-gray-500'>The program is being set up.</div>
        )}

        {sold && (
          <div className='rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 flex items-start gap-2'>
            <AlertCircle className='h-4 w-4 mt-0.5' />
            <span>
              All {programAvailability?.maxRedemptions} {audience === 'pm' ? 'PM' : 'contractor'}{' '}
              beta spots are taken.
            </span>
          </div>
        )}

        <form onSubmit={onSubmit} className='space-y-3'>
          <div className='space-y-1.5'>
            <Label htmlFor='beta-code'>Beta code</Label>
            <Input
              id='beta-code'
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder={expectedCode}
              autoComplete='off'
              spellCheck={false}
              className='font-mono uppercase tracking-wider'
              disabled={sold || pending}
            />
          </div>
          {error && (
            <div className='rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 flex items-start gap-2'>
              <AlertCircle className='h-4 w-4 mt-0.5' />
              <span>{error}</span>
            </div>
          )}
          <Button type='submit' disabled={sold || pending || !code.trim()} className='w-full sm:w-auto'>
            {pending ? <Loader2 className='h-4 w-4 mr-2 animate-spin' /> : null}
            Redeem code
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ProgramExplanation() {
  return (
    <Card className='border-2 border-black'>
      <CardHeader>
        <CardTitle>What you sign up for</CardTitle>
      </CardHeader>
      <CardContent className='space-y-3 text-sm text-gray-700'>
        <p>
          <strong>2 months free Enterprise.</strong> Every paid feature is unlocked the moment you
          redeem.
        </p>
        <p>
          <strong>35% off for the next 24 months.</strong> Once the free period ends, your next two
          years run at a 35% discount as long as you stay subscribed.
        </p>
        <p>
          <strong>Honest feedback, every time.</strong> Submit complaints, things you like and
          don&apos;t like, bugs, feature requests, and testimonials whenever something hits you.
          The team reads everything and replies on this page.
        </p>
        <p className='text-xs text-gray-500'>
          We may use feedback you mark as a testimonial on our website, ads, and social channels.
          Anything not marked as a testimonial stays internal.
        </p>
      </CardContent>
    </Card>
  );
}

function FeedbackSubmitForm({ audience }: { audience: Audience }) {
  const [category, setCategory] = useState<keyof typeof CATEGORY_LABELS>('like');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [nps, setNps] = useState<string>('');
  const [consent, setConsent] = useState(false);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const npsScore = nps === '' ? null : Number(nps);
    startTransition(async () => {
      const result = await submitBetaFeedback({
        category,
        subject,
        body,
        npsScore,
        consentToUseInMarketing: consent,
      });
      if (!result.success) {
        toast({ title: 'Submission failed', description: result.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'Feedback submitted', description: 'Thanks for the honesty.' });
      setSubject('');
      setBody('');
      setNps('');
      setConsent(false);
      router.refresh();
    });
  };

  const cfg = CATEGORY_LABELS[category];

  return (
    <Card className='border-2 border-black'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <MessageCircle className='h-5 w-5' />
          Submit feedback ({audience === 'pm' ? 'PM side' : 'Contractor side'})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className='space-y-4'>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div className='space-y-1.5'>
              <Label>Category</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as keyof typeof CATEGORY_LABELS)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([key, val]) => (
                    <SelectItem key={key} value={key}>
                      {val.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className='text-xs text-gray-500'>{cfg.description}</p>
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='nps-score'>NPS (0–10, optional)</Label>
              <Input
                id='nps-score'
                type='number'
                min={0}
                max={10}
                value={nps}
                onChange={(e) => setNps(e.target.value)}
                placeholder='How likely to recommend?'
              />
              <p className='text-xs text-gray-500'>
                0 = would not recommend, 10 = would recommend without hesitation.
              </p>
            </div>
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='feedback-subject'>Subject</Label>
            <Input
              id='feedback-subject'
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder='One line summary'
              maxLength={200}
            />
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='feedback-body'>Details</Label>
            <Textarea
              id='feedback-body'
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder='Be specific. Honest is more useful than polite.'
              rows={6}
              maxLength={5000}
            />
            <div className='flex justify-between text-xs text-gray-500'>
              <span>Markdown is fine but not required.</span>
              <span>{body.length}/5000</span>
            </div>
          </div>

          <label className='flex items-start gap-2 text-sm text-gray-700 cursor-pointer'>
            <input
              type='checkbox'
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className='mt-1'
            />
            <span>
              <strong>Use this as a testimonial.</strong> I agree that PropertyFlowHQ may use this
              feedback (verbatim or edited for length) on the website, in ads, or on social media
              for any purpose. I confirm it&apos;s my own honest opinion.
            </span>
          </label>

          <div className='flex justify-end'>
            <Button type='submit' disabled={pending || subject.trim().length < 3 || body.trim().length < 10}>
              {pending ? <Loader2 className='h-4 w-4 mr-2 animate-spin' /> : null}
              Send feedback
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function FeedbackHistory({ feedback }: { feedback: BetaFeedbackItem[] }) {
  if (feedback.length === 0) {
    return (
      <Card className='border-2 border-black'>
        <CardContent className='p-6 text-center text-sm text-gray-500'>
          You haven&apos;t submitted any feedback yet. Tell us what&apos;s on your mind above.
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className='border-2 border-black'>
      <CardHeader>
        <CardTitle>Your feedback history</CardTitle>
      </CardHeader>
      <CardContent className='space-y-3'>
        {feedback.map((item) => (
          <FeedbackEntry key={item.id} item={item} />
        ))}
      </CardContent>
    </Card>
  );
}

function FeedbackEntry({ item }: { item: BetaFeedbackItem }) {
  const [reply, setReply] = useState('');
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const cat = CATEGORY_LABELS[item.category] ?? {
    label: item.category,
    tone: 'bg-gray-100 text-gray-700 border-gray-200',
    description: '',
  };
  const status = STATUS_LABELS[item.status] ?? { label: item.status, tone: 'bg-gray-100 text-gray-700' };

  const onReply = () => {
    startTransition(async () => {
      const result = await postBetaFeedbackReplyAsTester(item.id, reply);
      if (!result.success) {
        toast({ title: 'Could not send', description: result.message, variant: 'destructive' });
        return;
      }
      setReply('');
      toast({ title: 'Reply sent' });
      router.refresh();
    });
  };

  return (
    <div className='rounded-lg border border-gray-200 bg-white p-4'>
      <div className='flex flex-wrap items-center gap-2 text-xs'>
        <Badge className={cat.tone}>{cat.label}</Badge>
        <Badge className={status.tone}>{status.label}</Badge>
        {item.isFeaturedTestimonial && (
          <Badge className='bg-amber-100 text-amber-800 border-amber-200'>
            <Star className='h-3 w-3 mr-1' />
            Featured testimonial
          </Badge>
        )}
        {typeof item.npsScore === 'number' && (
          <Badge className='bg-blue-100 text-blue-700'>NPS {item.npsScore}</Badge>
        )}
        <span className='ml-auto text-gray-500'>{formatDateTime(item.createdAt)}</span>
      </div>
      <h4 className='font-semibold text-gray-900 mt-2'>{item.subject}</h4>
      <p className='text-sm text-gray-700 whitespace-pre-wrap mt-1'>{item.body}</p>

      {item.consentToUseInMarketing && (
        <div className='mt-2 text-xs text-emerald-700 inline-flex items-center gap-1'>
          <CheckCircle2 className='h-3 w-3' />
          Cleared for marketing use
        </div>
      )}

      {item.messages.length > 0 && (
        <div className='mt-3 space-y-2 border-l-2 border-violet-200 pl-3'>
          {item.messages.map((m) => (
            <div key={m.id} className='text-sm'>
              <div className='flex items-center gap-2 text-xs text-gray-500'>
                <span className='font-semibold'>
                  {m.senderRole === 'superAdmin' ? 'PropertyFlowHQ team' : 'You'}
                </span>
                <span>·</span>
                <span>{formatDateTime(m.createdAt)}</span>
              </div>
              <p className='text-gray-700 whitespace-pre-wrap'>{m.body}</p>
            </div>
          ))}
        </div>
      )}

      <div className='mt-3 space-y-2'>
        <Textarea
          rows={2}
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder='Reply to the team...'
          maxLength={5000}
        />
        <div className='flex justify-end'>
          <Button size='sm' onClick={onReply} disabled={pending || reply.trim().length === 0}>
            {pending ? <Loader2 className='h-3.5 w-3.5 mr-2 animate-spin' /> : null}
            Send reply
          </Button>
        </div>
      </div>
    </div>
  );
}
