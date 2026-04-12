'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UpgradeModal } from './UpgradeModal';
import { LimitWarningModal } from './LimitWarningModal';
import { LimitReachedModal } from './LimitReachedModal';
import { FeatureLockedModal } from './FeatureLockedModal';

/**
 * Demo component to showcase all subscription modals
 * This is for development/testing purposes only
 */
export function ModalDemo() {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [showLimitReached, setShowLimitReached] = useState(false);
  const [showFeatureLocked, setShowFeatureLocked] = useState(false);

  const sampleBenefits = [
    '50 active jobs per month',
    'Team management for 6 members',
    'CRM features with customer portal',
    'Lead management and tracking',
    'Advanced scheduling and calendar',
    'Priority email and phone support'
  ];

  return (
    <div className="container mx-auto p-8 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Subscription Modal Components Demo
        </h1>
        <p className="text-slate-400">
          Click the buttons below to preview each modal type
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upgrade Modal */}
        <Card className="bg-slate-900 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Upgrade Modal</CardTitle>
            <CardDescription className="text-slate-400">
              General-purpose upgrade prompt with feature comparison
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setShowUpgrade(true)}
              className="w-full bg-violet-600 hover:bg-violet-700"
            >
              Show Upgrade Modal
            </Button>
          </CardContent>
        </Card>

        {/* Limit Warning Modal */}
        <Card className="bg-slate-900 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Limit Warning Modal</CardTitle>
            <CardDescription className="text-slate-400">
              Warning shown at 80% usage with progress bar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setShowWarning(true)}
              className="w-full bg-amber-600 hover:bg-amber-700"
            >
              Show Warning Modal
            </Button>
          </CardContent>
        </Card>

        {/* Limit Reached Modal */}
        <Card className="bg-slate-900 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Limit Reached Modal</CardTitle>
            <CardDescription className="text-slate-400">
              Hard stop when limit is reached - must upgrade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setShowLimitReached(true)}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              Show Limit Reached Modal
            </Button>
          </CardContent>
        </Card>

        {/* Feature Locked Modal */}
        <Card className="bg-slate-900 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Feature Locked Modal</CardTitle>
            <CardDescription className="text-slate-400">
              Shown when accessing a feature not in current tier
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setShowFeatureLocked(true)}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Show Feature Locked Modal
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Modal Components */}
      <UpgradeModal
        open={showUpgrade}
        onOpenChange={setShowUpgrade}
        feature="Active Jobs"
        currentTier="starter"
        requiredTier="pro"
        currentLimit={15}
        requiredLimit={50}
        benefits={sampleBenefits}
      />

      <LimitWarningModal
        open={showWarning}
        onOpenChange={setShowWarning}
        feature="Active Jobs"
        current={12}
        limit={15}
        percentage={80}
        tier="starter"
        nextTier="pro"
        nextTierLimit={50}
        onDismiss={() => {
          console.log('Warning dismissed');
          setShowWarning(false);
        }}
      />

      <LimitReachedModal
        open={showLimitReached}
        onOpenChange={setShowLimitReached}
        feature="Active Jobs"
        limit={15}
        tier="starter"
        nextTier="pro"
        nextTierLimit={50}
        benefits={sampleBenefits}
        cannotDismiss={false}
      />

      <FeatureLockedModal
        open={showFeatureLocked}
        onOpenChange={setShowFeatureLocked}
        feature="Team Management"
        requiredTier="pro"
        currentTier="starter"
        benefits={[
          'Invite up to 6 team members',
          'Team chat with channels',
          'Role-based permissions',
          'Schedule management',
          'Time tracking & timesheets',
          'Team performance analytics'
        ]}
        pricing={{
          current: 19.99,
          required: 39.99,
          difference: 20.00
        }}
        onDismiss={() => {
          console.log('Feature locked modal dismissed');
          setShowFeatureLocked(false);
        }}
      />
    </div>
  );
}
