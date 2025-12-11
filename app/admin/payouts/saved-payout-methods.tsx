'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  addSavedPayoutMethod,
  getSavedPayoutMethods,
  deleteSavedPayoutMethod,
  updateSavedPayoutMethod,
} from '@/lib/actions/landlord.actions';
import { savedPayoutMethodSchema } from '@/lib/validators';
import { z } from 'zod';
import { Trash2, Edit2, Building2, CreditCard } from 'lucide-react';
import BankAccountForm from './bank-account-form';

type SavedPayoutMethod = {
  id: string;
  type: string;
  last4: string;
  bankName?: string;
  accountType?: string;
  accountHolderName?: string;
  isDefault: boolean;
  isVerified: boolean;
};

export default function SavedPayoutMethods() {
  const [methods, setMethods] = useState<SavedPayoutMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingMethod, setEditingMethod] = useState<SavedPayoutMethod | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPayoutMethods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPayoutMethods = async () => {
    setIsLoading(true);
    const result = await getSavedPayoutMethods();
    if (result.success) {
      setMethods(result.methods as SavedPayoutMethod[]);
    } else {
      toast({
        variant: 'destructive',
        description: result.message,
      });
    }
    setIsLoading(false);
  };

  const onSubmit = async (values: z.infer<typeof savedPayoutMethodSchema>) => {
    setIsSubmitting(true);
    let res;

    if (editingId) {
      res = await updateSavedPayoutMethod(editingId, values);
    } else {
      res = await addSavedPayoutMethod(values);
    }

    if (!res.success) {
      toast({
        variant: 'destructive',
        description: res.message,
      });
    } else {
      toast({
        description: res.message,
      });
      setShowForm(false);
      setEditingId(null);
      setEditingMethod(null);
      await fetchPayoutMethods();
    }
    setIsSubmitting(false);
  };

  const handleEdit = (method: SavedPayoutMethod) => {
    setEditingId(method.id);
    setEditingMethod(method);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingMethod(null);
    setShowForm(false);
  };

  const handleDelete = async (payoutMethodId: string) => {
    setIsDeleting(payoutMethodId);
    const res = await deleteSavedPayoutMethod(payoutMethodId);

    if (!res.success) {
      toast({
        variant: 'destructive',
        description: res.message,
      });
    } else {
      toast({
        description: res.message,
      });
      await fetchPayoutMethods();
    }
    setIsDeleting(null);
  };

  return (
    <div className='space-y-4'>
      <div className='flex justify-between items-center'>
        <h3 className='text-lg font-semibold text-slate-900'>Saved Bank Accounts</h3>
        <Button
          type='button'
          variant='outline'
          className='border-slate-300 text-slate-700 hover:bg-slate-100'
          onClick={() => setShowForm(!showForm)}
          disabled={isLoading}
        >
          {showForm ? 'Cancel' : 'Add Bank Account'}
        </Button>
      </div>

      {isLoading && (
        <div className='text-center text-slate-600 py-8'>
          <div className='inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600'></div>
          <p className='mt-2'>Loading bank accounts...</p>
        </div>
      )}

      {showForm && (
        <div className='border border-slate-300 rounded-lg p-6 bg-slate-50 space-y-4'>
          <h4 className='font-semibold text-slate-900'>{editingId ? 'Edit Bank Account' : 'Add New Bank Account'}</h4>
          <BankAccountForm
            initialData={editingMethod}
            onSubmit={onSubmit}
            isLoading={isSubmitting}
            onCancel={handleCancelEdit}
          />
        </div>
      )}

      {methods.length === 0 && !isLoading ? (
        <div className='p-4 text-center text-slate-600 border border-dashed border-slate-300 rounded-lg bg-slate-50'>
          No saved bank accounts. Add one to get started!
        </div>
      ) : (
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
          {methods.map((method) => (
            <div
              key={method.id}
              className='flex flex-col justify-between p-4 border border-slate-200 rounded-lg bg-white shadow-sm'
            >
              <div>
                <div className='flex items-start gap-3'>
                  {method.type === 'bank_account' ? (
                    <Building2 className='w-5 h-5 text-emerald-600 mt-1' />
                  ) : (
                    <CreditCard className='w-5 h-5 text-blue-600 mt-1' />
                  )}
                  <div className='flex-1'>
                    <p className='font-medium text-slate-900'>
                      {method.accountHolderName && <span>{method.accountHolderName}</span>}
                    </p>
                    <p className='text-sm text-slate-600'>
                      {method.type === 'bank_account' ? (
                        <>
                          {method.bankName && <span>{method.bankName} • </span>}
                          {method.accountType && <span className='capitalize'>{method.accountType} </span>}
                          •••• {method.last4}
                        </>
                      ) : (
                        <>Card •••• {method.last4}</>
                      )}
                    </p>
                  </div>
                </div>
                <div className='flex gap-2 mt-3'>
                  {method.isDefault && (
                    <span className='text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded border border-emerald-300'>
                      Default
                    </span>
                  )}
                  {!method.isVerified && (
                    <span className='text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded border border-amber-300'>
                      Pending Verification
                    </span>
                  )}
                  {method.type === 'bank_account' && (
                    <span className='text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-300'>
                      Standard (2-3 days)
                    </span>
                  )}
                  {method.type === 'card' && (
                    <span className='text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded border border-blue-300'>
                      Instant (1.5% fee)
                    </span>
                  )}
                </div>
              </div>
              <div className='flex gap-2 mt-4'>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  className='text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  onClick={() => handleEdit(method)}
                >
                  <Edit2 className='w-4 h-4' />
                </Button>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  className='text-red-600 hover:text-red-700 hover:bg-red-50'
                  onClick={() => handleDelete(method.id)}
                  disabled={isDeleting === method.id}
                >
                  <Trash2 className='w-4 h-4' />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

