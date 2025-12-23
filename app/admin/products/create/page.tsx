import { Metadata } from 'next';
import ProductForm from '@/components/admin/product-form';
import { requireAdmin } from '@/lib/auth-guard';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';
import { normalizeTier } from '@/lib/config/subscription-tiers';

export const metadata: Metadata = {
  title: 'Add Property',
};

const CreateProductPage = async () => {
  await requireAdmin();
  
  // Get landlord subscription tier
  const landlordResult = await getOrCreateCurrentLandlord();
  const landlordTier = landlordResult.success 
    ? normalizeTier(landlordResult.landlord.subscriptionTier) 
    : 'free';
  const isPro = landlordTier === 'pro' || landlordTier === 'enterprise';

  const currentStep = 2;
  const totalSteps = 4;
  const progressPercent = Math.round((currentStep / totalSteps) * 100);

  return (
    <main className='w-full px-4 py-6 md:px-0'>
      <div className='max-w-4xl mx-auto space-y-8'>
        <section className='space-y-4'>
          <div className='space-y-2'>
            <p className='text-xs font-semibold tracking-wide text-violet-300 uppercase'>
              Setup progress
            </p>
            <div className='flex items-center justify-between gap-4'>
              <h1 className='text-2xl md:text-3xl font-semibold text-white'>
                Add your first property
              </h1>
              <span className='text-xs md:text-sm font-medium text-slate-300 whitespace-nowrap'>
                Step {currentStep} of {totalSteps}
              </span>
            </div>
            <p className='text-sm md:text-base text-slate-300 max-w-2xl'>
              Tell us about your building or home so we can generate units, leases, and rent schedules
              automatically. You can change these details later.
            </p>
          </div>
          <div className='w-full rounded-full bg-white/10 h-3 overflow-hidden'>
            <div
              className='h-3 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all'
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className='flex items-center justify-between text-[11px] md:text-xs text-slate-400'>
            <span>Profile</span>
            <span className='font-semibold text-violet-300'>Property</span>
            <span>Tenants</span>
            <span>Payouts</span>
          </div>
        </section>

        <section className='rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-2xl px-4 py-5 md:px-6 md:py-6'>
          <h2 className='text-lg md:text-xl font-semibold text-white mb-4'>
            Property details
          </h2>
          <p className='text-sm md:text-base text-slate-300 mb-6'>
            Add the basics for this property. On the next steps you&apos;ll be able to review units, invite
            tenants, and connect rent payments.
          </p>
          <div className='my-4'>
            <ProductForm type='Create' isPro={isPro} />
          </div>
        </section>
      </div>
    </main>
  );
};

export default CreateProductPage;
