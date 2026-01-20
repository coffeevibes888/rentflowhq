'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  Check, 
  Zap, 
  Building2, 
  Crown, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

const tiers = [
  {
    id: 'starter',
    name: 'Starter',
    price: 19.99,
    description: 'Perfect for small landlords.',
    unitLimit: 'Up to 24 units',
    icon: Building2,
    popular: false,
    comingSoon: false,
    features: [
      { name: 'Up to 24 units', included: true },
      { name: 'Online rent collection', included: true },
      { name: 'Custom Subdomain (yourname.propertyflowhq.com)', included: true },
      { name: 'Maintenance Ticket System', included: true },
      { name: 'Digital leases with E-Sign', included: true },
      { name: 'Contractor Marketplace', included: true },
      { name: 'Basic Reporting', included: true },
      { name: 'Automated Application Process', included: true },
      { name: 'Free Lease Builder', included: true },
      { name: 'ID & Paystub Scanner', included: true },
    ],
    cta: 'Start Free with 7 day free trial',
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-300',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 39.99,
    description: 'For growing landlords. The only tool that scales with you.',
    unitLimit: 'Up to 150 units',
    icon: Zap,
    popular: true,
    comingSoon: false,
    features: [
      { name: 'Everything in Starter', included: true },
      { name: 'Up to 150 units', included: true },
      { name: 'QuickBooks & TurboTax integration', included: true },
      { name: 'Automatic rent reminders', included: true },
      { name: 'Auto late fee charges', included: true },
      { name: 'Up to 5 team members', included: true },
      { name: 'Team management & Slack-like chat', included: true },
      { name: 'Advanced analytics & Reporting', included: true },
      { name: 'Priority support', included: true },
    ],
    cta: 'Start for free with a 7 day free trial',
    iconBg: 'bg-violet-500/20',
    iconColor: 'text-violet-300',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 79.99,
    description: 'Full-scale property management operations.',
    unitLimit: 'Unlimited units',
    icon: Crown,
    popular: false,
    comingSoon: false,
    features: [
      { name: 'Unlimited Units', included: true },
      { name: 'Everything in Pro', included: true },
      { name: 'Unlimited team members', included: true },
      { name: 'Advanced roles & permissions', included: true },
      { name: 'Shift scheduling & calendar', included: true },
      { name: 'Time tracking with GPS', included: true },
      { name: 'Timesheet approval workflow', included: true },
      { name: 'Performance reports', included: true },
      { name: 'Priority 24/7 support', included: true },
      { name: 'Dedicated account manager', included: true },
      { name: 'API access & webhooks', included: true },
      { name: 'Multi-property dashboard', included: true },
    ],
    cta: 'Start Free with 7 day free trial',
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-300',
  },
];

