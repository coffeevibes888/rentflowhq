'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Star, Shield, Zap, TrendingUp, Eye, CheckCircle, XCircle,
  BarChart3, RefreshCw, Users, Award, Clock, Sparkles, Info,
  ExternalLink, AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

interface VisibilityPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  description: string;
  popular: boolean;
}

interface ProfileData {
  id: string;
  name: string;
  completionScore: number;
  missingItems: string[];
  visibilityCredits: number;
  featuredUntil: string | null;
  newContractorBoostUntil: string | null;
  hasActiveBoost: boolean;
  isNewMember: boolean;
  isPublic: boolean;
  acceptingNewWork: boolean;
  avgRating: number;
  totalReviews: number;
  completedJobs: number;
}

interface Props {
  profile: ProfileData;
  packages: VisibilityPackage[];
  boostResult: string | null;
}

const SCORE_FACTORS = [
  { label: 'Average Rating', weight: 25, icon: Star, color: 'text-amber-500', tip: 'Bayesian-weighted so 1 review can\'t game the system. More reviews = more weight.' },
  { label: 'Review Volume', weight: 15, icon: Users, color: 'text-blue-500', tip: 'Log scale — going from 0→10 reviews matters more than 100→110.' },
  { label: 'Completed Jobs', weight: 15, icon: CheckCircle, color: 'text-emerald-500', tip: 'Proven track record. Log scale so new contractors aren\'t buried.' },
  { label: 'Response Rate', weight: 15, icon: Clock, color: 'text-violet-500', tip: 'Do you reply to messages? Clients hate being ignored.' },
  { label: 'Profile Completeness', weight: 10, icon: BarChart3, color: 'text-cyan-500', tip: 'Photo, bio, tagline, location, specialties, hourly rate all filled in.' },
  { label: 'Trust & Verification', weight: 10, icon: Shield, color: 'text-indigo-500', tip: 'Identity verified, insured, background checked. Each adds points.' },
  { label: 'On-Time Rate', weight: 5, icon: Award, color: 'text-orange-500', tip: 'Do you show up when you say you will?' },
  { label: 'Recent Activity', weight: 5, icon: RefreshCw, color: 'text-pink-500', tip: 'Active in the last 30 days gets full points. Decays over 90 days.' },
];

