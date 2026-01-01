'use client';

import { useState } from 'react';
import { Shield, ShieldCheck, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

interface SecuritySettingsProps {
  initialEnabled: boolean;
}

export function SecuritySettings({ initialEnabled }: SecuritySettingsProps) {
  const [isEnabled, setIsEnabled] = useState(initialEnabled);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleToggle = async (enabled: boolean) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/email-2fa/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsEnabled(enabled);
        toast({
          title: enabled ? '2FA Enabled' : '2FA Disabled',
          description: enabled 
            ? 'You will receive a verification code via email when signing in.'
            : 'Two-factor authentication has been disabled.',
        });
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to update 2FA settings',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-slate-900/60 p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`rounded-full p-2 border ${isEnabled ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-slate-800 border-white/10'}`}>
              {isEnabled ? (
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
              ) : (
                <Shield className="h-5 w-5 text-slate-400" />
              )}
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-white">Two-Factor Authentication</h3>
              <p className="text-sm text-slate-400">
                {isEnabled 
                  ? 'Your account is protected with email verification codes.'
                  : 'Add an extra layer of security by requiring a verification code sent to your email when signing in.'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
            <Switch
              checked={isEnabled}
              onCheckedChange={handleToggle}
              disabled={isLoading}
            />
          </div>
        </div>

        {isEnabled && (
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4">
            <p className="text-sm text-emerald-200">
              When you sign in, we'll send a 6-digit code to your email. Enter this code to complete your login.
            </p>
          </div>
        )}

        {!isEnabled && (
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4">
            <p className="text-sm text-amber-200">
              We recommend enabling 2FA to protect your account, especially since you handle financial transactions and sensitive data.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
