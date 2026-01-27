'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Save, DollarSign, Shield, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BookingSettingsProps {
  contractorId: string;
}

export default function BookingSettings({ contractorId }: BookingSettingsProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    instantBookingEnabled: false,
    depositRequired: false,
    depositAmount: 0,
    depositPercent: 0,
    cancellationPolicy: 'moderate',
    cancellationHours: 24,
    bookingInstructions: '',
    autoConfirm: true,
    requireApproval: false,
  });

  useEffect(() => {
    fetchSettings();
  }, [contractorId]);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`/api/contractor/profile?id=${contractorId}`);
      if (res.ok) {
        const data = await res.json();
        setSettings({
          instantBookingEnabled: data.instantBookingEnabled || false,
          depositRequired: data.depositRequired || false,
          depositAmount: data.depositAmount ? Number(data.depositAmount) : 0,
          depositPercent: data.depositPercent ? Number(data.depositPercent) : 0,
          cancellationPolicy: data.cancellationPolicy || 'moderate',
          cancellationHours: data.cancellationHours || 24,
          bookingInstructions: data.bookingInstructions || '',
          autoConfirm: data.autoConfirm !== false,
          requireApproval: data.requireApproval || false,
        });
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/contractor/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractorId, ...settings }),
      });

      if (res.ok) {
        toast({ title: 'Booking settings updated successfully' });
      } else {
        throw new Error('Failed to update');
      }
    } catch (error) {
      toast({ title: 'Failed to update settings', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-black">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Instant Booking */}
      <Card className="rounded-xl bg-gradient-to-r from-sky-500 via-cyan-300 to-sky-500 shadow-2xl border border-slate-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-black">
            <Clock className="h-5 w-5" />
            Instant Booking
          </CardTitle>
          <CardDescription className="text-black/80">
            Allow customers to book appointments instantly without waiting for approval
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-white border border-black">
            <div className="space-y-0.5">
              <Label className="text-black font-medium">Enable Instant Booking</Label>
              <p className="text-sm text-black/70">
                Customers can book immediately based on your availability
              </p>
            </div>
            <Switch
              checked={settings.instantBookingEnabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, instantBookingEnabled: checked })
              }
              className="data-[state=checked]:bg-violet-600"
            />
          </div>

          {settings.instantBookingEnabled && (
            <>
              <div className="flex items-center justify-between p-4 rounded-lg bg-white border border-black">
                <div className="space-y-0.5">
                  <Label className="text-black font-medium">Auto-Confirm Bookings</Label>
                  <p className="text-sm text-black/70">
                    Automatically confirm bookings without manual review
                  </p>
                </div>
                <Switch
                  checked={settings.autoConfirm}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, autoConfirm: checked })
                  }
                  className="data-[state=checked]:bg-violet-600"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-black font-medium">Booking Instructions (Optional)</Label>
                <Textarea
                  placeholder="e.g., Please provide photos of the issue, exact address, parking instructions..."
                  value={settings.bookingInstructions}
                  onChange={(e) =>
                    setSettings({ ...settings, bookingInstructions: e.target.value })
                  }
                  rows={3}
                  className="bg-white border-black text-black placeholder:text-black/50"
                />
                <p className="text-xs text-black/70">
                  These instructions will be shown to customers during booking
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Deposit Settings */}
      <Card className="rounded-xl bg-gradient-to-r from-sky-500 via-cyan-300 to-sky-500 shadow-2xl border border-slate-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-black">
            <DollarSign className="h-5 w-5" />
            Deposit Requirements
          </CardTitle>
          <CardDescription className="text-black/80">
            Require a deposit to secure bookings and reduce no-shows
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-white border border-black">
            <div className="space-y-0.5">
              <Label className="text-black font-medium">Require Deposit</Label>
              <p className="text-sm text-black/70">
                Customers must pay a deposit when booking
              </p>
            </div>
            <Switch
              checked={settings.depositRequired}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, depositRequired: checked })
              }
              className="data-[state=checked]:bg-violet-600"
            />
          </div>

          {settings.depositRequired && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-black font-medium">Fixed Amount ($)</Label>
                <Input
                  type="number"
                  min="0"
                  step="10"
                  value={settings.depositAmount}
                  onChange={(e) =>
                    setSettings({ ...settings, depositAmount: parseFloat(e.target.value) || 0 })
                  }
                  className="bg-white border-black text-black"
                />
                <p className="text-xs text-black/70">
                  Fixed deposit amount per booking
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-black font-medium">Percentage (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.depositPercent}
                  onChange={(e) =>
                    setSettings({ ...settings, depositPercent: parseFloat(e.target.value) || 0 })
                  }
                  className="bg-white border-black text-black"
                />
                <p className="text-xs text-black/70">
                  Or percentage of total cost
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancellation Policy */}
      <Card className="rounded-xl bg-gradient-to-r from-sky-500 via-cyan-300 to-sky-500 shadow-2xl border border-slate-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-black">
            <Shield className="h-5 w-5" />
            Cancellation Policy
          </CardTitle>
          <CardDescription className="text-black/80">
            Set your cancellation policy and refund rules
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-black font-medium">Cancellation Policy</Label>
            <Select
              value={settings.cancellationPolicy}
              onValueChange={(value) =>
                setSettings({ ...settings, cancellationPolicy: value })
              }
            >
              <SelectTrigger className="bg-white border-black text-black">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-black">
                <SelectItem value="flexible">
                  Flexible - 50% refund anytime
                </SelectItem>
                <SelectItem value="moderate">
                  Moderate - Full refund with notice, no refund if late
                </SelectItem>
                <SelectItem value="strict">
                  Strict - No refunds
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-black font-medium">Cancellation Notice (hours)</Label>
            <Input
              type="number"
              min="1"
              max="168"
              value={settings.cancellationHours}
              onChange={(e) =>
                setSettings({ ...settings, cancellationHours: parseInt(e.target.value) || 24 })
              }
              className="bg-white border-black text-black"
            />
            <p className="text-xs text-black/70">
              Hours of notice required for full refund (moderate policy)
            </p>
          </div>

          {/* Policy Explanation */}
          <div className="p-4 rounded-lg bg-white border border-black text-sm space-y-2">
            <p className="font-medium text-black">Your Current Policy:</p>
            {settings.cancellationPolicy === 'flexible' && (
              <p className="text-black/80">Customers receive 50% refund regardless of when they cancel.</p>
            )}
            {settings.cancellationPolicy === 'moderate' && (
              <p className="text-black/80">
                Customers receive full refund if cancelled {settings.cancellationHours}+ hours in advance.
                No refund for late cancellations.
              </p>
            )}
            {settings.cancellationPolicy === 'strict' && (
              <p className="text-black/80">No refunds for any cancellations.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full bg-black text-white hover:bg-black/90" size="lg">
        <Save className="h-4 w-4 mr-2" />
        {saving ? 'Saving...' : 'Save Booking Settings'}
      </Button>
    </div>
  );
}
