'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { verifyEmail } from '@/lib/actions/auth.actions';
import { Loader, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link');
        return;
      }

      const result = await verifyEmail(token);

      if (result.success) {
        setStatus('success');
        setMessage('Your email has been verified successfully!');
      } else {
        setStatus('error');
        setMessage(result.message);
      }
    };

    verify();
  }, [token]);

  return (
    <div className='flex items-center justify-center min-h-screen bg-gray-100'>
      <div className='bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center'>
        {status === 'loading' && (
          <>
            <Loader className='w-12 h-12 mx-auto animate-spin text-primary mb-4' />
            <h1 className='text-xl font-semibold mb-2'>Verifying Email</h1>
            <p className='text-gray-600'>Please wait while we verify your email...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className='w-12 h-12 mx-auto text-green-500 mb-4' />
            <h1 className='text-xl font-semibold mb-2'>Email Verified!</h1>
            <p className='text-gray-600 mb-6'>{message}</p>
            <Button asChild className='w-full'>
              <Link href='/sign-in?verified=true'>Continue to Sign In</Link>
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className='w-12 h-12 mx-auto text-red-500 mb-4' />
            <h1 className='text-xl font-semibold mb-2'>Verification Failed</h1>
            <p className='text-gray-600 mb-6'>{message}</p>
            <Button asChild className='w-full'>
              <Link href='/sign-up'>Back to Sign Up</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
