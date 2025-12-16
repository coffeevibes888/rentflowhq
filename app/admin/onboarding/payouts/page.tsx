import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth-guard';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';
import PayoutsConnectButton from '@/components/admin/payouts-connect-button';

export const metadata: Metadata = {
  title: 'Connect payouts',
};

const PayoutsOnboardingPage = async () => {
  await requireAdmin();

  const landlordResult = await getOrCreateCurrentLandlord();
  const landlordName = landlordResult.success ? landlordResult.landlord.name : 'your properties';
  const hasStripeAccount = Boolean(landlordResult.success && landlordResult.landlord.stripeConnectAccountId);

  const currentStep = 4;
  const totalSteps = 4;
  const progressPercent = Math.round((currentStep / totalSteps) * 100);

  return (
    <main className='w-full px-4 py-8 md:px-0'>
      <div className='max-w-4xl mx-auto space-y-8'>
        <section className='space-y-4'>
          <div className='space-y-2'>
            <p className='text-xs font-semibold tracking-wide text-emerald-600 uppercase'>
              Setup progress
            </p>
            <div className='flex items-center justify-between gap-4'>
              <h1 className='text-2xl md:text-3xl font-semibold text-slate-900'>
                Connect payouts for {landlordName}
              </h1>
              <span className='text-xs md:text-sm font-medium text-slate-600 whitespace-nowrap'>
                Step {currentStep} of {totalSteps}
              </span>
            </div>
            <p className='text-sm md:text-base text-slate-600 max-w-2xl'>
              Link your bank account using Stripe so rent payments can flow directly to you. This keeps
              tenant payments secure and separates your payouts from our platform.
            </p>
          </div>
          <div className='w-full rounded-full bg-slate-200 h-3 overflow-hidden'>
            <div
              className='h-3 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all'
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className='flex items-center justify-between text-[11px] md:text-xs text-slate-500'>
            <span>Profile</span>
            <span>Property</span>
            <span>Tenants</span>
            <span className='font-semibold text-emerald-600'>Payouts</span>
          </div>
        </section>

        <section className='rounded-3xl border border-slate-200 bg-white shadow-sm px-4 py-5 md:px-6 md:py-6 space-y-4'>
          <h2 className='text-lg md:text-xl font-semibold text-slate-900'>
            {hasStripeAccount ? 'Payouts are almost ready' : 'Get ready to connect Stripe payouts'}
          </h2>
          <p className='text-sm md:text-base text-slate-600'>
            We partner with a regulated payments provider to securely route tenant rent payments to your
            bank account. To receive payouts, you&apos;ll complete a secure verification flow inside this app.
          </p>
          <ul className='list-disc list-inside text-sm md:text-base text-slate-600 space-y-1'>
            <li>You&apos;ll confirm your business or individual details.</li>
            <li>You&apos;ll add a bank account (standard payouts) and/or a debit card (instant cashouts).</li>
            <li>You can return here any time from Settings to review payout status.</li>
          </ul>
          <div className='pt-3 flex flex-wrap items-center gap-3 text-sm'>
            <PayoutsConnectButton />
            <span className='text-[11px] text-slate-500'>
              We&apos;ll keep you on this site and talk to Stripe securely in the background.
            </span>
          </div>
        </section>
      </div>
    </main>
  );
};

export default PayoutsOnboardingPage;
