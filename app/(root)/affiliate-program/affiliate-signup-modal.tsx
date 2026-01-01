'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AffiliateSignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'info' | 'payment' | 'agreement' | 'success';

export default function AffiliateSignUpModal({ isOpen, onClose }: AffiliateSignUpModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('info');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
    paymentMethod: '',
    paymentEmail: '',
    paymentPhone: '',
    bankRoutingNumber: '',
    bankAccountNumber: '',
    bankAccountType: 'checking',
    agreedToTerms: false,
    agreedToWaiver: false,
  });

  const [affiliateData, setAffiliateData] = useState<{
    code: string;
    referralLink: string;
  } | null>(null);

  const updateFormData = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const validateStep = (currentStep: Step): boolean => {
    switch (currentStep) {
      case 'info':
        if (!formData.name || !formData.email || !formData.password) {
          setError('Please fill in all required fields');
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          return false;
        }
        if (formData.password.length < 8) {
          setError('Password must be at least 8 characters');
          return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          setError('Please enter a valid email address');
          return false;
        }
        return true;
      case 'payment':
        if (!formData.paymentMethod) {
          setError('Please select a payment method');
          return false;
        }
        if (formData.paymentMethod === 'paypal' && !formData.paymentEmail) {
          setError('Please enter your PayPal email');
          return false;
        }
        if (formData.paymentMethod === 'venmo' && !formData.paymentPhone) {
          setError('Please enter your Venmo phone number');
          return false;
        }
        if (formData.paymentMethod === 'bank' && (!formData.bankRoutingNumber || !formData.bankAccountNumber)) {
          setError('Please enter your bank account details');
          return false;
        }
        return true;
      case 'agreement':
        if (!formData.agreedToTerms || !formData.agreedToWaiver) {
          setError('You must agree to all terms to continue');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (!validateStep(step)) return;

    if (step === 'info') {
      setStep('payment');
    } else if (step === 'payment') {
      setStep('agreement');
    } else if (step === 'agreement') {
      await handleSubmit();
    }
  };

  const handleBack = () => {
    if (step === 'payment') setStep('info');
    else if (step === 'agreement') setStep('payment');
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/affiliate/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          preferredCode: formData.referralCode || undefined,
          paymentMethod: formData.paymentMethod,
          paymentEmail: formData.paymentEmail || undefined,
          paymentPhone: formData.paymentPhone || undefined,
          bankRoutingNumber: formData.bankRoutingNumber || undefined,
          bankAccountNumber: formData.bankAccountNumber || undefined,
          bankAccountType: formData.bankAccountType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create affiliate account');
      }

      setAffiliateData({
        code: data.affiliate.code,
        referralLink: data.referralLink,
      });
      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (step === 'success') {
      router.push('/affiliate-program/dashboard');
    }
    onClose();
    // Reset form after close
    setTimeout(() => {
      setStep('info');
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        referralCode: '',
        paymentMethod: '',
        paymentEmail: '',
        paymentPhone: '',
        bankRoutingNumber: '',
        bankAccountNumber: '',
        bankAccountType: 'checking',
        agreedToTerms: false,
        agreedToWaiver: false,
      });
      setError('');
      setAffiliateData(null);
    }, 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">
            {step === 'info' && 'Create Affiliate Account'}
            {step === 'payment' && 'Payment Information'}
            {step === 'agreement' && 'Terms & Agreement'}
            {step === 'success' && 'Welcome to the Program!'}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {step === 'info' && 'Enter your details to join the affiliate program'}
            {step === 'payment' && 'How would you like to receive your commissions?'}
            {step === 'agreement' && 'Please review and accept our terms'}
            {step === 'success' && 'Your affiliate account has been created'}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        {step !== 'success' && (
          <div className="flex items-center justify-center gap-2 py-4">
            {['info', 'payment', 'agreement'].map((s, i) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === s ? 'bg-violet-600 text-white' : 
                  ['info', 'payment', 'agreement'].indexOf(step) > i ? 'bg-green-600 text-white' : 
                  'bg-slate-700 text-slate-400'
                }`}>
                  {['info', 'payment', 'agreement'].indexOf(step) > i ? '✓' : i + 1}
                </div>
                {i < 2 && <div className={`w-12 h-0.5 ${
                  ['info', 'payment', 'agreement'].indexOf(step) > i ? 'bg-green-600' : 'bg-slate-700'
                }`} />}
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Step 1: Basic Info */}
        {step === 'info' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-slate-300">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                className="bg-slate-800 border-slate-600 text-white"
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-slate-300">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData('email', e.target.value)}
                className="bg-slate-800 border-slate-600 text-white"
                placeholder="john@example.com"
              />
            </div>
            <div>
              <Label htmlFor="phone" className="text-slate-300">Phone Number (Optional)</Label>
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
              <Label htmlFor="password" className="text-slate-300">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => updateFormData('password', e.target.value)}
                className="bg-slate-800 border-slate-600 text-white"
                placeholder="Min 8 characters"
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword" className="text-slate-300">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                className="bg-slate-800 border-slate-600 text-white"
                placeholder="Confirm your password"
              />
            </div>
            <div>
              <Label htmlFor="referralCode" className="text-slate-300">Preferred Referral Code (Optional)</Label>
              <Input
                id="referralCode"
                value={formData.referralCode}
                onChange={(e) => updateFormData('referralCode', e.target.value.toUpperCase())}
                className="bg-slate-800 border-slate-600 text-white uppercase"
                placeholder="e.g., JOHN2024"
                maxLength={12}
              />
              <p className="text-xs text-slate-500 mt-1">Leave blank for auto-generated code</p>
            </div>
          </div>
        )}

        {/* Step 2: Payment Info */}
        {step === 'payment' && (
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Payment Method *</Label>
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
                <Label htmlFor="paymentEmail" className="text-slate-300">PayPal Email *</Label>
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
                <Label htmlFor="paymentPhone" className="text-slate-300">Venmo Phone Number *</Label>
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
                <div>
                  <Label htmlFor="bankRoutingNumber" className="text-slate-300">Routing Number *</Label>
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
                  <Label htmlFor="bankAccountNumber" className="text-slate-300">Account Number *</Label>
                  <Input
                    id="bankAccountNumber"
                    value={formData.bankAccountNumber}
                    onChange={(e) => updateFormData('bankAccountNumber', e.target.value.replace(/\D/g, ''))}
                    className="bg-slate-800 border-slate-600 text-white"
                    placeholder="Account number"
                  />
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

            <p className="text-xs text-slate-500">
              Your payment information is encrypted and secure. You can update this later in your dashboard.
            </p>
          </div>
        )}

        {/* Step 3: Agreement */}
        {step === 'agreement' && (
          <div className="space-y-6">
            <div className="max-h-48 overflow-y-auto p-4 rounded-lg bg-slate-800/50 border border-slate-700 text-sm text-slate-300">
              <h4 className="font-semibold text-white mb-2">Affiliate Program Terms</h4>
              <p className="mb-3">By joining the Property Flow HQ Affiliate Program, you agree to:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>Promote Property Flow HQ honestly and ethically</li>
                <li>Not engage in spam, misleading advertising, or fraudulent activities</li>
                <li>Not bid on Property Flow HQ brand terms in paid advertising</li>
                <li>Not create fake accounts or self-refer</li>
                <li>Accept the 30-day commission hold period</li>
                <li>Maintain a minimum $25 balance for payout requests</li>
                <li>Understand that commissions may be reversed if fraud is detected</li>
                <li>Comply with all applicable laws and regulations</li>
              </ul>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={formData.agreedToTerms}
                onCheckedChange={(checked) => updateFormData('agreedToTerms', checked as boolean)}
                className="mt-1"
              />
              <Label htmlFor="terms" className="text-slate-300 text-sm cursor-pointer">
                I have read and agree to the <a href="/terms" target="_blank" className="text-violet-400 hover:underline">Terms of Service</a> and Affiliate Program Terms
              </Label>
            </div>

            <div className="max-h-48 overflow-y-auto p-4 rounded-lg bg-slate-800/50 border border-slate-700 text-sm text-slate-300">
              <h4 className="font-semibold text-white mb-2">Liability Waiver</h4>
              <p className="text-slate-400">
                I understand and acknowledge that:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 mt-2">
                <li>Property Flow HQ is not responsible for any claims, damages, or losses arising from my promotional activities</li>
                <li>I am an independent contractor, not an employee of Property Flow HQ</li>
                <li>I am responsible for reporting and paying taxes on my affiliate earnings</li>
                <li>Property Flow HQ may terminate my affiliate account at any time for violation of terms</li>
                <li>Pending commissions may be forfeited if my account is terminated for cause</li>
                <li>I will not make any guarantees or promises on behalf of Property Flow HQ</li>
              </ul>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="waiver"
                checked={formData.agreedToWaiver}
                onCheckedChange={(checked) => updateFormData('agreedToWaiver', checked as boolean)}
                className="mt-1"
              />
              <Label htmlFor="waiver" className="text-slate-300 text-sm cursor-pointer">
                I have read and agree to the Liability Waiver and understand my responsibilities as an affiliate
              </Label>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 'success' && affiliateData && (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">You're All Set!</h3>
            <p className="text-slate-400 mb-6">Your affiliate account has been created successfully.</p>
            
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 mb-4">
              <p className="text-sm text-slate-400 mb-1">Your Referral Code</p>
              <p className="text-2xl font-bold text-violet-400 font-mono">{affiliateData.code}</p>
            </div>
            
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 mb-6">
              <p className="text-sm text-slate-400 mb-1">Your Referral Link</p>
              <p className="text-sm text-violet-400 break-all">{affiliateData.referralLink}</p>
            </div>

            <p className="text-sm text-slate-500">
              Check your email for a welcome message with more details. You can access your dashboard to track your progress.
            </p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4 border-t border-slate-700">
          {step !== 'success' && step !== 'info' && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="border-slate-600 text-slate-300"
            >
              Back
            </Button>
          )}
          {step === 'info' && <div />}
          
          {step !== 'success' ? (
            <Button
              onClick={handleNext}
              disabled={isLoading}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {step === 'agreement' ? 'Create Account' : 'Continue'}
            </Button>
          ) : (
            <Button
              onClick={handleClose}
              className="bg-violet-600 hover:bg-violet-700 w-full"
            >
              Go to Dashboard
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
