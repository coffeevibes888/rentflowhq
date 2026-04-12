'use client';

import { useState } from 'react';
import { Elements, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { addPropertyBankAccount, deletePropertyBankAccount } from '@/lib/actions/property-bank.actions';
import { Building2, Plus, Trash2, Loader2, CheckCircle2, AlertCircle, CreditCard } from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

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

interface PropertyBankManagerProps {
  properties: PropertyWithBankAccount[];
  onAccountAdded: () => void;
  onAccountRemoved: () => void;
}

function PropertyBankManagerInner({
  properties,
  onAccountAdded,
  onAccountRemoved,
}: PropertyBankManagerProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [propertyToRemove, setPropertyToRemove] = useState<PropertyWithBankAccount | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const { toast } = useToast();

  // Form state for bank account
  const [accountHolderName, setAccountHolderName] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountType, setAccountType] = useState<'checking' | 'savings'>('checking');
  const [formError, setFormError] = useState<string | null>(null);

  const propertiesWithoutAccounts = properties.filter((p) => !p.hasBankAccount);
  const propertiesWithAccounts = properties.filter((p) => p.hasBankAccount);

  const resetForm = () => {
    setSelectedPropertyId('');
    setAccountHolderName('');
    setRoutingNumber('');
    setAccountNumber('');
    setAccountType('checking');
    setFormError(null);
  };

  const handleOpenAddDialog = () => {
    resetForm();
    setShowAddDialog(true);
  };

  const validateForm = (): string | null => {
    if (!selectedPropertyId) return 'Please select a property';
    if (!accountHolderName.trim()) return 'Account holder name is required';
    if (!/^\d{9}$/.test(routingNumber)) return 'Routing number must be 9 digits';
    if (!/^\d{4,17}$/.test(accountNumber)) return 'Account number must be 4-17 digits';
    return null;
  };

  const handleAddAccount = async () => {
    const error = validateForm();
    if (error) {
      setFormError(error);
      return;
    }

    if (!stripe || !elements) {
      setFormError('Stripe has not loaded yet. Please try again.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const { token, error: stripeError } = await stripe.createToken('bank_account', {
        country: 'US',
        currency: 'usd',
        routing_number: routingNumber,
        account_number: accountNumber,
        account_holder_name: accountHolderName.trim(),
        account_holder_type: 'individual',
      });

      if (stripeError) {
        setFormError(stripeError.message || 'Failed to validate bank account');
        return;
      }

      if (!token) {
        setFormError('Failed to create bank account token');
        return;
      }

      const last4 = token.bank_account?.last4 || accountNumber.slice(-4);
      const bankName = token.bank_account?.bank_name ?? undefined;

      const result = await addPropertyBankAccount({
        propertyId: selectedPropertyId,
        stripeBankAccountTokenId: token.id,
        accountHolderName: accountHolderName.trim(),
        last4,
        bankName,
        accountType,
        routingNumber,
      });

      if (result.success) {
        toast({
          title: 'Bank account added',
          description: result.message,
        });
        setShowAddDialog(false);
        resetForm();
        onAccountAdded();
      } else {
        setFormError(result.message || 'Failed to add bank account');
      }
    } catch (err) {
      setFormError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveAccount = async () => {
    if (!propertyToRemove) return;

    setIsRemoving(true);
    try {
      const result = await deletePropertyBankAccount(propertyToRemove.id);

      if (result.success) {
        toast({
          title: 'Bank account removed',
          description: result.message,
        });
        onAccountRemoved();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.message || 'Failed to remove bank account',
        });
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred',
      });
    } finally {
      setIsRemoving(false);
      setPropertyToRemove(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-violet-500" />
                Property Bank Accounts
              </CardTitle>
              <CardDescription>
                Add bank accounts to receive payouts for specific properties
              </CardDescription>
            </div>
            {propertiesWithoutAccounts.length > 0 && (
              <Button onClick={handleOpenAddDialog} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Account
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {properties.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No properties found</p>
              <p className="text-xs mt-1">Add properties to set up bank accounts</p>
            </div>
          ) : (
            <div className="space-y-3">
              {properties.map((property) => (
                <div
                  key={property.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-slate-50/50 dark:bg-slate-900/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-slate-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{property.name}</p>
                      {property.bankAccount ? (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span>
                            {property.bankAccount.bankName || 'Bank'} ****{property.bankAccount.last4}
                          </span>
                          {property.bankAccount.isVerified ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600">
                              <CheckCircle2 className="h-3 w-3" />
                              Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-600">
                              <AlertCircle className="h-3 w-3" />
                              Pending
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">No bank account linked</p>
                      )}
                    </div>
                  </div>
                  {property.bankAccount ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPropertyToRemove(property)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedPropertyId(property.id);
                        handleOpenAddDialog();
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Bank Account Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Bank Account</DialogTitle>
            <DialogDescription>
              Link a bank account to receive payouts for this property
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Property Selection */}
            <div className="space-y-2">
              <Label htmlFor="property">Property</Label>
              <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                <SelectTrigger id="property">
                  <SelectValue placeholder="Select a property" />
                </SelectTrigger>
                <SelectContent>
                  {propertiesWithoutAccounts.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Account Holder Name */}
            <div className="space-y-2">
              <Label htmlFor="accountHolder">Account Holder Name</Label>
              <Input
                id="accountHolder"
                placeholder="John Doe"
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
              />
            </div>

            {/* Account Type */}
            <div className="space-y-2">
              <Label htmlFor="accountType">Account Type</Label>
              <Select value={accountType} onValueChange={(v) => setAccountType(v as 'checking' | 'savings')}>
                <SelectTrigger id="accountType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Checking</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Routing Number */}
            <div className="space-y-2">
              <Label htmlFor="routing">Routing Number</Label>
              <Input
                id="routing"
                placeholder="123456789"
                value={routingNumber}
                onChange={(e) => setRoutingNumber(e.target.value.replace(/\D/g, '').slice(0, 9))}
                maxLength={9}
              />
            </div>

            {/* Account Number */}
            <div className="space-y-2">
              <Label htmlFor="account">Account Number</Label>
              <Input
                id="account"
                placeholder="••••••••1234"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 17))}
                maxLength={17}
              />
            </div>

            {/* Security Note */}
            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 p-3 text-xs text-amber-700 dark:text-amber-400">
              <p className="font-medium">Security Note</p>
              <p className="mt-1">
                Your full account details are securely processed by Stripe. We only store the last 4 digits.
              </p>
            </div>

            {/* Error Message */}
            {formError && (
              <p className="text-sm text-red-600 text-center">{formError}</p>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddAccount}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Account'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={!!propertyToRemove} onOpenChange={() => setPropertyToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Bank Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the bank account from {propertyToRemove?.name}?
              Future payouts for this property will go to your default account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveAccount}
              disabled={isRemoving}
              className="bg-red-600 hover:bg-red-700"
            >
              {isRemoving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function PropertyBankManager(props: PropertyBankManagerProps) {
  return (
    <Elements stripe={stripePromise}>
      <PropertyBankManagerInner {...props} />
    </Elements>
  );
}
