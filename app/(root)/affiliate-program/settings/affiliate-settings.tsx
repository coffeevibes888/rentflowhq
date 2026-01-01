'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  User, 
  CreditCard, 
  DollarSign, 
  Save, 
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

interface AffiliateData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  code: string;
  paymentMethod: string | null;
  paymentEmail: string | null;
  paymentPhone: string | null;
  bankAccountLast4: string | null;
  minimumPayout: number;
  tier: string;
  commissionBasic: number;
  commissionPro: number;
  commissionEnterprise: number;
}

interface AffiliateSettingsProps {
  initialData: AffiliateData;
}

export default function AffiliateSettings({ initialData }: AffiliateSettingsProps) {
  const [formData, setFormData] = useState({
    name: initialData.name,
    phone: initialData.phone || '',
    paymentMethod: initialData.paymentMethod || '',
    paymentEmail: initialData.paymentEmail || '',
    paymentPhone: initialData.paymentPhone || '',
    bankRoutingNumber: '',
    bankAccountNumber: '',
    bankAccountType: 'checking',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/affiliate/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update settings');
      }

      setMessage({ type: 'success', text: 'Settings updated successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Something went wrong' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="mb-8">
        <Link 
          href="/affiliate-program/dashboard" 
          className="inline-flex items-center text-slate-400 hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-white">Account Settings</h1>
        <p className="text-slate-400">Manage your affiliate account and payment information</p>
      </div>

      {message && (
        <div className={`flex items-center gap-2 p-4 rounded-lg mb-6 ${
          message.type === 'success' 
            ? 'bg-green-500/10 border border-green-500/30 text-green-400' 
            : 'bg-red-500/10 border border-red-500/30 text-red-400'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Account Info */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <User className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Account Information</h2>
              <p className="text-sm text-slate-400">Your basic account details</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="name" className="text-slate-300">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-slate-300">Email Address</Label>
              <Input
                id="email"
                value={initialData.email}
                disabled
                className="bg-slate-800/50 border-slate-700 text-slate-400"
              />
              <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
            </div>
            <div>
              <Label htmlFor="phone" className="text-slate-300">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => updateFormData('phone', e.target.value)}
                className="bg-slate-800 border-slate-600 text-white"
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <Label className="text-slate-300">Referral Code</Label>
              <Input
                value={initialData.code}
                disabled
                className="bg-slate-800/50 border-slate-700 text-violet-400 font-mono"
              />
              <p className="text-xs text-slate-500 mt-1">Your unique referral code</p>
            </div>
          </div>
        </div>

        {/* Commission Info */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Commission Rates</h2>
              <p className="text-sm text-slate-400">Your current commission structure</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 text-center">
              <p className="text-sm text-slate-400 mb-1">Pro Plan</p>
              <p className="text-2xl font-bold text-green-400">${initialData.commissionBasic}</p>
              <p className="text-xs text-slate-500">per referral</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 text-center">
              <p className="text-sm text-slate-400 mb-1">Professional Plan</p>
              <p className="text-2xl font-bold text-green-400">${initialData.commissionPro}</p>
              <p className="text-xs text-slate-500">per referral</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 text-center">
              <p className="text-sm text-slate-400 mb-1">Enterprise Plan</p>
              <p className="text-2xl font-bold text-green-400">${initialData.commissionEnterprise}</p>
              <p className="text-xs text-slate-500">per referral</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between p-4 rounded-lg bg-violet-500/10 border border-violet-500/30">
            <div>
              <p className="text-sm text-slate-300">Current Tier</p>
              <p className="text-lg font-semibold text-violet-400 capitalize">{initialData.tier}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-300">Minimum Payout</p>
              <p className="text-lg font-semibold text-white">${initialData.minimumPayout}</p>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Payment Information</h2>
              <p className="text-sm text-slate-400">How you'll receive your commissions</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <Label className="text-slate-300">Payment Method</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value) => updateFormData('paymentMethod', value)}
              >
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="venmo">Venmo</SelectItem>
                  <SelectItem value="bank">Bank Transfer (ACH)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.paymentMethod === 'paypal' && (
              <div>
                <Label htmlFor="paymentEmail" className="text-slate-300">PayPal Email</Label>
                <Input
                  id="paymentEmail"
                  type="email"
                  value={formData.paymentEmail}
                  onChange={(e) => updateFormData('paymentEmail', e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white"
                  placeholder="paypal@example.com"
                />
              </div>
            )}

            {formData.paymentMethod === 'venmo' && (
              <div>
                <Label htmlFor="paymentPhone" className="text-slate-300">Venmo Phone Number</Label>
                <Input
                  id="paymentPhone"
                  type="tel"
                  value={formData.paymentPhone}
                  onChange={(e) => updateFormData('paymentPhone', e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white"
                  placeholder="(555) 123-4567"
                />
              </div>
            )}

            {formData.paymentMethod === 'bank' && (
              <>
                {initialData.bankAccountLast4 && (
                  <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                    <p className="text-sm text-slate-400">Current Account</p>
                    <p className="text-white">Account ending in ****{initialData.bankAccountLast4}</p>
                  </div>
                )}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bankRoutingNumber" className="text-slate-300">Routing Number</Label>
                    <Input
                      id="bankRoutingNumber"
                      value={formData.bankRoutingNumber}
                      onChange={(e) => updateFormData('bankRoutingNumber', e.target.value.replace(/\D/g, ''))}
                      className="bg-slate-800 border-slate-600 text-white"
                      placeholder="9 digits"
                      maxLength={9}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bankAccountNumber" className="text-slate-300">Account Number</Label>
                    <Input
                      id="bankAccountNumber"
                      value={formData.bankAccountNumber}
                      onChange={(e) => updateFormData('bankAccountNumber', e.target.value.replace(/\D/g, ''))}
                      className="bg-slate-800 border-slate-600 text-white"
                      placeholder="Account number"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-slate-300">Account Type</Label>
                  <Select
                    value={formData.bankAccountType}
                    onValueChange={(value) => updateFormData('bankAccountType', value)}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="checking">Checking</SelectItem>
                      <SelectItem value="savings">Savings</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
