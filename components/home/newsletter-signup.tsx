'use client';

import { useState } from 'react';
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'homepage' }),
      });

      const data = await res.json();
      
      if (res.ok) {
        setStatus('success');
        setMessage('Thanks for subscribing! Check your inbox for a welcome email.');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.message || 'Something went wrong. Please try again.');
      }
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  };

  return (
    <section className='w-full py-10 md:py-16 px-3 md:px-4 bg-gradient-to-r from-cyan-600 via-blue-600 to-blue-700'>
      <div className='max-w-3xl mx-auto'>
        <div className='text-center space-y-5'>

          <div className='inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1.5'>
            <Mail className='h-3.5 w-3.5 text-cyan-200' />
            <span className='text-xs font-bold text-cyan-100'>Not Ready to Sign Up Yet?</span>
          </div>

          <h3 className='text-2xl md:text-3xl font-black text-white'>
            Get Free Property Management Tips.<br className='hidden sm:block' />
            <span className='text-cyan-200'>No Commitment Required.</span>
          </h3>
          <p className='text-white/70 text-sm md:text-base max-w-xl mx-auto'>
            Join landlords getting weekly tips on rent collection, tenant screening, and cutting software costs — straight to your inbox.
          </p>

          {status === 'success' ? (
            <div className='inline-flex items-center gap-2 bg-white/10 rounded-full px-6 py-3 text-white'>
              <CheckCircle2 className='h-5 w-5 text-emerald-300' />
              <span className='text-sm font-semibold'>{message}</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className='flex flex-col sm:flex-row gap-3 max-w-lg mx-auto'>
              <input
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='Your email address'
                className='flex-1 rounded-full bg-white/10 border border-white/20 px-5 py-3.5 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-transparent'
                required
              />
              <button
                type='submit'
                disabled={status === 'loading'}
                className='group inline-flex items-center justify-center rounded-full bg-white text-blue-700 px-7 py-3.5 text-sm font-bold hover:bg-yellow-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg whitespace-nowrap'
              >
                {status === 'loading' ? (
                  'Sending...'
                ) : (
                  <>
                    Send Me Tips
                    <ArrowRight className='ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform' />
                  </>
                )}
              </button>
            </form>
          )}

          {status === 'error' && (
            <p className='text-sm text-red-300'>{message}</p>
          )}

          <p className='text-white/40 text-xs'>No spam. Unsubscribe anytime.</p>
        </div>
      </div>
    </section>
  );
}
