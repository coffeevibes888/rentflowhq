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
    <section className='w-full py-8 md:py-12 px-3 md:px-4'>
      <div className='max-w-2xl mx-auto'>
        <div className='rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-6 md:p-8 text-center'>
          <div className='inline-flex items-center justify-center rounded-full bg-violet-500/20 p-3 mb-4 border border-violet-500/30'>
            <Mail className='h-6 w-6 text-violet-400' />
          </div>
          
          <h3 className='text-lg md:text-xl font-bold text-white mb-2'>
            Stay Updated
          </h3>
          <p className='text-sm text-slate-300 mb-6 max-w-md mx-auto'>
            Get property management tips, product updates, and industry insights delivered to your inbox. No spam, unsubscribe anytime.
          </p>

          {status === 'success' ? (
            <div className='flex items-center justify-center gap-2 text-emerald-400'>
              <CheckCircle2 className='h-5 w-5' />
              <span className='text-sm font-medium'>{message}</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className='flex flex-col sm:flex-row gap-3 max-w-md mx-auto'>
              <input
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='Enter your email'
                className='flex-1 rounded-full bg-white/10 border border-white/20 px-5 py-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent'
                required
              />
              <button
                type='submit'
                disabled={status === 'loading'}
                className='group inline-flex items-center justify-center rounded-full bg-violet-500 text-white px-6 py-3 text-sm font-semibold hover:bg-violet-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {status === 'loading' ? (
                  'Subscribing...'
                ) : (
                  <>
                    Subscribe
                    <ArrowRight className='ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform' />
                  </>
                )}
              </button>
            </form>
          )}

          {status === 'error' && (
            <p className='mt-3 text-sm text-red-400'>{message}</p>
          )}
        </div>
      </div>
    </section>
  );
}
