'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Check, 
  Zap, 
  Building2, 
  Crown, 
  ArrowRight,
  Sparkles,
  Shield,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface SubscriptionSelectionClientProps {
  userName: string;
}

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
      'Up to 24 units',
      'Online rent collection',
      'Branded tenant portal',
      'Custom sub-domain',
      'Maintenance tickets',
      'Digital leases with E-Sign',
      'Contractor Marketplace',
      'Free Lease Builder',
      'ID & Paystub Scanner',
    ],
    iconBg: 'bg-slate-500/20',
    iconColor: 'text-slate-300',
    buttonStyle: 'bg-white/10 text-white hover:bg-white/20 border border-white/10',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 39.99,
    description: 'For growing portfolios.',
    unitLimit: 'Up to 150 units',
    icon: Zap,
    popular: true,
    comingSoon: false,
    features: [
      'Everything in Starter',
      'Up to 150 units',
      'QuickBooks & TurboTax Intergrations',
      'Auto rent reminders',
      'Auto late fee charges',
      'Up to 5 team members',
      'Team chat',
      'Advanced analytics',
    ],
    iconBg: 'bg-violet-500/20',
    iconColor: 'text-violet-300',
    buttonStyle: 'bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:from-violet-400 hover:to-purple-400 shadow-lg shadow-violet-500/30',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 79.99,
    description: 'Full-scale operations.',
    unitLimit: 'Unlimited units',
    icon: Crown,
    popular: false,
    comingSoon: true,
    features: [
      'Everything in Pro',
      'Unlimited units',
      'Unlimited team members',
      'Shift scheduling',
      'Time tracking with GPS',
      'Timesheet approvals',
      'Team payroll',
      'Custom branding',
      'API access',
    ],
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-300',
    buttonStyle: 'bg-slate-700 text-slate-400 cursor-not-allowed',
  },
];

export default function SubscriptionSelectionClient({ userName }: SubscriptionSelectionClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if user canceled checkout
  useEffect(() => {
    if (searchParams.get('canceled') === 'true') {
      setError('Checkout was canceled. Please select a plan to continue.');
    }
  }, [searchParams]);

  const handleSelectPlan = async (tierId: string) => {
    setLoadingTier(tierId);
    setError(null);

    try {
      const response = await fetch('/api/landlord/subscription/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: tierId }),
      });

      const data = await response.json();

      if (data.success && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setError(data.message || 'Failed to start checkout. Please try again.');
        setLoadingTier(null);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setLoadingTier(null);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center px-4 py-10">
      <div className="max-w-5xl w-full space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500/20 to-cyan-500/20 px-4 py-1.5 text-sm font-medium text-violet-300 ring-1 ring-violet-500/30">
            <Sparkles className="h-4 w-4" />
            Welcome, {userName.split(' ')[0]}!
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Choose your plan
          </h1>
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            All plans include a 7-day free trial. No credit card charged until trial ends.
          </p>
        </motion.div>

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center text-red-300 flex items-center justify-center gap-2"
          >
            <AlertCircle className="h-5 w-5" />
            {error}
          </motion.div>
        )}

        {/* Pricing Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid gap-6 lg:grid-cols-3"
        >
          {tiers.map((tier, index) => {
            const Icon = tier.icon;
            const isPopular = tier.popular;
            const isLoading = loadingTier === tier.id;
            
            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * index }}
                className={`relative group rounded-2xl border bg-slate-900/60 backdrop-blur-sm p-6 flex flex-col transition-all duration-300 ${
                  isPopular 
                    ? 'border-violet-500/50 hover:border-violet-500 ring-1 ring-violet-500/20' 
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                {/* Popular badge */}
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                    <div className="bg-gradient-to-r from-violet-500 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg shadow-violet-500/50 flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      MOST POPULAR
                    </div>
                  </div>
                )}

                {/* Tier header */}
                <div className={`flex items-center gap-3 mb-3 ${isPopular ? 'pt-2' : ''}`}>
                  <div className={`rounded-xl ${tier.iconBg} p-2.5 border border-white/10`}>
                    <Icon className={`h-5 w-5 ${tier.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{tier.name}</h3>
                    <p className="text-xs text-slate-400">{tier.unitLimit}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-3">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-white">${tier.price}</span>
                    <span className="text-slate-400 text-sm">/month</span>
                  </div>
                </div>

                <p className="text-sm text-slate-400 mb-4">{tier.description}</p>

                {/* CTA Button */}
                <button
                  onClick={() => !tier.comingSoon && handleSelectPlan(tier.id)}
                  disabled={loadingTier !== null || tier.comingSoon}
                  className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 mb-5 disabled:opacity-50 disabled:cursor-not-allowed ${tier.buttonStyle}`}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : tier.comingSoon ? (
                    <>
                      Coming Soon
                    </>
                  ) : (
                    <>
                      Start 7-Day Free Trial
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                {/* Features list */}
                <div className="flex-1">
                  <ul className="space-y-2">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <div className={`mt-0.5 rounded-full p-0.5 ${
                          isPopular 
                            ? 'bg-violet-500/20 text-violet-400' 
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          <Check className="h-3 w-3" />
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-6 pt-4"
        >
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Shield className="h-4 w-4 text-emerald-400" />
            <span>SSL Secured</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Check className="h-4 w-4 text-emerald-400" />
            <span>Cancel anytime</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span>No setup fees</span>
          </div>
        </motion.div>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center text-sm text-slate-500"
        >
          Questions? <a href="/contact" className="text-violet-400 hover:text-violet-300 underline underline-offset-2">Talk to our team</a>
        </motion.p>
      </div>
    </main>
  );
}
