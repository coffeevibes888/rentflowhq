'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MessageSquare, Mail, Clock, ArrowRight } from 'lucide-react';

const HomeContactCard = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name || !email || !message) {
      setError('Please fill in your name, email, and message.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/messages/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || 'Failed to send message');
      }

      setSuccess('Message sent! We\'ll get back to you within 24 hours.');
      setName('');
      setEmail('');
      setMessage('');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while sending your message. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="w-full py-16 md:py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="rounded-3xl border border-white/10 bg-slate-950/60 backdrop-blur-md p-8 md:p-10 grid gap-8 md:grid-cols-[1.4fr_1fr]">
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                Have Questions? We're Here to Help
              </h2>
              <p className="text-slate-300 text-sm md:text-base">
                Whether you're wondering about features, need setup help, or just want to chat about property management, we'd love to hear from you.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-slate-900/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-emerald-500/50 focus:bg-slate-900/70 transition-colors"
                    placeholder="Your name"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-slate-900/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-emerald-500/50 focus:bg-slate-900/70 transition-colors"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-white/10 bg-slate-900/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-emerald-500/50 focus:bg-slate-900/70 transition-colors resize-none"
                  placeholder="How can we help you?"
                />
              </div>

              <div className="flex items-center gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center rounded-full bg-emerald-500 text-slate-950 px-6 py-2.5 text-sm font-bold hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                  {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
                </button>
                <Link
                  href="/contact"
                  className="text-sm text-emerald-300 hover:text-emerald-200 underline transition-colors"
                >
                  Go to full contact page
                </Link>
              </div>

              {error && (
                <div className="rounded-lg bg-red-500/20 border border-red-500/30 px-4 py-2 text-sm text-red-300">
                  {error}
                </div>
              )}
              {success && (
                <div className="rounded-lg bg-emerald-500/20 border border-emerald-500/30 px-4 py-2 text-sm text-emerald-300">
                  {success}
                </div>
              )}
            </form>
          </div>

          <aside className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-white">Quick Info</h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-900/50 border border-white/10">
                  <Clock className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-white text-sm">Response Time</div>
                    <div className="text-xs text-slate-400">Usually within 24 hours</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-900/50 border border-white/10">
                  <Mail className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-white text-sm">Email Support</div>
                    <div className="text-xs text-slate-400 break-all">support@propertyflowhq.com</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-900/50 border border-white/10">
                  <MessageSquare className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-white text-sm">Live Chat</div>
                    <div className="text-xs text-slate-400">Available in your dashboard</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <p className="text-xs text-emerald-200 leading-relaxed">
                <span className="font-semibold">Pro Tip:</span> Most questions are answered in our help center. Check it out before reaching out!
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
};

export default HomeContactCard;
