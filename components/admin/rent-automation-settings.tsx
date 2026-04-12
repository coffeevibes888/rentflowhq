'use client';

import { useState, useEffect } from 'react';
import { Bell, DollarSign, Clock, AlertTriangle, Crown, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface RentReminderSettings {
  enabled: boolean;
  reminderDaysBefore: number[];
  reminderChannels: string[];
  customMessage?: string;
}

interface LateFeeSettings {
  enabled: boolean;
  gracePeriodDays: number;
  feeType: 'flat' | 'percentage';
  feeAmount: number;
  maxFee?: number;
  recurringFee: boolean;
  recurringInterval?: 'daily' | 'weekly';
  notifyTenant: boolean;
}

interface RentAutomationSettingsProps {
  isPro?: boolean;
}

export function RentAutomationSettings({ isPro = false }: RentAutomationSettingsProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Rent reminder state
  const [reminderSettings, setReminderSettings] = useState<RentReminderSettings>({
    enabled: false,
    reminderDaysBefore: [7, 3, 1],
    reminderChannels: ['email'],
  });
  
  // Late fee state
  const [lateFeeSettings, setLateFeeSettings] = useState<LateFeeSettings>({
    enabled: false,
    gracePeriodDays: 5,
    feeType: 'flat',
    feeAmount: 50,
    recurringFee: false,
    notifyTenant: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [reminderRes, lateFeeRes] = await Promise.all([
        fetch('/api/landlord/rent-automation/reminders'),
        fetch('/api/landlord/rent-automation/late-fees'),
      ]);

      if (reminderRes.ok) {
        const data = await reminderRes.json();
        if (data.settings) {
          setReminderSettings(data.settings);
        }
      }

      if (lateFeeRes.ok) {
        const data = await lateFeeRes.json();
        if (data.settings) {
          setLateFeeSettings(data.settings);
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveReminderSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/landlord/rent-automation/reminders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reminderSettings),
      });

      if (res.ok) {
        toast({ title: 'Rent reminder settings saved' });
      } else {
        const data = await res.json();
        toast({ title: data.message || 'Failed to save', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Failed to save settings', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const saveLateFeeSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/landlord/rent-automation/late-fees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lateFeeSettings),
      });

      if (res.ok) {
        toast({ title: 'Late fee settings saved' });
      } else {
        const data = await res.json();
        toast({ title: data.message || 'Failed to save', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Failed to save settings', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
      </div>
    );
  }

  const ProBadge = () => (
    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] px-1.5 py-0.5">
      <Crown className="w-2.5 h-2.5 mr-0.5" />
      PRO
    </Badge>
  );

  const LockedOverlay = () => (
    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center z-10">
      <Crown className="w-8 h-8 text-amber-400 mb-2" />
      <p className="text-sm text-white font-medium mb-1">Pro Feature</p>
      <p className="text-xs text-slate-400 mb-3 text-center px-4">
        Upgrade to Pro to enable automatic rent reminders and late fees
      </p>
      <Link href="/admin/settings/subscription">
        <Button size="sm" className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs">
          Upgrade to Pro
        </Button>
      </Link>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Rent Reminders */}
      <div className="relative rounded-lg border border-white/10 bg-slate-900/60 p-3 sm:p-4">
        {!isPro && <LockedOverlay />}
        
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-violet-400" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">Automatic Rent Reminders</h3>
                {!isPro && <ProBadge />}
              </div>
              <p className="text-[10px] text-slate-400">
                Send automated reminders before rent is due
              </p>
            </div>
          </div>
          <Switch
            checked={reminderSettings.enabled}
            onCheckedChange={(checked) => setReminderSettings({ ...reminderSettings, enabled: checked })}
            disabled={!isPro}
          />
        </div>

        {reminderSettings.enabled && isPro && (
          <div className="space-y-3 pt-3 border-t border-white/10">
            <div>
              <Label className="text-xs text-slate-300">Remind tenants</Label>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {[1, 3, 5, 7, 14].map((days) => (
                  <button
                    key={days}
                    onClick={() => {
                      const current = reminderSettings.reminderDaysBefore;
                      const updated = current.includes(days)
                        ? current.filter((d) => d !== days)
                        : [...current, days].sort((a, b) => b - a);
                      setReminderSettings({ ...reminderSettings, reminderDaysBefore: updated });
                    }}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${
                      reminderSettings.reminderDaysBefore.includes(days)
                        ? 'bg-violet-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {days} day{days > 1 ? 's' : ''} before
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs text-slate-300">Notification channels</Label>
              <div className="flex gap-2 mt-1.5">
                {['email', 'in-app', 'sms'].map((channel) => (
                  <button
                    key={channel}
                    onClick={() => {
                      const current = reminderSettings.reminderChannels;
                      const updated = current.includes(channel)
                        ? current.filter((c) => c !== channel)
                        : [...current, channel];
                      setReminderSettings({ ...reminderSettings, reminderChannels: updated });
                    }}
                    disabled={channel === 'sms'}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${
                      reminderSettings.reminderChannels.includes(channel)
                        ? 'bg-violet-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    } ${channel === 'sms' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {channel === 'in-app' ? 'In-App' : channel.charAt(0).toUpperCase() + channel.slice(1)}
                    {channel === 'sms' && ' (soon)'}
                  </button>
                ))}
              </div>
            </div>

            <Button
              size="sm"
              onClick={saveReminderSettings}
              disabled={saving}
              className="w-full sm:w-auto bg-violet-600 hover:bg-violet-500 text-xs h-8"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Check className="w-3 h-3 mr-1" />}
              Save Reminder Settings
            </Button>
          </div>
        )}
      </div>

      {/* Late Fees */}
      <div className="relative rounded-lg border border-white/10 bg-slate-900/60 p-3 sm:p-4">
        {!isPro && <LockedOverlay />}
        
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-amber-400" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">Automatic Late Fees</h3>
                {!isPro && <ProBadge />}
              </div>
              <p className="text-[10px] text-slate-400">
                Automatically apply late fees after grace period
              </p>
            </div>
          </div>
          <Switch
            checked={lateFeeSettings.enabled}
            onCheckedChange={(checked) => setLateFeeSettings({ ...lateFeeSettings, enabled: checked })}
            disabled={!isPro}
          />
        </div>

        {lateFeeSettings.enabled && isPro && (
          <div className="space-y-3 pt-3 border-t border-white/10">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-slate-300">Grace period</Label>
                <Select
                  value={String(lateFeeSettings.gracePeriodDays)}
                  onValueChange={(v) => setLateFeeSettings({ ...lateFeeSettings, gracePeriodDays: Number(v) })}
                >
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 3, 5, 7, 10, 14].map((days) => (
                      <SelectItem key={days} value={String(days)}>
                        {days === 0 ? 'No grace period' : `${days} days`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-slate-300">Fee type</Label>
                <Select
                  value={lateFeeSettings.feeType}
                  onValueChange={(v) => setLateFeeSettings({ ...lateFeeSettings, feeType: v as 'flat' | 'percentage' })}
                >
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flat">Flat fee</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-slate-300">
                  {lateFeeSettings.feeType === 'flat' ? 'Fee amount ($)' : 'Fee percentage (%)'}
                </Label>
                <Input
                  type="number"
                  value={lateFeeSettings.feeAmount}
                  onChange={(e) => setLateFeeSettings({ ...lateFeeSettings, feeAmount: Number(e.target.value) })}
                  className="h-8 text-xs mt-1"
                  min={0}
                  step={lateFeeSettings.feeType === 'percentage' ? 0.5 : 1}
                />
              </div>

              {lateFeeSettings.feeType === 'percentage' && (
                <div>
                  <Label className="text-xs text-slate-300">Max fee cap ($)</Label>
                  <Input
                    type="number"
                    value={lateFeeSettings.maxFee || ''}
                    onChange={(e) => setLateFeeSettings({ ...lateFeeSettings, maxFee: e.target.value ? Number(e.target.value) : undefined })}
                    className="h-8 text-xs mt-1"
                    placeholder="No cap"
                    min={0}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={lateFeeSettings.notifyTenant}
                  onChange={(e) => setLateFeeSettings({ ...lateFeeSettings, notifyTenant: e.target.checked })}
                  className="h-3.5 w-3.5 rounded border-white/20 bg-slate-900"
                />
                Notify tenant when fee applied
              </label>
            </div>

            <div className="flex items-start gap-2 p-2 rounded bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
              <p className="text-[10px] text-amber-200/90">
                Late fees run daily at 10 AM UTC. Fees are applied to payments past the grace period.
              </p>
            </div>

            <Button
              size="sm"
              onClick={saveLateFeeSettings}
              disabled={saving}
              className="w-full sm:w-auto bg-amber-600 hover:bg-amber-500 text-xs h-8"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Check className="w-3 h-3 mr-1" />}
              Save Late Fee Settings
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
