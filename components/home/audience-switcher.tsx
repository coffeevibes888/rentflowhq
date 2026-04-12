'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRight,
  DollarSign,
  Clock,
  FileText,
  MessageSquare,
  Users,
  Briefcase,
  Star,
  TrendingUp,
  CheckCircle,
  Zap,
  MapPin,
  Package,
  Calendar,
  CreditCard,
} from 'lucide-react';

type Audience = 'pm' | 'contractor';

const fadeSlide = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2, ease: 'easeIn' as const } },
};

// ─────────────────────────────────────────────
// PM DASHBOARD MOCK (existing hero graphic)
// ─────────────────────────────────────────────
function PMDashboardMock() {
  return (
    <div className="relative rounded-2xl md:rounded-3xl border border-black shadow-2xl overflow-hidden backdrop-blur-md animate-in fade-in slide-in-from-right duration-700 delay-200">
      <div className="absolute inset-0 bg-linear-to-r from-cyan-400 via-sky-400 to-blue-300" />
      <div className="relative p-4 md:p-6 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base md:text-xl font-bold text-white">Your Dashboard</h3>
        </div>
        <div className="grid grid-cols-3 gap-2 md:gap-3 mb-3">
          {[
            { label: 'Share Listings', sub: 'QR code, text, or email', value: 'Send Link' },
            { label: 'Invite Contractor', sub: 'QR code, text, or email', value: 'Send Link' },
            { label: 'Total Units', sub: '14 vacant', value: '149' },
          ].map((c) => (
            <div key={c.label} className="rounded-xl bg-gradient-to-r from-sky-500 via-cyan-300 to-sky-500 p-3 space-y-1 shadow-2xl border border-slate-100">
              <div className="text-[9px] md:text-[11px] text-black font-semibold">{c.label}</div>
              <div className="text-sm md:text-base font-bold text-slate-900">{c.value}</div>
              <div className="text-[8px] md:text-[10px] text-blue-800">{c.sub}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 md:gap-3 mb-3">
          {[
            { label: 'Rent This Month', value: '$36,000', sub: '75% collected' },
            { label: 'Maintenance', value: '3', sub: '1 urgent' },
            { label: 'Applications', value: '5', sub: 'Review now' },
          ].map((c) => (
            <div key={c.label} className="rounded-xl bg-gradient-to-r from-sky-500 via-cyan-200 to-sky-500 p-3 space-y-1 shadow-2xl border border-slate-100">
              <div className="text-[9px] md:text-[11px] text-black font-semibold">{c.label}</div>
              <div className="text-xl md:text-2xl font-bold text-slate-900">{c.value}</div>
              <div className="text-[8px] md:text-[10px] text-blue-800">{c.sub}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 md:gap-3 mb-3">
          {[
            { label: 'Available Balance', value: '$24,000', sub: 'Ready to cash out' },
            { label: 'Messages', value: '7', sub: 'Open inbox threads' },
          ].map((c) => (
            <div key={c.label} className="rounded-xl bg-gradient-to-r from-sky-500 via-cyan-200 to-sky-500 p-3 space-y-1 shadow-2xl border border-slate-100">
              <div className="text-[9px] md:text-[11px] text-black font-semibold">{c.label}</div>
              <div className="text-xl md:text-2xl font-bold text-slate-900">{c.value}</div>
              <div className="text-[8px] md:text-[10px] text-blue-800">{c.sub}</div>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-slate-200 p-3 bg-gradient-to-r from-sky-500 via-cyan-200 to-sky-500">
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: 'Occupied', value: '135' },
              { label: 'Tenants', value: '135' },
              { label: 'Rent YTD', value: '$432K' },
              { label: 'Properties', value: '12' },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-[9px] md:text-[10px] text-black font-semibold uppercase tracking-wide">{s.label}</div>
                <div className="text-base md:text-lg font-bold text-slate-900">{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// CONTRACTOR DASHBOARD MOCK
// ─────────────────────────────────────────────
function ContractorDashboardMock() {
  return (
    <div className="relative rounded-2xl md:rounded-3xl border border-rose-500/40 shadow-2xl overflow-hidden backdrop-blur-md animate-in fade-in slide-in-from-right duration-700 delay-200">
      <div className="absolute inset-0 bg-gradient-to-br from-rose-950 via-slate-900 to-slate-950" />
      <div className="relative p-4 md:p-6 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base md:text-xl font-bold text-white">Contractor Dashboard</h3>
          <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-1 rounded-full border border-rose-500/30 font-semibold">PRO</span>
        </div>

        {/* Top stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Active Jobs', value: '14', sub: '3 due today', color: 'from-rose-500/20 to-rose-600/10', border: 'border-rose-500/30', text: 'text-rose-300' },
            { label: 'Open Leads', value: '8', sub: '2 hot leads', color: 'from-amber-500/20 to-amber-600/10', border: 'border-amber-500/30', text: 'text-amber-300' },
            { label: 'Team Members', value: '5', sub: '4 clocked in', color: 'from-violet-500/20 to-violet-600/10', border: 'border-violet-500/30', text: 'text-violet-300' },
          ].map((c) => (
            <div key={c.label} className={`rounded-xl bg-gradient-to-br ${c.color} border ${c.border} p-3 space-y-1`}>
              <div className="text-[9px] md:text-[11px] text-slate-400 font-semibold">{c.label}</div>
              <div className={`text-xl md:text-2xl font-bold ${c.text}`}>{c.value}</div>
              <div className="text-[8px] md:text-[10px] text-slate-500">{c.sub}</div>
            </div>
          ))}
        </div>

        {/* Revenue row */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Revenue This Month', value: '$18,450', sub: '+12% vs last month', color: 'from-emerald-500/20 to-emerald-600/10', border: 'border-emerald-500/30', text: 'text-emerald-300' },
            { label: 'Unpaid Invoices', value: '$3,200', sub: '4 outstanding', color: 'from-orange-500/20 to-orange-600/10', border: 'border-orange-500/30', text: 'text-orange-300' },
          ].map((c) => (
            <div key={c.label} className={`rounded-xl bg-gradient-to-br ${c.color} border ${c.border} p-3 space-y-1`}>
              <div className="text-[9px] md:text-[11px] text-slate-400 font-semibold">{c.label}</div>
              <div className={`text-lg md:text-xl font-bold ${c.text}`}>{c.value}</div>
              <div className="text-[8px] md:text-[10px] text-slate-500">{c.sub}</div>
            </div>
          ))}
        </div>

        {/* Recent jobs */}
        <div className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-2">
          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Recent Jobs</div>
          {[
            { name: 'HVAC Repair — 412 Oak St', status: 'In Progress', color: 'text-amber-400' },
            { name: 'Plumbing — 88 Elm Ave', status: 'Completed', color: 'text-emerald-400' },
            { name: 'Electrical — 210 Pine Rd', status: 'Scheduled', color: 'text-blue-400' },
          ].map((j) => (
            <div key={j.name} className="flex items-center justify-between">
              <span className="text-[10px] md:text-xs text-white truncate max-w-[65%]">{j.name}</span>
              <span className={`text-[9px] font-bold ${j.color}`}>{j.status}</span>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="rounded-xl bg-white/5 border border-white/10 p-3">
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: 'Invoices', value: '31' },
              { label: 'Customers', value: '48' },
              { label: 'Avg Rating', value: '4.9★' },
              { label: 'Jobs YTD', value: '127' },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide">{s.label}</div>
                <div className="text-sm md:text-base font-bold text-white">{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PM FEATURES (pain points grid)
// ─────────────────────────────────────────────
function PMFeatures() {
  const points = [
    { icon: Clock, color: 'bg-red-500/20 border-red-500/30', iconColor: 'text-red-400', title: 'Late Rent Every Month', desc: 'Chasing tenants for payments, sending reminders, tracking who paid what...', solution: 'Automated online payments with Stripe' },
    { icon: MessageSquare, color: 'bg-amber-500/20 border-amber-500/30', iconColor: 'text-amber-400', title: 'Maintenance Request Chaos', desc: 'Texts, calls, emails scattered everywhere. No way to track what\'s urgent.', solution: 'Centralized ticket system with priority tracking' },
    { icon: FileText, color: 'bg-blue-500/20 border-blue-500/30', iconColor: 'text-blue-400', title: 'Spreadsheet Nightmare', desc: 'Properties, tenants, leases, payments—all in different files that never sync.', solution: 'Everything in one organized dashboard' },
    { icon: Users, color: 'bg-purple-500/20 border-purple-500/30', iconColor: 'text-purple-400', title: 'Application Management Chaos', desc: 'Paper applications, lost emails, no way to compare applicants side-by-side.', solution: 'Digital applications with organized approval workflow' },
    { icon: FileText, color: 'bg-cyan-500/20 border-cyan-500/30', iconColor: 'text-cyan-400', title: 'Lease Management Mess', desc: 'Printing, signing, scanning, storing leases. Renewals slip through the cracks.', solution: 'Digital leases with e-signatures & auto-renewal reminders' },
    { icon: DollarSign, color: 'bg-pink-500/20 border-pink-500/30', iconColor: 'text-pink-400', title: 'Expensive Software', desc: 'Most property management tools cost $50-200/month. Too much for small portfolios.', solution: 'Starts at $19.99/month. 14-day free trial.' },
  ];

  return (
    <section className="w-full md:py-10 px-3 md:px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2 animate-in fade-in duration-700">
          <h2 className="text-2xl md:text-4xl font-bold text-white">FINALLY A SOLUTION THAT YOU CAN TRUST</h2>
          <p className="text-sm md:text-lg text-black font-semibold max-w-2xl mx-auto">
            You didn't become a landlord to spend hours on admin work. Here's how we solve your biggest headaches.
          </p>
        </div>
        <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {points.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.title} className="group rounded-xl md:rounded-2xl border border-red-500/20 bg-gradient-to-r from-indigo-700 to-sky-600 p-6 space-y-4 transition-all duration-300 shadow-2xl">
                <div className="flex items-start gap-3">
                  <div className={`rounded-lg bg-red-500/20 p-2 border border-red-500/30`}>
                    <Icon className={`h-5 w-5 ${p.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-white mb-2">{p.title}</h3>
                    <p className="text-xs text-black font-semibold mb-3">{p.desc}</p>
                    <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold">
                      <ArrowRight className="h-3 w-3" />
                      <span>Solution: {p.solution}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// CONTRACTOR FEATURES (pain points grid)
// ─────────────────────────────────────────────
function ContractorFeatures() {
  const points = [
    { icon: Briefcase, iconColor: 'text-rose-400', title: 'Jobs Scattered Everywhere', desc: 'Phone notes, text threads, paper quotes — no single source of truth for your jobs.', solution: 'Centralized job management with status tracking' },
    { icon: FileText, iconColor: 'text-amber-400', title: 'Invoice Chasing', desc: 'Sending invoices over email, following up manually, losing track of who owes what.', solution: 'Unlimited invoicing with automated payment reminders' },
    { icon: Users, iconColor: 'text-violet-400', title: 'Team Chaos', desc: 'No way to schedule your crew, track hours, or know who\'s on what job site.', solution: 'Team scheduling, GPS time tracking & timesheet approvals' },
    { icon: MapPin, iconColor: 'text-blue-400', title: 'No Online Presence', desc: 'Relying on word-of-mouth while competitors dominate Google and Yelp.', solution: 'Your own branded subdomain + marketplace listing' },
    { icon: Package, iconColor: 'text-emerald-400', title: 'Inventory Blindspots', desc: 'Showing up to jobs without the right materials because tracking is manual.', solution: 'Inventory & equipment management with low-stock alerts' },
    { icon: TrendingUp, iconColor: 'text-pink-400', title: 'No Visibility Into Revenue', desc: 'Not knowing if last month was actually profitable until it\'s too late.', solution: 'Finance dashboard with real-time P&L and job costing' },
  ];

  return (
    <section className="w-full md:py-10 px-3 md:px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2 animate-in fade-in duration-700">
          <h2 className="text-2xl md:text-4xl font-bold text-white">RUN YOUR ENTIRE BUSINESS FROM ONE PLACE</h2>
          <p className="text-sm md:text-lg text-slate-300 font-semibold max-w-2xl mx-auto">
            Stop duct-taping five apps together. Property Flow HQ is built for contractors who want to grow.
          </p>
        </div>
        <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {points.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.title} className="group rounded-xl md:rounded-2xl border border-rose-500/20 bg-gradient-to-r from-slate-900 to-rose-950 p-6 space-y-4 transition-all duration-300 shadow-2xl hover:border-rose-500/40">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-rose-500/20 p-2 border border-rose-500/30">
                    <Icon className={`h-5 w-5 ${p.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-white mb-2">{p.title}</h3>
                    <p className="text-xs text-slate-400 mb-3">{p.desc}</p>
                    <div className="flex items-center gap-2 text-rose-300 text-xs font-semibold">
                      <ArrowRight className="h-3 w-3" />
                      <span>Solution: {p.solution}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// CONTRACTOR FEATURE SHOWCASE (replaces lease builder / portal cards)
// ─────────────────────────────────────────────
function ContractorShowcase() {
  return (
    <section className="w-full py-6 md:py-12 px-3 md:px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid gap-4 md:gap-6 md:grid-cols-2">

          {/* Marketplace Card */}
          <div className="group relative rounded-2xl md:rounded-3xl overflow-hidden transition-all duration-500 hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-rose-900 to-slate-950" />
            <div className="absolute inset-0 border border-rose-500/30 rounded-2xl md:rounded-3xl" />
            <div className="absolute top-4 right-4 md:top-6 md:right-6">
              <span className="inline-flex items-center gap-1 bg-rose-500/20 backdrop-blur-sm text-rose-300 text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-full border border-rose-500/40">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-400"></span>
                </span>
                YOUR STOREFRONT
              </span>
            </div>
            <div className="relative p-8 md:p-10 space-y-5 md:space-y-7">
              <div className="h-14 w-14 md:h-16 md:w-16 rounded-2xl bg-rose-500/20 backdrop-blur-sm flex items-center justify-center border border-rose-500/30">
                <MapPin className="h-7 w-7 md:h-8 md:w-8 text-rose-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl md:text-3xl font-bold text-white">Your Own Contractor Profile</h3>
                <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                  Get discovered by property managers in your area. Your branded subdomain, portfolio, reviews, and service area — all in one public profile.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {['yourname.propertyflowhq.com', 'Client Reviews', 'Portfolio Gallery', 'Service Area Map'].map((t) => (
                  <span key={t} className="inline-flex items-center gap-1.5 bg-slate-800/60 text-slate-200 text-[11px] md:text-xs font-medium px-3 py-1.5 rounded-full border border-slate-700/50">
                    <CheckCircle className="h-3 w-3 text-rose-400" />
                    {t}
                  </span>
                ))}
              </div>
              <p className="text-slate-400 text-xs md:text-sm">Get found. Get hired. Get paid. No cold calling.</p>
            </div>
          </div>

          {/* Business OS Card */}
          <div className="group relative rounded-2xl md:rounded-3xl overflow-hidden transition-all duration-500 hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-violet-900 to-slate-950" />
            <div className="absolute inset-0 border border-violet-500/30 rounded-2xl md:rounded-3xl" />
            <div className="absolute top-4 right-4 md:top-6 md:right-6">
              <span className="inline-flex items-center gap-1 bg-violet-500/20 backdrop-blur-sm text-violet-300 text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-full border border-violet-500/40">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-400"></span>
                </span>
                FULL BUSINESS OS
              </span>
            </div>
            <div className="relative p-8 md:p-10 space-y-5 md:space-y-7">
              <div className="h-14 w-14 md:h-16 md:w-16 rounded-2xl bg-violet-500/20 backdrop-blur-sm flex items-center justify-center border border-violet-500/30">
                <Zap className="h-7 w-7 md:h-8 md:w-8 text-violet-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl md:text-3xl font-bold text-white">Everything A-to-Z</h3>
                <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                  Leads, jobs, invoices, inventory, payroll, team scheduling, time tracking, marketing — one subscription runs your whole operation.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {['Jobs & Work Orders', 'Invoicing & Estimates', 'Team + Time Tracking', 'Inventory & Equipment', 'Marketing Tools', 'QuickBooks Sync'].map((t) => (
                  <span key={t} className="inline-flex items-center gap-1.5 bg-slate-800/60 text-slate-200 text-[11px] md:text-xs font-medium px-3 py-1.5 rounded-full border border-slate-700/50">
                    <CheckCircle className="h-3 w-3 text-violet-400" />
                    {t}
                  </span>
                ))}
              </div>
              <p className="text-slate-400 text-xs md:text-sm">Starts at $19.99/month. No per-job fees. Ever.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// MAIN SWITCHER COMPONENT
// ─────────────────────────────────────────────
export default function AudienceSwitcher({
  pmPricingSection,
  pmLifecycleSection,
  pmLeasePortalSection,
}: {
  pmPricingSection: React.ReactNode;
  pmLifecycleSection: React.ReactNode;
  pmLeasePortalSection: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const [audience, setAudience] = useState<Audience>('pm');

  useEffect(() => {
    const param = searchParams.get('for');
    setAudience(param === 'contractor' ? 'contractor' : 'pm');
  }, [searchParams]);

  const isPM = audience === 'pm';

  return (
    <>
      {/* ── Hero Section ── */}
      <AnimatePresence mode="wait">
        {isPM ? (
          <motion.section
            key="pm-hero"
            {...fadeSlide}
            className="w-full pt-8 pb-12 md:pt-16 md:pb-24 px-4 relative overflow-hidden"
          >
            <div className="max-w-7xl mx-auto relative z-10">
              <div className="grid gap-6 md:gap-8 lg:grid-cols-2 items-center">
                <div className="space-y-4 md:space-y-6 text-center lg:text-left">
                  <div className="space-y-2 md:space-y-3">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
                      <span className="block bg-gradient-to-r from-blue-600 to-sky-700 bg-clip-text text-transparent drop-shadow-2xl">Your Properties.</span>
                      <span className="block bg-gradient-to-r from-blue-600 to-sky-700 bg-clip-text text-transparent drop-shadow-2xl">Your Rules.</span>
                      <span className="block bg-gradient-to-r from-blue-600 to-sky-700 bg-clip-text text-transparent drop-shadow-2xl">Fully Automated!</span>
                    </h1>
                    <p className="text-center text-sm sm:text-base md:text-lg font-medium max-w-2xl leading-relaxed mx-auto lg:mx-0 mt-4 text-black">
                      Whether you manage 5 units or 500 — We handle everything from applications, rent collections, maintenance requests, and even evictions with ease.
                    </p>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-3 pt-2">
                    <Link
                      href="/sign-up"
                      className="group inline-flex items-center justify-center rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400 text-white px-6 py-3 md:px-8 md:py-3.5 text-sm md:text-base font-bold shadow-lg hover:scale-105 transition-all duration-200"
                    >
                      Start Free Today
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                    </Link>
                    <p className="text-xs md:text-sm text-slate-600 font-medium">14-day free trial • No credit card required</p>
                  </div>
                </div>
                <PMDashboardMock />
              </div>
            </div>
          </motion.section>
        ) : (
          <motion.section
            key="contractor-hero"
            {...fadeSlide}
            className="w-full pt-8 pb-12 md:pt-16 md:pb-24 px-4 relative overflow-hidden"
          >
            <div className="max-w-7xl mx-auto relative z-10">
              <div className="grid gap-6 md:gap-8 lg:grid-cols-2 items-center">
                <div className="space-y-4 md:space-y-6 text-center lg:text-left">
                  <div className="space-y-2 md:space-y-3">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
                      <span className="block bg-gradient-to-r from-rose-500 to-orange-400 bg-clip-text text-transparent drop-shadow-2xl">Run Your</span>
                      <span className="block bg-gradient-to-r from-rose-500 to-orange-400 bg-clip-text text-transparent drop-shadow-2xl">Entire Business</span>
                      <span className="block bg-gradient-to-r from-rose-400 to-amber-400 bg-clip-text text-transparent drop-shadow-2xl">From One Place.</span>
                    </h1>
                    <p className="text-center text-sm sm:text-base md:text-lg font-medium max-w-2xl leading-relaxed mx-auto lg:mx-0 mt-4 text-slate-300">
                      Jobs, invoices, leads, team scheduling, inventory, payroll, and your own branded marketplace profile — all in one platform built for contractors.
                    </p>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-3 pt-2">
                    <Link
                      href="/sign-up?role=contractor"
                      className="group inline-flex items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-orange-400 text-white px-6 py-3 md:px-8 md:py-3.5 text-sm md:text-base font-bold shadow-lg shadow-rose-500/30 hover:scale-105 transition-all duration-200"
                    >
                      Start Free Today
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                    </Link>
                    <p className="text-xs md:text-sm text-slate-400 font-medium">14-day free trial • No credit card required</p>
                  </div>
                </div>
                <ContractorDashboardMock />
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ── Audience-specific middle content ── */}
      <AnimatePresence mode="wait">
        {isPM ? (
          <motion.div key="pm-content" {...fadeSlide}>
            {pmLifecycleSection}
            {pmPricingSection}
            <PMFeatures />
            {pmLeasePortalSection}
          </motion.div>
        ) : (
          <motion.div key="contractor-content" {...fadeSlide}>
            {/* Contractor pricing — reuse same pricing section with ?for=contractor context */}
            {pmPricingSection}
            <ContractorFeatures />
            <ContractorShowcase />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
