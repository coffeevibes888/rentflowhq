'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Loader2, Check, DollarSign, Clock, PawPrint, Sparkles, Crown, ChevronDown, Bell, Building2 } from 'lucide-react';
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

export function FeeSettings({ isPro }: FeeSettingsProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  
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
      const [propsRes, feesRes] = await Promise.all([
        fetch('/api/landlord/properties'),
        fetch('/api/landlord/fee-settings'),
      ]);

      if (propsRes.ok) {
        const data = await propsRes.json();
        setProperties(data.properties || []);
      }

      if (feesRes.ok) {
        const data = await feesRes.json();
        if (data.settings) {
          // Map the settings to our state structure
          // This would need to be updated based on actual API response
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
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
            <div className="flex items-center gap-2 mb-2">
              <Bell className="w-4 h-4 text-violet-400" />
              <span className="text-sm font-medium text-white">Automatic Rent Reminders</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Send automated email reminders before rent is due (7, 3, 1 days before)
            </p>
            <Link href="/admin/communications" className="text-xs text-violet-400 hover:text-violet-300">
              Configure in Communications →
            </Link>
          </div>
          
          {/* Late Fees */}
          <div className="rounded-lg border border-white/10 bg-slate-900/40 p-3">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-white">Automatic Late Fees</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Automatically apply late fees after grace period expires
            </p>
            <Link href="/admin/communications" className="text-xs text-amber-400 hover:text-amber-300">
              Configure in Communications →
            </Link>
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
    </div>
  );
}
