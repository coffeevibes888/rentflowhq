'use client';

import { useState, useEffect } from 'react';
import { Shield, ShieldCheck, ShieldOff, Copy, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface TwoFactorSettingsProps {
  userId: string;
  initialEnabled?: boolean;
}

export default function TwoFactorSettings({ userId, initialEnabled = false }: TwoFactorSettingsProps) {
  const [isEnabled, setIsEnabled] = useState(initialEnabled);
  const [isLoading, setIsLoading] = useState(false);
  const [setupData, setSetupData] = useState<{
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [showDisable, setShowDisable] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);
  const { toast } = useToast();

  const handleSetup = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setSetupData(data);
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to set up 2FA',
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

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      toast({
        title: 'Invalid Code',
        description: 'Please enter a 6-digit code.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verificationCode }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setIsEnabled(true);
        setSetupData(null);
        setVerificationCode('');
        toast({
          title: 'Success',
          description: '2FA has been enabled on your account.',
        });
      } else {
        toast({
          title: 'Invalid Code',
          description: data.message || 'Please check your code and try again.',
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

  const handleDisable = async () => {
    if (disableCode.length < 6) {
      toast({
        title: 'Invalid Code',
        description: 'Please enter your 2FA code or backup code.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: disableCode }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setIsEnabled(false);
        setShowDisable(false);
        setDisableCode('');
        toast({
          title: 'Success',
          description: '2FA has been disabled.',
        });
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Invalid code. Please try again.',
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

  const copyBackupCodes = () => {
    if (setupData?.backupCodes) {
      navigator.clipboard.writeText(setupData.backupCodes.join('\n'));
      setCopiedBackup(true);
      setTimeout(() => setCopiedBackup(false), 2000);
    }
  };

  return (
    <div className='rounded-xl border border-white/10 bg-slate-900/60 p-6 space-y-6'>
      <div className='flex items-start justify-between'>
        <div className='flex items-center gap-3'>
          {isEnabled ? (
            <div className='rounded-full bg-emerald-500/20 p-2 border border-emerald-500/30'>
              <ShieldCheck className='h-5 w-5 text-emerald-400' />
            </div>
          ) : (
            <div className='rounded-full bg-amber-500/20 p-2 border border-amber-500/30'>
              <Shield className='h-5 w-5 text-amber-400' />
            </div>
          )}
          <div>
            <h3 className='font-semibold text-white'>Two-Factor Authentication</h3>
            <p className='text-sm text-slate-400'>
              {isEnabled 
                ? 'Your account is protected with 2FA' 
                : 'Add an extra layer of security to your account'}
            </p>
          </div>
        </div>
        
        {isEnabled && !showDisable && (
          <Button
            variant='outline'
            size='sm'
            onClick={() => setShowDisable(true)}
            className='text-red-400 border-red-500/30 hover:bg-red-500/10'
          >
            <ShieldOff className='h-4 w-4 mr-2' />
            Disable
          </Button>
        )}
      </div>

      {/* Setup Flow */}
      {!isEnabled && !setupData && (
        <div className='space-y-4'>
          <div className='rounded-lg bg-amber-500/10 border border-amber-500/20 p-4'>
            <div className='flex items-start gap-3'>
              <AlertTriangle className='h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5' />
              <div className='text-sm text-amber-200'>
                <p className='font-medium mb-1'>Recommended for landlords</p>
                <p className='text-amber-200/80'>
                  2FA protects your account from unauthorized access, especially important since you handle financial transactions and sensitive tenant data.
                </p>
              </div>
            </div>
          </div>
          
          <Button onClick={handleSetup} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                Setting up...
              </>
            ) : (
              <>
                <Shield className='h-4 w-4 mr-2' />
                Enable 2FA
              </>
            )}
          </Button>
        </div>
      )}

      {/* QR Code and Verification */}
      {setupData && (
        <div className='space-y-6'>
          <div className='space-y-4'>
            <div>
              <h4 className='font-medium text-white mb-2'>1. Scan QR Code</h4>
              <p className='text-sm text-slate-400 mb-4'>
                Open your authenticator app (Google Authenticator, Authy, etc.) and scan this QR code:
              </p>
              <div className='bg-white p-4 rounded-lg inline-block'>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setupData.qrCodeUrl)}`}
                  alt='2FA QR Code'
                  className='w-48 h-48'
                />
              </div>
            </div>

            <div>
              <h4 className='font-medium text-white mb-2'>2. Save Backup Codes</h4>
              <p className='text-sm text-slate-400 mb-3'>
                Store these codes safely. You can use them to access your account if you lose your phone.
              </p>
              <div className='bg-slate-800 rounded-lg p-4 font-mono text-sm'>
                <div className='grid grid-cols-2 gap-2'>
                  {setupData.backupCodes.map((code, i) => (
                    <div key={i} className='text-slate-300'>{code}</div>
                  ))}
                </div>
              </div>
              <Button
                variant='outline'
                size='sm'
                onClick={copyBackupCodes}
                className='mt-3'
              >
                {copiedBackup ? (
                  <>
                    <CheckCircle2 className='h-4 w-4 mr-2 text-emerald-400' />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className='h-4 w-4 mr-2' />
                    Copy Codes
                  </>
                )}
              </Button>
            </div>

            <div>
              <h4 className='font-medium text-white mb-2'>3. Verify Setup</h4>
              <p className='text-sm text-slate-400 mb-3'>
                Enter the 6-digit code from your authenticator app:
              </p>
              <div className='flex gap-3'>
                <Input
                  type='text'
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder='000000'
                  className='w-32 text-center font-mono text-lg tracking-widest'
                  maxLength={6}
                />
                <Button onClick={handleVerify} disabled={isLoading || verificationCode.length !== 6}>
                  {isLoading ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    'Verify & Enable'
                  )}
                </Button>
              </div>
            </div>
          </div>

          <Button
            variant='ghost'
            onClick={() => setSetupData(null)}
            className='text-slate-400'
          >
            Cancel Setup
          </Button>
        </div>
      )}

      {/* Disable Flow */}
      {showDisable && (
        <div className='space-y-4 pt-4 border-t border-white/10'>
          <div className='rounded-lg bg-red-500/10 border border-red-500/20 p-4'>
            <p className='text-sm text-red-200'>
              Enter your 2FA code or a backup code to disable two-factor authentication.
            </p>
          </div>
          
          <div className='flex gap-3'>
            <Input
              type='text'
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value.toUpperCase())}
              placeholder='Enter code'
              className='w-40 font-mono'
            />
            <Button 
              variant='destructive' 
              onClick={handleDisable} 
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                'Disable 2FA'
              )}
            </Button>
            <Button
              variant='ghost'
              onClick={() => {
                setShowDisable(false);
                setDisableCode('');
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
