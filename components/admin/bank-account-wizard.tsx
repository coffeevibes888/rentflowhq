'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  addBankAccountManual,
  verifyBankAccountMicroDeposits,
  createFinancialConnectionsSession,
  attachFinancialConnectionsAccount,
} from '@/lib/actions/landlord-wallet.actions';
import {
  Building2,
  CreditCard,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Landmark,
  Zap,
} from 'lucide-react';

const bankAccountSchema = z
  .object({
    accountHolderName: z.string().min(2, 'Account holder name is required'),
    routingNumber: z
      .string()
      .length(9, 'Routing number must be 9 digits')
      .regex(/^\d+$/, 'Must be numbers only'),
    accountNumber: z
      .string()
      .min(4, 'Account number is required')
      .regex(/^\d+$/, 'Must be numbers only'),
    confirmAccountNumber: z.string().min(4, 'Please confirm account number'),
    accountType: z.enum(['checking', 'savings']),
    bankName: z.string().optional(),
  })
  .refine((data) => data.accountNumber === data.confirmAccountNumber, {
    message: "Account numbers don't match",
    path: ['confirmAccountNumber'],
  });

type BankAccountFormData = z.infer<typeof bankAccountSchema>;

interface BankAccountWizardProps {
  onComplete?: () => void;
  trigger?: React.ReactNode;
}

