'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Check, DollarSign, Clock, PawPrint, Sparkles, Crown, ChevronDown, Bell, Building2, Settings2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface FeeSettingsProps {
  isPro: boolean;
}

interface Property {
  id: string;
  name: string;
}

interface FeeConfig {
  enabled: boolean;
  amount: number;
  applyToAll: boolean;
  selectedProperties: string[];
}

interface RentReminderSettings {
  enabled: boolean;
  reminderDaysBefore: number[];
  reminderChannels: string[];
}

interface LateFeeSettings {
  enabled: boolean;
  gracePeriodDays: number;
  feeType: 'flat' | 'percentage';
  feeAmount: number;
  maxFee?: number;
  notifyTenant: boolean;
}

export function FeeSettings({ isPro }: FeeSettingsProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [lateFeeModalOpen, setLateFeeModalOpen] = useState(false);
  const [savingReminders, setSavingReminders] = useState(false);
  const [savingLateFees, setSavingLateFees] = useState(false);
  
  // Rent automation settings
  const [reminderSettings, setReminderSettings] = useState<RentReminderSettings>({
    enabled: false,
    reminderDaysBefore: [7, 3, 1],
    reminderChannels: ['email'],
  });
  
  const [lateFeeSettings, setLateFeeSettings] = useState<LateFeeSettings>({
    enabled: false,
    gracePeriodDays: 5,
    feeType: 'flat',
    feeAmount: 50,
    notifyTenant: true,
  });
  
  // Individual fee settings with property selection
  const [petDeposit, setPetDeposit] = useState<FeeConfig>({
    enabled: false,
    amount: 300,
    applyToAll: true,
    selectedProperties: [],
  });
  
  const [petRent, setPetRent] = useState<FeeConfig>({
    enabled: false,
    amount: 50,
    applyToAll: true,
    selectedProperties: [],
  });
  
  const [cleaningFee, setCleaningFee] = useState<FeeConfig>({
    enabled: false,
    amount: 150,
    applyToAll: true,
    selectedProperties: [],
  });
  
  const [applicationFee, setApplicationFee] = useState<FeeConfig>({
    enabled: true,
    amount: 50,
    applyToAll: true,
    selectedProperties: [],
  });
  
  const [securityDeposit, setSecurityDeposit] = useState({
    months: 1,
    applyToAll: true,
    selectedProperties: [] as string[],
  });
  
  const [lastMonthRent, setLastMonthRent] = useState({
    required: true,
    applyToAll: true,
    selectedProperties: [] as string[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [propsRes, feesRes, reminderRes, lateFeeRes] = await Promise.all([
        fetch('/api/landlord/properties'),
        fetch('/api/landlord/fee-settings'),
        fetch('/api/landlord/rent-automation/reminders'),
        fetch('/api/landlord/rent-automation/late-fees'),
      ]);

      if (propsRes.ok) {
        const data = await propsRes.json();
        setProperties(data.properties || []);
      }

      if (feesRes.ok) {
        const data = await feesRes.json();
        if (data.settings) {
          // Map the settings to our state structure
        }
      }

      if (reminderRes.ok) {
        const data = await reminderRes.json();
        if (data.settings) setReminderSettings(data.settings);
      }

      if (lateFeeRes.ok) {
        const data = await lateFeeRes.json();
        if (data.settings) setLateFeeSettings(data.settings);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveReminderSettings = async () => {
    setSavingReminders(true);
    try {
      const res = await fetch('/api/landlord/rent-automation/reminders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reminderSettings),
      });
      if (res.ok) {
        toast({ title: 'Rent reminder settings saved' });
        setReminderModalOpen(false);
      } else {
        const data = await res.json();
        toast({ title: data.message || 'Failed to save', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Failed to save settings', variant: 'destructive' });
    } finally {
      setSavingReminders(false);
    }
  };

  const saveLateFeeSettings = async () => {
    setSavingLateFees(true);
    try {
      const res = await fetch('/api/landlord/rent-automation/late-fees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lateFeeSettings),
      });
      if (res.ok) {
        toast({ title: 'Late fee settings saved' });
        setLateFeeModalOpen(false);
      } else {
        const data = await res.json();
        toast({ title: data.message || 'Failed to save', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Failed to save settings', variant: 'destructive' });
    } finally {
      setSavingLateFees(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/landlord/fee-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petDeposit,
          petRent,
          cleaningFee,
          applicationFee,
          securityDeposit,
          lastMonthRent,
        }),
      });

      if (res.ok) {
        toast({ title: 'Fee settings saved' });
      } else {
        toast({ title: 'Failed to save settings', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Failed to save settings', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const PropertySelector = ({ 
    applyToAll, 
    setApplyToAll, 
    selectedProperties, 
    setSelectedProperties,
    label 
  }: {
    applyToAll: boolean;
    setApplyToAll: (v: boolean) => void;
    selectedProperties: string[];
    setSelectedProperties: (v: string[]) => void;
    label: string;
  }) => (
    <Collapsible>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-xs text-slate-400 hover:text-slate-300">
        <span className="flex items-center gap-1.5">
          <Building2 className="w-3 h-3" />
          {applyToAll ? 'Applies to all properties' : `${selectedProperties.length} properties selected`}
        </span>
        <ChevronDown className="w-3 h-3" />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2 space-y-2">
        <div className="flex items-center gap-2">
          <Checkbox
            id={`${label}-all`}
            checked={applyToAll}
            onCheckedChange={(checked) => {
              setApplyToAll(!!checked);
              if (checked) setSelectedProperties([]);
            }}
          />
          <label htmlFor={`${label}-all`} className="text-xs text-slate-300">Apply to all properties</label>
        </div>
        {!applyToAll && properties.length > 0 && (
          <div className="pl-4 space-y-1.5 max-h-32 overflow-y-auto">
            {properties.map((p) => (
              <div key={p.id} className="flex items-center gap-2">
                <Checkbox
                  id={`${label}-${p.id}`}
                  checked={selectedProperties.includes(p.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedProperties([...selectedProperties, p.id]);
                    } else {
                      setSelectedProperties(selectedProperties.filter(id => id !== p.id));
                    }
                  }}
                />
                <label htmlFor={`${label}-${p.id}`} className="text-xs text-slate-400">{p.name}</label>
              </div>
            ))}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Rent Automation - Combined Pro Feature Card */}
      <div className="relative rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-purple-500/10 p-4 sm:p-5 overflow-hidden">
        {!isPro && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-xl">
            <Crown className="w-10 h-10 text-amber-400 mb-3" />
            <p className="text-base text-white font-semibold mb-1">Pro Features</p>
            <p className="text-xs text-slate-400 mb-4 text-center px-6">
              Upgrade to Pro to enable automatic rent reminders and late fees
            </p>
            <Link href="/admin/settings/subscription">
              <Button className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                Upgrade to Pro
              </Button>
            </Link>
          </div>
        )}
        
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-violet-400" />
          <h3 className="text-base font-semibold text-white">Rent Automation</h3>
          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-medium">PRO</span>
        </div>
        
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Rent Reminders */}
          <div className="rounded-lg border border-white/10 bg-slate-900/40 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-violet-400" />
                <span className="text-sm font-medium text-white">Rent Reminders</span>
              </div>
              <Switch
                checked={reminderSettings.enabled}
                onCheckedChange={(checked) => setReminderSettings({ ...reminderSettings, enabled: checked })}
                disabled={!isPro}
              />
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              {reminderSettings.enabled 
                ? `Sending ${reminderSettings.reminderDaysBefore.join(', ')} days before due`
                : 'Send automated reminders before rent is due'}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 p-0 h-auto"
              onClick={() => setReminderModalOpen(true)}
              disabled={!isPro}
            >
              <Settings2 className="w-3 h-3 mr-1" />
              Configure Settings
            </Button>
          </div>
          
          {/* Late Fees */}
          <div className="rounded-lg border border-white/10 bg-slate-900/40 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium text-white">Late Fees</span>
              </div>
              <Switch
                checked={lateFeeSettings.enabled}
                onCheckedChange={(checked) => setLateFeeSettings({ ...lateFeeSettings, enabled: checked })}
                disabled={!isPro}
              />
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              {lateFeeSettings.enabled 
                ? `$${lateFeeSettings.feeAmount} after ${lateFeeSettings.gracePeriodDays} day grace period`
                : 'Automatically apply late fees after grace period'}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 p-0 h-auto"
              onClick={() => setLateFeeModalOpen(true)}
              disabled={!isPro}
            >
              <Settings2 className="w-3 h-3 mr-1" />
              Configure Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Pet Fees */}
      <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <PawPrint className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-semibold text-white">Pet Fees</h3>
        </div>
        <div className="space-y-4">
          {/* Pet Deposit */}
          <div className="rounded-lg border border-white/5 bg-slate-800/30 p-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm text-white font-medium">Pet Deposit</p>
                <p className="text-[11px] text-slate-500">One-time refundable deposit</p>
              </div>
              <Switch
                checked={petDeposit.enabled}
                onCheckedChange={(checked) => setPetDeposit({ ...petDeposit, enabled: checked })}
              />
            </div>
            {petDeposit.enabled && (
              <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-sm">$</span>
                  <Input
                    type="number"
                    value={petDeposit.amount}
                    onChange={(e) => setPetDeposit({ ...petDeposit, amount: Number(e.target.value) })}
                    className="h-8 w-28 text-sm"
                  />
                </div>
                <PropertySelector
                  applyToAll={petDeposit.applyToAll}
                  setApplyToAll={(v) => setPetDeposit({ ...petDeposit, applyToAll: v })}
                  selectedProperties={petDeposit.selectedProperties}
                  setSelectedProperties={(v) => setPetDeposit({ ...petDeposit, selectedProperties: v })}
                  label="petDeposit"
                />
              </div>
            )}
          </div>

          {/* Pet Rent */}
          <div className="rounded-lg border border-white/5 bg-slate-800/30 p-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm text-white font-medium">Monthly Pet Rent</p>
                <p className="text-[11px] text-slate-500">Added to monthly rent</p>
              </div>
              <Switch
                checked={petRent.enabled}
                onCheckedChange={(checked) => setPetRent({ ...petRent, enabled: checked })}
              />
            </div>
            {petRent.enabled && (
              <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-sm">$</span>
                  <Input
                    type="number"
                    value={petRent.amount}
                    onChange={(e) => setPetRent({ ...petRent, amount: Number(e.target.value) })}
                    className="h-8 w-28 text-sm"
                  />
                  <span className="text-slate-500 text-xs">/month</span>
                </div>
                <PropertySelector
                  applyToAll={petRent.applyToAll}
                  setApplyToAll={(v) => setPetRent({ ...petRent, applyToAll: v })}
                  selectedProperties={petRent.selectedProperties}
                  setSelectedProperties={(v) => setPetRent({ ...petRent, selectedProperties: v })}
                  label="petRent"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Move-in Fees */}
      <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-semibold text-white">Move-in Fees</h3>
        </div>
        <div className="space-y-4">
          {/* Cleaning Fee */}
          <div className="rounded-lg border border-white/5 bg-slate-800/30 p-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm text-white font-medium">Cleaning Fee</p>
                <p className="text-[11px] text-slate-500">Non-refundable move-in fee</p>
              </div>
              <Switch
                checked={cleaningFee.enabled}
                onCheckedChange={(checked) => setCleaningFee({ ...cleaningFee, enabled: checked })}
              />
            </div>
            {cleaningFee.enabled && (
              <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-sm">$</span>
                  <Input
                    type="number"
                    value={cleaningFee.amount}
                    onChange={(e) => setCleaningFee({ ...cleaningFee, amount: Number(e.target.value) })}
                    className="h-8 w-28 text-sm"
                  />
                </div>
                <PropertySelector
                  applyToAll={cleaningFee.applyToAll}
                  setApplyToAll={(v) => setCleaningFee({ ...cleaningFee, applyToAll: v })}
                  selectedProperties={cleaningFee.selectedProperties}
                  setSelectedProperties={(v) => setCleaningFee({ ...cleaningFee, selectedProperties: v })}
                  label="cleaningFee"
                />
              </div>
            )}
          </div>

          {/* Application Fee */}
          <div className="rounded-lg border border-white/5 bg-slate-800/30 p-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm text-white font-medium">Application Fee</p>
                <p className="text-[11px] text-slate-500">Per applicant</p>
              </div>
              <Switch
                checked={applicationFee.enabled}
                onCheckedChange={(checked) => setApplicationFee({ ...applicationFee, enabled: checked })}
              />
            </div>
            {applicationFee.enabled && (
              <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-sm">$</span>
                  <Input
                    type="number"
                    value={applicationFee.amount}
                    onChange={(e) => setApplicationFee({ ...applicationFee, amount: Number(e.target.value) })}
                    className="h-8 w-28 text-sm"
                  />
                </div>
                <PropertySelector
                  applyToAll={applicationFee.applyToAll}
                  setApplyToAll={(v) => setApplicationFee({ ...applicationFee, applyToAll: v })}
                  selectedProperties={applicationFee.selectedProperties}
                  setSelectedProperties={(v) => setApplicationFee({ ...applicationFee, selectedProperties: v })}
                  label="applicationFee"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Deposit Requirements */}
      <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-sky-400" />
          <h3 className="text-base font-semibold text-white">Deposit Requirements</h3>
        </div>
        <div className="space-y-4">
          {/* Security Deposit */}
          <div className="rounded-lg border border-white/5 bg-slate-800/30 p-3">
            <div className="mb-2">
              <p className="text-sm text-white font-medium">Security Deposit</p>
              <p className="text-[11px] text-slate-500">Required at lease signing</p>
            </div>
            <div className="space-y-2">
              <Select
                value={String(securityDeposit.months)}
                onValueChange={(v) => setSecurityDeposit({ ...securityDeposit, months: Number(v) })}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.5">Half month&apos;s rent</SelectItem>
                  <SelectItem value="1">1 month&apos;s rent</SelectItem>
                  <SelectItem value="1.5">1.5 months&apos; rent</SelectItem>
                  <SelectItem value="2">2 months&apos; rent</SelectItem>
                </SelectContent>
              </Select>
              <PropertySelector
                applyToAll={securityDeposit.applyToAll}
                setApplyToAll={(v) => setSecurityDeposit({ ...securityDeposit, applyToAll: v })}
                selectedProperties={securityDeposit.selectedProperties}
                setSelectedProperties={(v) => setSecurityDeposit({ ...securityDeposit, selectedProperties: v })}
                label="securityDeposit"
              />
            </div>
          </div>

          {/* Last Month's Rent */}
          <div className="rounded-lg border border-white/5 bg-slate-800/30 p-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm text-white font-medium">Require Last Month&apos;s Rent</p>
                <p className="text-[11px] text-slate-500">Collected at move-in</p>
              </div>
              <Switch
                checked={lastMonthRent.required}
                onCheckedChange={(checked) => setLastMonthRent({ ...lastMonthRent, required: checked })}
              />
            </div>
            {lastMonthRent.required && (
              <div className="pt-2 border-t border-white/5">
                <PropertySelector
                  applyToAll={lastMonthRent.applyToAll}
                  setApplyToAll={(v) => setLastMonthRent({ ...lastMonthRent, applyToAll: v })}
                  selectedProperties={lastMonthRent.selectedProperties}
                  setSelectedProperties={(v) => setLastMonthRent({ ...lastMonthRent, selectedProperties: v })}
                  label="lastMonthRent"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full sm:w-auto bg-violet-600 hover:bg-violet-500 text-sm h-10"
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : (
          <Check className="w-4 h-4 mr-2" />
        )}
        Save Fee Settings
      </Button>

      {/* Rent Reminders Modal */}
      <Dialog open={reminderModalOpen} onOpenChange={setReminderModalOpen}>
        <DialogContent className="max-w-md bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Bell className="w-5 h-5 text-violet-400" />
              Rent Reminder Settings
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white font-medium">Enable Reminders</p>
                <p className="text-xs text-slate-400">Send automated reminders before rent is due</p>
              </div>
              <Switch
                checked={reminderSettings.enabled}
                onCheckedChange={(checked) => setReminderSettings({ ...reminderSettings, enabled: checked })}
              />
            </div>

            {reminderSettings.enabled && (
              <>
                <div>
                  <p className="text-xs text-slate-300 mb-2">Remind tenants</p>
                  <div className="flex flex-wrap gap-2">
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
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
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
                  <p className="text-xs text-slate-300 mb-2">Notification channels</p>
                  <div className="flex gap-2">
                    {['email', 'in-app'].map((channel) => (
                      <button
                        key={channel}
                        onClick={() => {
                          const current = reminderSettings.reminderChannels;
                          const updated = current.includes(channel)
                            ? current.filter((c) => c !== channel)
                            : [...current, channel];
                          setReminderSettings({ ...reminderSettings, reminderChannels: updated });
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          reminderSettings.reminderChannels.includes(channel)
                            ? 'bg-violet-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {channel === 'in-app' ? 'In-App' : 'Email'}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setReminderModalOpen(false)} className="border-white/10">
                Cancel
              </Button>
              <Button onClick={saveReminderSettings} disabled={savingReminders} className="bg-violet-600 hover:bg-violet-500">
                {savingReminders && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Save Settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Late Fees Modal */}
      <Dialog open={lateFeeModalOpen} onOpenChange={setLateFeeModalOpen}>
        <DialogContent className="max-w-md bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <DollarSign className="w-5 h-5 text-amber-400" />
              Late Fee Settings
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white font-medium">Enable Late Fees</p>
                <p className="text-xs text-slate-400">Automatically apply fees after grace period</p>
              </div>
              <Switch
                checked={lateFeeSettings.enabled}
                onCheckedChange={(checked) => setLateFeeSettings({ ...lateFeeSettings, enabled: checked })}
              />
            </div>

            {lateFeeSettings.enabled && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-300 mb-1.5">Grace period</p>
                    <Select
                      value={String(lateFeeSettings.gracePeriodDays)}
                      onValueChange={(v) => setLateFeeSettings({ ...lateFeeSettings, gracePeriodDays: Number(v) })}
                    >
                      <SelectTrigger className="h-9 text-sm bg-slate-800 border-white/10">
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
                    <p className="text-xs text-slate-300 mb-1.5">Fee type</p>
                    <Select
                      value={lateFeeSettings.feeType}
                      onValueChange={(v) => setLateFeeSettings({ ...lateFeeSettings, feeType: v as 'flat' | 'percentage' })}
                    >
                      <SelectTrigger className="h-9 text-sm bg-slate-800 border-white/10">
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
                    <p className="text-xs text-slate-300 mb-1.5">
                      {lateFeeSettings.feeType === 'flat' ? 'Fee amount ($)' : 'Fee percentage (%)'}
                    </p>
                    <Input
                      type="number"
                      value={lateFeeSettings.feeAmount}
                      onChange={(e) => setLateFeeSettings({ ...lateFeeSettings, feeAmount: Number(e.target.value) })}
                      className="h-9 text-sm bg-slate-800 border-white/10"
                      min={0}
                      step={lateFeeSettings.feeType === 'percentage' ? 0.5 : 1}
                    />
                  </div>

                  {lateFeeSettings.feeType === 'percentage' && (
                    <div>
                      <p className="text-xs text-slate-300 mb-1.5">Max fee cap ($)</p>
                      <Input
                        type="number"
                        value={lateFeeSettings.maxFee || ''}
                        onChange={(e) => setLateFeeSettings({ ...lateFeeSettings, maxFee: e.target.value ? Number(e.target.value) : undefined })}
                        className="h-9 text-sm bg-slate-800 border-white/10"
                        placeholder="No cap"
                        min={0}
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="notifyTenant"
                    checked={lateFeeSettings.notifyTenant}
                    onCheckedChange={(checked) => setLateFeeSettings({ ...lateFeeSettings, notifyTenant: !!checked })}
                  />
                  <label htmlFor="notifyTenant" className="text-xs text-slate-300">
                    Notify tenant when fee is applied
                  </label>
                </div>

                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-200/90">
                    Late fees run daily at 10 AM UTC. Fees are applied to payments past the grace period.
                  </p>
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setLateFeeModalOpen(false)} className="border-white/10">
                Cancel
              </Button>
              <Button onClick={saveLateFeeSettings} disabled={savingLateFees} className="bg-amber-600 hover:bg-amber-500">
                {savingLateFees && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Save Settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
