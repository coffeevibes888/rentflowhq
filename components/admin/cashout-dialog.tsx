'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { createPayout } from '@/lib/actions/stripe-connect.actions';
import { Loader2, CheckCircle2, Building2, Wallet } from 'lucide-react';

interface PropertyWithBankAccount {
  id: string;
  name: string;
  hasBankAccount: boolean;
  bankAccount: {
    last4: string;
    bankName: string | null;
    isVerified: boolean;
  } | null;
}

interface CashoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableBalance: number;
  properties: PropertyWithBankAccount[];
  preselectedPropertyId?: string;
  defaultBankLast4?: string | null;
  onSuccess: () => void;
}

export default function CashoutDialog({
  open,
  onOpenChange,
  availableBalance,
  properties,
  preselectedPropertyId,
  defaultBankLast4,
  onSuccess,
}: CashoutDialogProps) {
  const [amount, setAmount] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('default');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setAmount('');
      setSelectedPropertyId(preselectedPropertyId || 'default');
      setError(null);
    }
  }, [open, preselectedPropertyId]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const parseAmount = (value: string): number => {
    const cleaned = value.replace(/[^0-9.]/g, '');
    return parseFloat(cleaned) || 0;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    // Only allow one decimal point and max 2 decimal places
    const parts = value.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    setAmount(value);
    setError(null);
  };

  const handleCashOutAll = () => {
    setAmount(availableBalance.toFixed(2));
    setError(null);
  };

  const getSelectedDestination = () => {
    if (selectedPropertyId === 'default') {
      return {
        label: 'Default Account',
        bankInfo: defaultBankLast4 ? `****${defaultBankLast4}` : 'Connected via Stripe',
      };
    }
    const property = properties.find((p) => p.id === selectedPropertyId);
    if (property?.bankAccount) {
      return {
        label: property.name,
        bankInfo: property.bankAccount.bankName
          ? `${property.bankAccount.bankName} ****${property.bankAccount.last4}`
          : `****${property.bankAccount.last4}`,
      };
    }
    return { label: 'Unknown', bankInfo: '' };
  };

  const validateAmount = (): string | null => {
    const numAmount = parseAmount(amount);
    if (!amount || numAmount === 0) {
      return 'Please enter an amount';
    }
    if (numAmount < 1) {
      return 'Minimum cashout is $1.00';
    }
    if (numAmount > availableBalance) {
      return 'Amount exceeds available balance';
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateAmount();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const numAmount = parseAmount(amount);
      const propertyId = selectedPropertyId === 'default' ? undefined : selectedPropertyId;

      const result = await createPayout({ amount: numAmount, propertyId });

      if (result.success) {
        toast({
          title: 'Payout initiated!',
          description: result.message,
        });
        onOpenChange(false);
        onSuccess();
      } else {
        setError(result.message || 'Failed to process payout');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const destination = getSelectedDestination();
  const propertiesWithAccounts = properties.filter((p) => p.hasBankAccount);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cash Out</DialogTitle>
          <DialogDescription>
            Transfer funds to your bank account
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
              <Input
                id="amount"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={handleAmountChange}
                className="pl-7 pr-24"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCashOutAll}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 text-xs text-emerald-600 hover:text-emerald-700"
              >
                Cash Out All
              </Button>
            </div>
            <p className="text-xs text-slate-500">
              Available: {formatCurrency(availableBalance)}
            </p>
          </div>

          {/* Destination Selection */}
          <div className="space-y-2">
            <Label htmlFor="destination">Destination</Label>
            <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
              <SelectTrigger id="destination">
                <SelectValue placeholder="Select destination" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    <span>Default Account</span>
                  </div>
                </SelectItem>
                {propertiesWithAccounts.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>{property.name}</span>
                      <span className="text-slate-400 text-xs">
                        ****{property.bankAccount?.last4}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Destination Info */}
          <div className="rounded-lg bg-slate-50 dark:bg-slate-900/50 p-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                {selectedPropertyId === 'default' ? (
                  <Wallet className="h-5 w-5 text-emerald-600" />
                ) : (
                  <Building2 className="h-5 w-5 text-emerald-600" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{destination.label}</p>
                <p className="text-xs text-slate-500">{destination.bankInfo}</p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
          </div>

          {/* Transfer Details */}
          <div className="rounded-lg bg-slate-50 dark:bg-slate-900/50 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Transfer method</span>
              <span className="font-medium">Standard ACH</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Arrival time</span>
              <span className="font-medium">2-3 business days</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Fee</span>
              <span className="font-medium text-emerald-600">Free</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !amount}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirm
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