export default function VisibilityClient({ profile, packages, boostResult }: Props) {
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const handlePurchase = async (packageId: string) => {
    setPurchasing(packageId);
    try {
      const res = await fetch('/api/contractor/visibility/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert(data.error || 'Failed to start checkout');
      }
    } catch {
      alert('Something went wrong. Please try again.');
    } finally {
      setPurchasing(null);
    }
  };

  const boostActiveUntil = profile.featuredUntil
    ? new Date(profile.featuredUntil)
    : profile.newContractorBoostUntil
    ? new Date(profile.newContractorBoostUntil)
    : null;

  return (
    <main className="w-full px-4 py-8 md:px-0 space-y-8 max-w-5xl mx-auto">

      {/* Result banners */}
      {boostResult === 'success' && (
        <div className="rounded-xl bg-emerald-50 border-2 border-emerald-400 p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
          <p className="text-emerald-800 font-semibold">Visibility boost activated! Your profile will now appear more frequently in the marketplace.</p>
        </div>
      )}
      {boostResult === 'canceled' && (
        <div className="rounded-xl bg-amber-50 border-2 border-amber-400 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
          <p className="text-amber-800 font-semibold">Purchase canceled — no charge was made.</p>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Marketplace Visibility</h1>
        <p className="text-slate-500">Understand how clients find you, and how to show up more.</p>
      </div>

      {/* Current Status */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className={`border-2 ${profile.hasActiveBoost ? 'border-amber-400 bg-amber-50' : 'border-slate-200'}`}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className={`h-5 w-5 ${profile.hasActiveBoost ? 'text-amber-500' : 'text-slate-400'}`} />
              <p className="font-semibold text-slate-700">Boost Status</p>
            </div>
            {profile.hasActiveBoost ? (
              <>
                <p className="text-lg font-bold text-amber-600">Active ✦</p>
                {profile.isNewMember && (
                  <p className="text-xs text-amber-700 mt-1">Free new-member boost (30 days)</p>
                )}
                {profile.visibilityCredits > 0 && (
                  <p className="text-xs text-amber-700 mt-1">{profile.visibilityCredits.toLocaleString()} impressions remaining</p>
                )}
                {boostActiveUntil && (
                  <p className="text-xs text-slate-500 mt-1">Until {boostActiveUntil.toLocaleDateString()}</p>
                )}
              </>
            ) : (
              <p className="text-slate-500 text-sm">No active boost</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-2 border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              <p className="font-semibold text-slate-700">Profile Score</p>
            </div>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-bold text-blue-600">{profile.completionScore}%</p>
              <p className="text-slate-500 text-sm mb-1">complete</p>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${profile.completionScore}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <Eye className="h-5 w-5 text-violet-500" />
              <p className="font-semibold text-slate-700">Marketplace Status</p>
            </div>
            {profile.isPublic && profile.acceptingNewWork ? (
              <p className="text-emerald-600 font-bold">Visible ✓</p>
            ) : (
              <p className="text-red-500 font-bold">Hidden</p>
            )}
            <p className="text-xs text-slate-500 mt-1">
              {!profile.isPublic ? 'Profile is set to private' : !profile.acceptingNewWork ? 'Not accepting new work' : 'Showing in search results'}
            </p>
            <Link href="/contractor/profile/branding" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
              Edit in Branding →
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Profile completion checklist */}
      {profile.missingItems.length > 0 && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-blue-800 flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5" />
              Complete your profile to rank higher — for free
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-700 text-sm mb-4">
              Profile completeness is worth <strong>10 points</strong> in your merit score. These items are missing:
            </p>
            <div className="grid sm:grid-cols-2 gap-2">
              {profile.missingItems.map(item => (
                <div key={item} className="flex items-center gap-2 text-sm text-blue-800">
                  <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
            <Link href="/contractor/profile/branding">
              <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">
                Complete My Profile
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* How the algorithm works */}
      <Card className="border-2 border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Info className="h-5 w-5 text-slate-500" />
            How We Rank Contractors — Full Transparency
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
            <p className="text-slate-700 font-semibold mb-2">The core principle</p>
            <p className="text-slate-600 text-sm leading-relaxed">
              Your position in search results is based entirely on <strong>merit</strong> — quality signals that reflect how good you are at your job.
              Money cannot buy a higher rank. What money <em>can</em> buy is <strong>more impressions</strong> — your card gets shown to more people,
              but always in a clearly labeled "Sponsored" slot that sits alongside organic results, not above them.
            </p>
          </div>

          <div>
            <p className="font-semibold text-slate-800 mb-3">Your Merit Score is made up of:</p>
            <div className="space-y-3">
              {SCORE_FACTORS.map(factor => {
                const Icon = factor.icon;
                return (
                  <div key={factor.label} className="flex items-start gap-3">
                    <div className="flex items-center gap-2 w-48 shrink-0">
                      <Icon className={`h-4 w-4 shrink-0 ${factor.color}`} />
                      <span className="text-sm font-medium text-slate-700">{factor.label}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex-1 bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-violet-500 h-2 rounded-full"
                          style={{ width: `${factor.weight * 4}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-slate-600 w-10 text-right">{factor.weight}pts</span>
                    </div>
                    <p className="text-xs text-slate-500 w-64 hidden lg:block">{factor.tip}</p>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-slate-400 mt-3">Total: 100 points possible</p>
          </div>

          <div className="rounded-xl bg-violet-50 border border-violet-200 p-4">
            <p className="text-violet-800 font-semibold mb-2 flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              The Rotation System (Airbnb-style)
            </p>
            <p className="text-violet-700 text-sm leading-relaxed">
              Contractors with active visibility boosts rotate through up to <strong>3 "Sponsored" slots</strong> at the top of results.
              The rotation changes daily using a random seed — so no single contractor locks the top spot forever.
              Even if 20 contractors have boosts, each gets fair exposure over time.
              New contractors (first 30 days) get a <strong>free automatic boost</strong> so they can build their first reviews.
            </p>
          </div>

          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
            <p className="text-emerald-800 font-semibold mb-2">The best way to rank higher is free</p>
            <ul className="text-emerald-700 text-sm space-y-1">
              <li>✓ Get more reviews from happy clients</li>
              <li>✓ Complete your profile (photo, bio, location, rate)</li>
              <li>✓ Get verified and insured</li>
              <li>✓ Reply to messages quickly</li>
              <li>✓ Show up on time</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Visibility Boost packages */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Visibility Boost</h2>
        <p className="text-slate-500 mb-6">
          Buy impressions to get your card shown to more people. Clearly labeled as "Sponsored."
          Your organic rank is never affected — this is purely about reach.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {packages.map(pkg => (
            <Card
              key={pkg.id}
              className={`border-2 relative ${pkg.popular ? 'border-violet-500 shadow-lg shadow-violet-100' : 'border-slate-200'}`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-violet-600 text-white px-3 py-1">Most Popular</Badge>
                </div>
              )}
              <CardContent className="p-6 text-center">
                <p className="text-lg font-bold text-slate-900 mb-1">{pkg.name}</p>
                <p className="text-4xl font-bold text-slate-900 mb-1">
                  ${(pkg.price / 100).toFixed(2)}
                </p>
                <p className="text-slate-500 text-sm mb-4">{pkg.description}</p>
                <div className="text-xs text-slate-400 mb-6 space-y-1">
                  <p>✦ Rotates in Sponsored slots daily</p>
                  <p>✦ Clearly labeled — no deception</p>
                  <p>✦ Credits never expire</p>
                </div>
                <Button
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={purchasing === pkg.id}
                  className={`w-full ${pkg.popular ? 'bg-violet-600 hover:bg-violet-700' : 'bg-slate-800 hover:bg-slate-700'} text-white`}
                >
                  {purchasing === pkg.id ? 'Loading...' : `Get ${pkg.name}`}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-xs text-slate-400 mt-4 text-center">
          Secure checkout via Stripe. One-time payment, no subscription. Credits are added instantly after payment.
        </p>
      </div>

      {/* View public profile */}
      <div className="flex justify-center pb-8">
        <Link href="/contractors" target="_blank">
          <Button variant="outline" className="gap-2">
            <ExternalLink className="h-4 w-4" />
            See how you appear in the marketplace
          </Button>
        </Link>
      </div>
    </main>
  );
}
