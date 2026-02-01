'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Check, Mail, Bell, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function NotificationSettings() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    notificationEmail: '',
    newApplications: true,
    maintenanceTickets: true,
    latePayments: true,
    leaseExpiring: true,
    newMessages: true,
    emailInvites: true,
    smsInvites: false,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/landlord/notification-settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings(data.settings);
        }
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/landlord/notification-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        toast({ title: 'Notification settings saved' });
      } else {
        toast({ title: 'Failed to save settings', variant: 'destructive' });
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

  return (
    <div className="space-y-4">
      <div className="rounded-lg sm:rounded-xl bg-gradient-to-r from-sky-500 via-cyan-300 to-sky-500 border border-black p-2.5 sm:p-3 md:p-4 space-y-1 hover:border-slate-700 transition-colors shadow-2xl active:scale-[0.98]">
        <div className="flex items-center gap-2 mb-3">
          <Mail className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-semibold text-white">Email Notifications</h3>
        </div>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-slate-300">Notification Email</Label>
            <Input
              type="email"
              value={settings.notificationEmail}
              onChange={(e) => setSettings({ ...settings, notificationEmail: e.target.value })}
              className="h-9 text-sm mt-1"
              placeholder="notifications@company.com"
            />
            <p className="text-[10px] text-slate-500 mt-1">Leave blank to use your account email</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg sm:rounded-xl bg-gradient-to-r from-sky-500 via-cyan-300 to-sky-500 border border-black p-2.5 sm:p-3 md:p-4 space-y-1 hover:border-slate-700 transition-colors shadow-2xl active:scale-[0.98]">
        <div className="flex items-center gap-2 mb-3">
          <Bell className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white">Alert Preferences</h3>
        </div>
        <div className="space-y-3">
          {[
            { key: 'newApplications', label: 'New rental applications', desc: 'Get notified when someone applies' },
            { key: 'maintenanceTickets', label: 'Maintenance tickets', desc: 'New tickets from tenants' },
            { key: 'latePayments', label: 'Late & partial payments', desc: 'When rent is overdue' },
            { key: 'leaseExpiring', label: 'Lease expiring soon', desc: '60, 30, and 14 days before' },
            { key: 'newMessages', label: 'New messages', desc: 'Tenant and contact messages' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between py-1.5">
              <div>
                <p className="text-xs text-white">{item.label}</p>
                <p className="text-[10px] text-slate-500">{item.desc}</p>
              </div>
              <Switch
                checked={settings[item.key as keyof typeof settings] as boolean}
                onCheckedChange={(checked) => setSettings({ ...settings, [item.key]: checked })}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg sm:rounded-xl bg-gradient-to-r from-sky-500 via-cyan-300 to-sky-500 border border-black p-2.5 sm:p-3 md:p-4 space-y-1 hover:border-slate-700 transition-colors shadow-2xl active:scale-[0.98]">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Tenant Invite Channels</h3>
        </div>
        <p className="text-[10px] text-slate-400 mb-3">How to send invites when adding tenants</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-1.5">
            <div>
              <p className="text-xs text-white">Email invites</p>
              <p className="text-[10px] text-slate-500">Recommended</p>
            </div>
            <Switch
              checked={settings.emailInvites}
              onCheckedChange={(checked) => setSettings({ ...settings, emailInvites: checked })}
            />
          </div>
          <div className="flex items-center justify-between py-1.5">
            <div>
              <p className="text-xs text-white">SMS invites</p>
              <p className="text-[10px] text-slate-500">Coming soon</p>
            </div>
            <Switch
              checked={settings.smsInvites}
              onCheckedChange={(checked) => setSettings({ ...settings, smsInvites: checked })}
              disabled
            />
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto bg-violet-600 hover:bg-violet-500 text-xs h-9">
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Check className="w-3.5 h-3.5 mr-1.5" />}
        Save Notification Settings
      </Button>
    </div>
  );
}