export function BankAccountWizard({ onComplete, trigger }: BankAccountWizardProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'method' | 'manual' | 'instant' | 'verify' | 'success'>('method');
  const [isLoading, setIsLoading] = useState(false);
  const [bankAccountId, setBankAccountId] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<BankAccountFormData>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: {
      accountHolderName: '',
      routingNumber: '',
      accountNumber: '',
      confirmAccountNumber: '',
      accountType: 'checking',
      bankName: '',
    },
  });

  const [verifyAmounts, setVerifyAmounts] = useState({ amount1: '', amount2: '' });

  // Handle instant verification via Stripe Financial Connections
  const handleInstantVerification = async () => {
    setIsLoading(true);
    try {
      const result = await createFinancialConnectionsSession();

      if (!result.success || !result.clientSecret) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.message || 'Failed to start bank connection',
        });
        setIsLoading(false);
        return;
      }

      // Load Stripe.js and open Financial Connections
      const stripe = await import('@stripe/stripe-js').then((m) =>
        m.loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
      );

      if (!stripe) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load payment system',
        });
        setIsLoading(false);
        return;
      }

      // Open the Financial Connections modal
      const { financialConnectionsSession, error } =
        await stripe.collectFinancialConnectionsAccounts({
          clientSecret: result.clientSecret,
        });

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Connection cancelled',
          description: error.message || 'Bank connection was cancelled',
        });
        setIsLoading(false);
        return;
      }

      if (financialConnectionsSession?.accounts?.[0]) {
        // Attach the connected account
        const attachResult = await attachFinancialConnectionsAccount(
          financialConnectionsSession.accounts[0].id
        );

        if (attachResult.success) {
          setStep('success');
          toast({
            title: 'Bank connected!',
            description: attachResult.message,
          });
        } else if ((attachResult as { requiresManualEntry?: boolean }).requiresManualEntry) {
          // Bank doesn't support instant verification, redirect to manual entry
          toast({
            title: 'Manual entry required',
            description: attachResult.message,
          });
          setStep('manual');
        } else {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: attachResult.message,
          });
        }
      }
    } catch (error) {
      console.error('Financial Connections error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to connect bank account',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSubmit = async (data: BankAccountFormData) => {
    setIsLoading(true);
    try {
      const result = await addBankAccountManual({
        accountHolderName: data.accountHolderName,
        routingNumber: data.routingNumber,
        accountNumber: data.accountNumber,
        accountType: data.accountType,
        bankName: data.bankName,
      });

      if (result.success) {
        setBankAccountId(result.bankAccountId || null);
        if (result.needsVerification) {
          setStep('verify');
          toast({
            title: 'Bank account added',
            description: 'Two small deposits will be sent to verify your account.',
          });
        } else {
          setStep('success');
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.message,
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add bank account',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyMicroDeposits = async () => {
    if (!bankAccountId) return;

    const amount1 = parseFloat(verifyAmounts.amount1);
    const amount2 = parseFloat(verifyAmounts.amount2);

    if (isNaN(amount1) || isNaN(amount2)) {
      toast({
        variant: 'destructive',
        title: 'Invalid amounts',
        description: 'Please enter the two deposit amounts',
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await verifyBankAccountMicroDeposits(bankAccountId, [amount1, amount2]);

      if (result.success) {
        setStep('success');
        toast({
          title: 'Verified!',
          description: 'Your bank account is now ready for payouts.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Verification failed',
          description: result.message,
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to verify bank account',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setStep('method');
    form.reset();
    setVerifyAmounts({ amount1: '', amount2: '' });
    if (step === 'success') {
      onComplete?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Building2 className="mr-2 h-4 w-4" />
            Add Bank Account
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {step === 'method' && 'Add Bank Account'}
            {step === 'manual' && 'Enter Bank Details'}
            {step === 'instant' && 'Connect Your Bank'}
            {step === 'verify' && 'Verify Your Account'}
            {step === 'success' && 'Account Added!'}
          </DialogTitle>
          <DialogDescription>
            {step === 'method' && 'Choose how you want to add your bank account for payouts.'}
            {step === 'manual' && 'Enter your bank account details below.'}
            {step === 'instant' && 'Securely connect your bank account.'}
            {step === 'verify' && 'Enter the two small deposit amounts sent to your account.'}
            {step === 'success' && 'Your bank account is ready to receive payouts.'}
          </DialogDescription>
        </DialogHeader>

        {/* Step: Choose Method */}
        {step === 'method' && (
          <div className="grid gap-4 py-4">
            <Card
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={handleInstantVerification}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Instant Verification
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                    Recommended
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Securely log in to your bank and verify instantly. No waiting for deposits.
                </CardDescription>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => setStep('manual')}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Landmark className="h-5 w-5" />
                  Manual Entry
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Enter your routing and account numbers. Verification takes 1-2 business days via
                  micro-deposits.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step: Manual Entry Form */}
        {step === 'manual' && (
          <form onSubmit={form.handleSubmit(handleManualSubmit)} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name (Optional)</Label>
              <Input id="bankName" placeholder="e.g., Chase Bank" {...form.register('bankName')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountHolderName">Account Holder Name</Label>
              <Input
                id="accountHolderName"
                placeholder="John Doe"
                {...form.register('accountHolderName')}
              />
              {form.formState.errors.accountHolderName && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.accountHolderName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="routingNumber">Routing Number</Label>
              <Input
                id="routingNumber"
                placeholder="9 digits"
                maxLength={9}
                {...form.register('routingNumber')}
              />
              {form.formState.errors.routingNumber && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.routingNumber.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                type="password"
                placeholder="Account number"
                {...form.register('accountNumber')}
              />
              {form.formState.errors.accountNumber && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.accountNumber.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmAccountNumber">Confirm Account Number</Label>
              <Input
                id="confirmAccountNumber"
                placeholder="Re-enter account number"
                {...form.register('confirmAccountNumber')}
              />
              {form.formState.errors.confirmAccountNumber && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.confirmAccountNumber.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Account Type</Label>
              <RadioGroup
                defaultValue="checking"
                onValueChange={(value) =>
                  form.setValue('accountType', value as 'checking' | 'savings')
                }
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="checking" id="checking" />
                  <Label htmlFor="checking" className="font-normal">
                    Checking
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="savings" id="savings" />
                  <Label htmlFor="savings" className="font-normal">
                    Savings
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setStep('method')}>
                Back
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Bank Account
              </Button>
            </div>
          </form>
        )}

        {/* Step: Verify Micro-deposits */}
        {step === 'verify' && (
          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
              <AlertCircle className="inline h-4 w-4 mr-2" />
              Two small deposits (under $1.00 each) will appear in your bank account within 1-2
              business days. Enter those amounts below to verify your account.
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount1">First Deposit ($)</Label>
                <Input
                  id="amount1"
                  type="number"
                  step="0.01"
                  placeholder="0.32"
                  value={verifyAmounts.amount1}
                  onChange={(e) => setVerifyAmounts((prev) => ({ ...prev, amount1: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount2">Second Deposit ($)</Label>
                <Input
                  id="amount2"
                  type="number"
                  step="0.01"
                  placeholder="0.45"
                  value={verifyAmounts.amount2}
                  onChange={(e) => setVerifyAmounts((prev) => ({ ...prev, amount2: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Verify Later
              </Button>
              <Button onClick={handleVerifyMicroDeposits} disabled={isLoading} className="flex-1">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify Account
              </Button>
            </div>
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="font-medium">Bank account added successfully!</p>
              <p className="text-sm text-muted-foreground mt-1">
                You can now receive payouts to this account.
              </p>
            </div>
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </div>
        )}

        {/* Loading overlay for instant verification */}
        {isLoading && step === 'method' && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
            <div className="text-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground">Connecting to your bank...</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default BankAccountWizard;
