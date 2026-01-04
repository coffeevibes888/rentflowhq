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
    price: 9.99,
    description: 'Perfect for small landlords.',
    unitLimit: 'Up to 24 units',
    icon: Building2,
    popular: false,
    features: [
      { name: 'Up to 24 units', included: true },
      { name: 'Online rent collection', included: true },
      { name: 'Your own branded tenant portal', included: true },
      { name: 'Custom Subdomain (yourname.propertyflowhq.com)', included: true },
      { name: 'Maintenance Ticket System', included: true },
      { name: 'Digital leases with E-Sign', included: true },
      { name: 'Contractor Marketplace (Free, $1 per payment)', included: true },
      { name: 'Basic Reporting', included: true },
      { name: 'Automated Application Process', included: true },
      { name: 'Free Lease Builder', included: true },
    ],
    cta: 'Start Free with 7 day free trial',
    iconBg: 'bg-slate-500/20',
    iconColor: 'text-slate-300',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 19.99,
    description: 'For growing landlords. The only tool that scales with you.',
    unitLimit: 'Up to 75 units',
    icon: Zap,
    popular: true,
    features: [
      { name: 'Everything in Free', included: true },
      { name: 'Up to 75 units', included: true },
      { name: 'QuickBooks & TurboTax integration', included: true },
      { name: 'Automatic rent reminders', included: true },
      { name: 'Auto late fee charges', included: true },
      { name: 'Up to 5 team members', included: true },
      { name: 'Team management & Slack-like chat', included: true },
      { name: 'ID & Paystub Scanner', included: true },
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
    price: 39.99,
    description: 'Full-scale property management operations.',
    unitLimit: 'Unlimited units',
    icon: Crown,
    popular: false,
    features: [
      { name: 'Unlimited Units', included: true },
      { name: 'Everything in Pro', included: true },
      { name: 'Unlimited team members', included: true },
      { name: 'Shift scheduling & calendar', included: true },
      { name: 'Time tracking with GPS', included: true },
      { name: 'Timesheet approval workflow', included: true },
      { name: 'Team payroll from wallet', included: true },
      { name: 'Performance reports', included: true },
      { name: 'Custom branding & white-label', included: true },
      { name: 'Custom domain support', included: true },
      { name: 'API access & webhooks', included: true },
      { name: 'Hiring Emplyees and posting jobs', included: true },
    ],
    cta: 'Start For Free with 7 day free trial',
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
        // Already an admin, go to subscription checkout or dashboard
        if (tierId === 'starter') {
          router.push('/admin/overview');
        } else {
          // Redirect to subscription checkout page
          router.push(`/admin/settings/subscription?upgrade=${tierId}`);
        }
      } else {
        // User exists but not a landlord - redirect to sign-up to create landlord account
        router.push(`/sign-up?plan=${tierId}&role=landlord`);
      }
    } else {
      // Not logged in - go to sign up with plan parameter
      router.push(`/sign-up?plan=${tierId}&role=landlord`);
    }
    
    setLoadingTier(null);
  };

  return (
    <section id="pricing" className="w-full py-20 md:py-28 px-4 relative overflow-hidden scroll-mt-20">
      {/* Background effects */}
      <div className="absolute inset-0 " />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-500/10 rounded-full blur-3xl" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center space-y-4 mb-16 animate-in fade-in duration-700">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-violet-300 text-sm font-medium border border-violet-500/20">
            <Sparkles className="h-4 w-4 text-blue-800" />
            <span className='text-blue-800'>Simple, Transparent Pricing</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Free for Small Landlords. Scales as You Grow.
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
                className={`relative group rounded-2xl border bg-slate-950/60 p-8 flex flex-col transition-all duration-300 animate-in fade-in slide-in-from-bottom ${
                  isPopular 
                    ? 'border-violet-500/50 hover:border-violet-500 scale-105 lg:scale-110 z-10' 
                    : 'border-white/10 hover:border-white/20'
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
                  <div className={`rounded-xl ${tier.iconBg} p-3 border border-white/10`}>
                    <Icon className={`h-6 w-6 ${tier.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{tier.name}</h3>
                    <p className="text-xs text-slate-400">{tier.unitLimit}</p>
                  </div>
                </div>

                  {/* Price */}
                  <div className="mb-4">
                    {tier.price !== null ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-white">${tier.price}</span>
                        <span className="text-slate-400">/month</span>
                      </div>
                    ) : (
                      <div className="text-2xl font-bold text-white">Custom Pricing</div>
                    )}
                  </div>

                  <p className="text-sm text-slate-400 mb-6">{tier.description}</p>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleTierClick(tier.id)}
                    disabled={loadingTier === tier.id}
                    className={`w-full py-3.5 px-6 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 mb-8 ${
                      isPopular
                        ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:from-violet-400 hover:to-purple-400 shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-105'
                        : tier.id === 'enterprise'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400'
                        : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                    }`}
                  >
                    {loadingTier === tier.id ? (
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        {tier.cta}
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>

                  {/* Features list */}
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                      What's included
                    </p>
                    <ul className="space-y-3">
                      {tier.features.map((feature, i) => (
                        <li 
                          key={i} 
                          className={`flex items-start gap-3 text-sm ${
                            feature.included ? 'text-slate-200' : 'text-slate-500'
                          }`}
                        >
                          <div className={`mt-0.5 rounded-full p-0.5 ${
                            feature.included 
                              ? isPopular 
                                ? 'bg-violet-500/20 text-violet-400' 
                                : 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-slate-700 text-slate-500'
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

        {/* Competitor Comparison Table */}
        <div className="mt-20 animate-in fade-in duration-700">
          <div className="text-center space-y-4 mb-10">
            <h3 className="text-2xl md:text-3xl font-bold text-white">
              How We Compare to Competitors
            </h3>
            <p className="text-black font-semibold max-w-xl mx-auto">
              See why landlords are switching to Rent Flow HQ
            </p>
          </div>
          
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60 backdrop-blur-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 font-semibold text-white">Feature</th>
                  <th className="p-4 font-semibold text-violet-300 bg-violet-500/10">Rent Flow HQ</th>
                  <th className="p-4 font-semibold text-slate-300">Buildium<br/><span className="text-xs font-normal text-slate-500">$55-183/mo</span></th>
                  <th className="p-4 font-semibold text-slate-300">AppFolio<br/><span className="text-xs font-normal text-slate-500">$1.40/unit</span></th>
                  <th className="p-4 font-semibold text-slate-300">TurboTenant<br/><span className="text-xs font-normal text-slate-500">Free</span></th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-4 text-slate-200">Online Rent Collection</td>
                  <td className="p-4 text-center bg-violet-500/5"><span className="text-emerald-400 text-lg">✓</span></td>
                  <td className="p-4 text-center"><span className="text-emerald-400 text-lg">✓</span></td>
                  <td className="p-4 text-center"><span className="text-emerald-400 text-lg">✓</span></td>
                  <td className="p-4 text-center"><span className="text-emerald-400 text-lg">✓</span></td>
                </tr>
                <tr className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-4 text-slate-200">Maintenance Tickets</td>
                  <td className="p-4 text-center bg-violet-500/5"><span className="text-emerald-400 text-lg">✓</span></td>
                  <td className="p-4 text-center"><span className="text-emerald-400 text-lg">✓</span></td>
                  <td className="p-4 text-center"><span className="text-emerald-400 text-lg">✓</span></td>
                  <td className="p-4 text-center"><span className="text-emerald-400 text-lg">✓</span></td>
                </tr>
                <tr className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-4 text-slate-200">Digital Leases</td>
                  <td className="p-4 text-center bg-violet-500/5"><span className="text-emerald-400 text-lg">✓</span></td>
                  <td className="p-4 text-center"><span className="text-emerald-400 text-lg">✓</span></td>
                  <td className="p-4 text-center"><span className="text-emerald-400 text-lg">✓</span></td>
                  <td className="p-4 text-center text-amber-400 text-xs">Limited</td>
                </tr>
                <tr className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-4 text-slate-200">White-label Tenant Portal</td>
                  <td className="p-4 text-center bg-violet-500/5"><span className="text-emerald-400 text-lg">✓</span></td>
                  <td className="p-4 text-center"><span className="text-red-400 text-lg">✗</span></td>
                  <td className="p-4 text-center text-amber-400 text-xs">$$ Extra</td>
                  <td className="p-4 text-center"><span className="text-red-400 text-lg">✗</span></td>
                </tr>
                <tr className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-4 text-slate-200">Team Chat</td>
                  <td className="p-4 text-center bg-violet-500/5"><span className="text-emerald-400 text-lg">✓</span> <span className="text-xs text-slate-400">(Pro)</span></td>
                  <td className="p-4 text-center"><span className="text-red-400 text-lg">✗</span></td>
                  <td className="p-4 text-center"><span className="text-red-400 text-lg">✗</span></td>
                  <td className="p-4 text-center"><span className="text-red-400 text-lg">✗</span></td>
                </tr>
                <tr className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-4 text-slate-200">Contractor Management</td>
                  <td className="p-4 text-center bg-violet-500/5"><span className="text-emerald-400 text-lg">✓</span> <span className="text-xs text-slate-400">($1/payment)</span></td>
                  <td className="p-4 text-center text-amber-400 text-xs">$ Extra</td>
                  <td className="p-4 text-center"><span className="text-emerald-400 text-lg">✓</span></td>
                  <td className="p-4 text-center"><span className="text-red-400 text-lg">✗</span></td>
                </tr>
                <tr className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-4 text-slate-200">Shift Scheduling</td>
                  <td className="p-4 text-center bg-violet-500/5"><span className="text-emerald-400 text-lg">✓</span> <span className="text-xs text-slate-400">(Enterprise)</span></td>
                  <td className="p-4 text-center"><span className="text-red-400 text-lg">✗</span></td>
                  <td className="p-4 text-center"><span className="text-red-400 text-lg">✗</span></td>
                  <td className="p-4 text-center"><span className="text-red-400 text-lg">✗</span></td>
                </tr>
                <tr className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-4 text-slate-200">Time Tracking & Payroll</td>
                  <td className="p-4 text-center bg-violet-500/5"><span className="text-emerald-400 text-lg">✓</span> <span className="text-xs text-slate-400">(Enterprise)</span></td>
                  <td className="p-4 text-center"><span className="text-red-400 text-lg">✗</span></td>
                  <td className="p-4 text-center"><span className="text-red-400 text-lg">✗</span></td>
                  <td className="p-4 text-center"><span className="text-red-400 text-lg">✗</span></td>
                </tr>
                <tr className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-4 text-slate-200">Custom Subdomain</td>
                  <td className="p-4 text-center bg-violet-500/5"><span className="text-emerald-400 text-lg">✓</span></td>
                  <td className="p-4 text-center"><span className="text-red-400 text-lg">✗</span></td>
                  <td className="p-4 text-center"><span className="text-red-400 text-lg">✗</span></td>
                  <td className="p-4 text-center"><span className="text-red-400 text-lg">✗</span></td>
                </tr>
                <tr className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-4 text-slate-200">ID & Paystub Verification</td>
                  <td className="p-4 text-center bg-violet-500/5"><span className="text-emerald-400 text-lg">✓</span> <span className="text-xs text-slate-400">(Pro)</span></td>
                  <td className="p-4 text-center text-amber-400 text-xs">$$ Extra</td>
                  <td className="p-4 text-center text-amber-400 text-xs">$$ Extra</td>
                  <td className="p-4 text-center"><span className="text-red-400 text-lg">✗</span></td>
                </tr>
                <tr className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-4 text-slate-200">QuickBooks & TurboTax</td>
                  <td className="p-4 text-center bg-violet-500/5"><span className="text-emerald-400 text-lg">✓</span> <span className="text-xs text-slate-400">(Pro)</span></td>
                  <td className="p-4 text-center text-amber-400 text-xs">$$ Extra</td>
                  <td className="p-4 text-center"><span className="text-emerald-400 text-lg">✓</span></td>
                  <td className="p-4 text-center"><span className="text-red-400 text-lg">✗</span></td>
                </tr>
                <tr className="hover:bg-white/5">
                  <td className="p-4 text-slate-200 font-semibold">Price (24 units)</td>
                  <td className="p-4 text-center bg-violet-500/5 font-bold text-emerald-400">Free</td>
                  <td className="p-4 text-center text-slate-300">$55/mo</td>
                  <td className="p-4 text-center text-slate-300">$33.60/mo</td>
                  <td className="p-4 text-center text-slate-300">Free</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-black">
              Comparison based on publicly available pricing as of December 2024. Features may vary by plan.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