export default function PricingSection() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const handleTierClick = async (tierId: string) => {
    setLoadingTier(tierId);

    // Check if user is logged in
    if (status === 'authenticated' && session?.user) {
      // Check if user is a landlord/admin
      if (session.user.role === 'admin' || session.user.role === 'landlord') {
        // Already an admin, go to subscription selection page with suggested plan
        router.push(`/onboarding/landlord/subscription?plan=${tierId}`);
      } else {
        // User exists but not a landlord - redirect to sign-up to create landlord account
        // Pass the plan they clicked on as a suggestion
        router.push(`/sign-up?role=landlord&plan=${tierId}`);
      }
    } else {
      // Not logged in - go to sign up with suggested plan
      // They'll see it highlighted on the subscription page
      router.push(`/sign-up?role=landlord&plan=${tierId}`);
    }
    
    setLoadingTier(null);
  };

  return (
    <section id="pricing" className="w-full py-20 md:py-28 px-4 relative overflow-hidden scroll-mt-20 ">
      {/* Background effects */}
      <div className="absolute inset-0 " />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-500/10 rounded-full blur-3xl" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center space-y-4 mb-16 animate-in fade-in duration-700">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-slate-900 text-sm font-medium border border-black bg-white">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <span className='text-black font-bold'>Simple, Transparent Pricing</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-black">
            Start at Just $19.99/month. Scales as You Grow.
          </h2>
          <p className="text-lg text-black font-semibold max-w-2xl mx-auto">
            Finally an Automation Tool that saves you time and money. Let's face it your time is valuable.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-8 lg:grid-cols-3 lg:gap-6 max-w-6xl mx-auto">
          {tiers.map((tier, index) => {
            const Icon = tier.icon;
            const isPopular = tier.popular;
            
            return (
              <div
                key={tier.id}
                className={`relative group rounded-2xl border border-black bg-gradient-to-r from-cyan-600 via-blue-500 to-violet-600 shadow-2xl p-8 flex flex-col transition-all duration-300 animate-in fade-in slide-in-from-bottom hover:scale-105 ${
                  isPopular 
                    ? 'scale-105 lg:scale-110 z-10' 
                    : ''
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Popular badge */}
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                    <div className="bg-gradient-to-r from-violet-500 to-purple-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg shadow-violet-500/50 flex items-center gap-1.5">
                      <Zap className="h-3 w-3" />
                      MOST POPULAR
                    </div>
                  </div>
                )}

                {/* Tier header */}
                <div className={`flex items-center gap-3 mb-4 ${isPopular ? 'pt-2' : ''}`}>
                  <div className={`rounded-xl ${tier.iconBg} p-3 border border-white/20`}>
                    <Icon className={`h-6 w-6 text-white`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{tier.name}</h3>
                    <p className="text-xs text-white font-semibold">{tier.unitLimit}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-4">
                  {tier.price !== null ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-white">${tier.price}</span>
                      <span className="text-white font-semibold">/month</span>
                    </div>
                  ) : (
                    <div className="text-2xl font-bold text-white">Custom Pricing</div>
                  )}
                </div>

                <p className="text-sm text-white font-semibold mb-6">{tier.description}</p>

                {/* CTA Button */}
                <button
                  onClick={() => !tier.comingSoon && handleTierClick(tier.id)}
                  disabled={loadingTier === tier.id || tier.comingSoon}
                  className={`w-full py-3.5 px-6 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 mb-8 ${
                    tier.comingSoon
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : isPopular
                      ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:from-violet-400 hover:to-purple-400 shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-105'
                    : tier.id === 'enterprise'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400'
                    : tier.id === 'starter'
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-400 hover:to-cyan-400 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105'
                      : 'bg-slate-900 text-white hover:bg-slate-800 border border-slate-900'
                  }`}
                >
                  {loadingTier === tier.id ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : tier.comingSoon ? (
                    <>
                      {tier.cta}
                    </>
                  ) : (
                    <>
                      {tier.cta}
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                {/* Features list */}
                <div className="flex-1">
                  <p className="text-xs font-bold text-white uppercase tracking-wider mb-4">
                    What's included
                  </p>
                  <ul className="space-y-3">
                    {tier.features.map((feature, i) => (
                      <li 
                        key={i} 
                        className={`flex items-start gap-3 text-sm ${
                          feature.included ? 'text-white font-semibold' : 'text-white/60'
                        }`}
                      >
                        <div className={`mt-0.5 rounded-full p-0.5 ${
                          feature.included 
                            ? 'bg-white/20 text-white' 
                            : 'bg-white/10 text-white/40'
                        }`}>
                          <Check className="h-3.5 w-3.5" />
                        </div>
                        <span className={feature.included ? '' : 'line-through'}>{feature.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom note */}
        <div className="mt-16 text-center">
          <p className="text-black text-sm">
            All plans include SSL security, 99.9% uptime, and 24/7 monitoring.
            <br />
            <span className="text-slate-500">Questions? </span>
            <a href="/contact" className="text-blue-800 hover:text-violet-300 underline underline-offset-2">
              Talk to our team
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
