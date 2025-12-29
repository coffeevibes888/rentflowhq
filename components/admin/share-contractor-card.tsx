'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Wrench, 
  QrCode, 
  Copy, 
  Check, 
  Mail, 
  MessageSquare,
  ExternalLink,
  Smartphone,
  RefreshCw,
  Ticket
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ShareContractorCardProps {
  contractorUrl: string;
  landlordName: string;
}

export default function ShareContractorCard({ contractorUrl, landlordName }: ShareContractorCardProps) {
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch existing invite code on mount
  useEffect(() => {
    fetchInviteCode();
  }, []);

  const fetchInviteCode = async () => {
    try {
      const res = await fetch('/api/contractor/invite');
      const data = await res.json();
      if (data.inviteCode) {
        setInviteCode(data.inviteCode);
      }
    } catch (error) {
      console.error('Failed to fetch invite code:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewCode = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/contractor/invite', { method: 'POST' });
      const data = await res.json();
      if (data.inviteCode) {
        setInviteCode(data.inviteCode);
        toast({ title: 'New invite code generated!', description: `Code: ${data.inviteCode}` });
      } else {
        toast({ title: 'Failed to generate code', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Failed to generate code', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(contractorUrl)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(contractorUrl);
      setCopied(true);
      toast({ title: 'Link copied!', description: 'Contractor sign-up URL copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

  const handleCopyCode = async () => {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCodeCopied(true);
      toast({ title: 'Invite code copied!', description: `Code: ${inviteCode}` });
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

  const handleSendText = async () => {
    if (!phoneNumber.trim()) {
      toast({ title: 'Enter a phone number', variant: 'destructive' });
      return;
    }

    const message = inviteCode 
      ? `${landlordName} is inviting you to join as a contractor!\n\nSign up: ${contractorUrl}\nInvite Code: ${inviteCode}`
      : `${landlordName} is inviting you to join as a contractor: ${contractorUrl}`;
    const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
    window.open(smsUrl, '_blank');
    
    toast({ title: 'Opening SMS app...', description: 'Complete sending in your messaging app' });
  };

  const handleSendEmail = async () => {
    if (!email.trim()) {
      toast({ title: 'Enter an email address', variant: 'destructive' });
      return;
    }

    const subject = `Join ${landlordName} as a Contractor`;
    const body = inviteCode
      ? `Hi,\n\nYou've been invited to join as a contractor for ${landlordName}.\n\nSign up here:\n${contractorUrl}\n\nYour Invite Code: ${inviteCode}\n\nEnter this code during sign-up to connect with us.\n\nBest regards,\n${landlordName}`
      : `Hi,\n\nYou've been invited to join as a contractor for ${landlordName}.\n\nSign up here:\n${contractorUrl}\n\nBest regards,\n${landlordName}`;
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');
    
    toast({ title: 'Opening email app...', description: 'Complete sending in your email app' });
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        const shareText = inviteCode 
          ? `You've been invited to join as a contractor!\nInvite Code: ${inviteCode}`
          : `You've been invited to join as a contractor`;
        await navigator.share({
          title: `Join ${landlordName} as a Contractor`,
          text: shareText,
          url: contractorUrl,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      handleCopy();
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className='w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 border border-emerald-400/30 p-4 space-y-2 backdrop-blur-sm hover:from-emerald-500 hover:to-teal-500 transition-all shadow-2xl drop-shadow-2xl text-left'>
          <div className='flex items-center justify-between'>
            <div className='text-xs text-emerald-100 font-medium'>Invite Contractor</div>
            <Wrench className='h-4 w-4 text-white' />
          </div>
          <div className='text-lg font-bold text-white'>Send Link</div>
          <div className='text-[10px] text-emerald-200'>QR code, text, or email</div>
        </button>
      </DialogTrigger>
      
      <DialogContent className='sm:max-w-md bg-slate-900 border-white/10 text-white'>
        <DialogHeader>
          <DialogTitle className='text-white flex items-center gap-2'>
            <Wrench className='h-5 w-5 text-emerald-400' />
            Invite a Contractor
          </DialogTitle>
          <DialogDescription className='text-slate-400'>
            Send your contractor sign-up link and invite code
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          {/* Invite Code Section */}
          <div className='space-y-2'>
            <label className='text-xs font-medium text-slate-300 flex items-center gap-2'>
              <Ticket className='h-3 w-3' />
              Invite Code
            </label>
            <div className='flex gap-2'>
              <div className='flex-1 bg-slate-800 border border-white/10 rounded-md px-3 py-2 font-mono text-lg tracking-wider text-emerald-400'>
                {isLoading ? '...' : inviteCode || 'No code yet'}
              </div>
              <Button
                onClick={handleCopyCode}
                variant='outline'
                size='sm'
                disabled={!inviteCode}
                className='border-white/10 bg-slate-800 hover:bg-slate-700 px-3'
              >
                {codeCopied ? <Check className='h-4 w-4 text-emerald-400' /> : <Copy className='h-4 w-4' />}
              </Button>
              <Button
                onClick={generateNewCode}
                variant='outline'
                size='sm'
                disabled={isGenerating}
                className='border-white/10 bg-slate-800 hover:bg-slate-700 px-3'
              >
                <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <p className='text-[10px] text-slate-500'>
              Contractors enter this code during sign-up to connect with you
            </p>
          </div>

          {/* Copy Link */}
          <div className='space-y-2'>
            <label className='text-xs font-medium text-slate-300'>Contractor Sign-up URL</label>
            <div className='flex gap-2'>
              <Input
                value={contractorUrl}
                readOnly
                className='bg-slate-800 border-white/10 text-white text-sm'
              />
              <Button
                onClick={handleCopy}
                variant='outline'
                size='sm'
                className='border-white/10 bg-slate-800 hover:bg-slate-700 px-3'
              >
                {copied ? <Check className='h-4 w-4 text-emerald-400' /> : <Copy className='h-4 w-4' />}
              </Button>
            </div>
          </div>

          {/* QR Code */}
          <div className='space-y-2'>
            <Button
              onClick={() => setShowQR(!showQR)}
              variant='outline'
              className='w-full border-white/10 bg-slate-800 hover:bg-slate-700 justify-start gap-2'
            >
              <QrCode className='h-4 w-4 text-emerald-400' />
              {showQR ? 'Hide QR Code' : 'Show QR Code'}
            </Button>
            
            {showQR && (
              <div className='flex flex-col items-center p-4 bg-white rounded-xl'>
                <img
                  src={qrCodeUrl}
                  alt='QR Code for contractor sign-up'
                  className='w-48 h-48'
                />
                <p className='text-xs text-slate-600 mt-2 text-center'>
                  Scan to sign up as contractor
                </p>
                {inviteCode && (
                  <p className='text-sm font-mono font-bold text-emerald-600 mt-1'>
                    Code: {inviteCode}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Native Share (mobile) */}
          {'share' in navigator && (
            <Button
              onClick={handleNativeShare}
              className='w-full bg-emerald-600 hover:bg-emerald-500 gap-2'
            >
              <Smartphone className='h-4 w-4' />
              Share via Apps
            </Button>
          )}

          {/* Send via Text */}
          <div className='space-y-2'>
            <label className='text-xs font-medium text-slate-300'>Send via Text Message</label>
            <div className='flex gap-2'>
              <Input
                type='tel'
                placeholder='Phone number'
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className='bg-slate-800 border-white/10 text-white text-sm'
              />
              <Button
                onClick={handleSendText}
                variant='outline'
                size='sm'
                className='border-white/10 bg-slate-800 hover:bg-slate-700 px-3'
              >
                <MessageSquare className='h-4 w-4' />
              </Button>
            </div>
          </div>

          {/* Send via Email */}
          <div className='space-y-2'>
            <label className='text-xs font-medium text-slate-300'>Send via Email</label>
            <div className='flex gap-2'>
              <Input
                type='email'
                placeholder='Email address'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className='bg-slate-800 border-white/10 text-white text-sm'
              />
              <Button
                onClick={handleSendEmail}
                variant='outline'
                size='sm'
                className='border-white/10 bg-slate-800 hover:bg-slate-700 px-3'
              >
                <Mail className='h-4 w-4' />
              </Button>
            </div>
          </div>

          {/* Open Link */}
          <Button
            onClick={() => window.open(contractorUrl, '_blank')}
            variant='outline'
            className='w-full border-white/10 bg-slate-800 hover:bg-slate-700 gap-2'
          >
            <ExternalLink className='h-4 w-4' />
            Preview Sign-up Page
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
