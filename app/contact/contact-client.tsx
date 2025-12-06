'use client';

import React, { useState } from 'react';
import Image from 'next/image';

const ContactClient = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [projectType, setProjectType] = useState('');
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
        body: JSON.stringify({
          name,
          email,
          subject,
          projectType,
          message,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || 'Failed to send message');
      }

      setSuccess('Message sent! I will get back to you as soon as possible.');
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      setProjectType('');
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
    <main className="relative min-h-[calc(100vh-4rem)] w-full bg-gradient-to-br from-slate-950 via-violet-800/60 to-slate-900 text-slate-50 flex items-center justify-center px-4 py-10">
      {/* Logo watermark in the background */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-10">
        <div className="relative w-[260px] h-[260px] sm:w-[320px] sm:h-[320px] lg:w-[380px] lg:h-[380px]">
          <Image
            src="/images/logo.svg"
            alt="RockEnMyVibe logo watermark"
            fill
            className="object-contain drop-shadow-[0_0_45px_rgba(129,140,248,0.6)]"
            priority
          />
        </div>
      </div>
      <div className="relative w-full max-w-5xl">
        {/* Glow */}
        <div className="pointer-events-none absolute -inset-1 rounded-3xl bg-gradient-to-r from-violet-500/40 via-fuchsia-500/20 to-cyan-400/40 blur-3xl opacity-70" />

        {/* Glass card */}
        <div className="relative rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-2xl shadow-[0_20px_70px_rgba(15,23,42,0.9)] overflow-hidden">
          <div className="grid gap-8 md:grid-cols-[minmax(0,3fr)_minmax(0,2.2fr)] p-6 sm:p-8 lg:p-10">
            {/* Form side */}
            <section className="space-y-6">
              <header className="space-y-2">
                <p className="inline-flex items-center rounded-full bg-white/5 px-3 py-1 text-xs font-medium tracking-wide text-violet-200/80 ring-1 ring-white/10">
                  Let&apos;s build something unforgettable
                </p>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight">
                  Contact <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">RockEnMyVibe</span>
                </h1>
                <p className="text-sm sm:text-base text-slate-300/80 max-w-xl">
                  Share a bit about your project, ideas, or vision. I&apos;ll review your message and reply with next steps, timelines, and energy to match your vibe.
                </p>
              </header>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium uppercase tracking-[0.18em] text-slate-300/80">
                      Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-50 outline-none transition focus:border-violet-400/70 focus:ring-2 focus:ring-violet-500/40 placeholder:text-slate-400/70"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium uppercase tracking-[0.18em] text-slate-300/80">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-50 outline-none transition focus:border-violet-400/70 focus:ring-2 focus:ring-violet-500/40 placeholder:text-slate-400/70"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium uppercase tracking-[0.18em] text-slate-300/80">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Tell me the headline"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-50 outline-none transition focus:border-violet-400/70 focus:ring-2 focus:ring-violet-500/40 placeholder:text-slate-400/70"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium uppercase tracking-[0.18em] text-slate-300/80">
                      Project Type
                    </label>
                    <select
                      value={projectType}
                      onChange={(e) => setProjectType(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-50 outline-none transition focus:border-violet-400/70 focus:ring-2 focus:ring-violet-500/40 bg-[rgba(15,23,42,0.4)]"
                    >
                      <option value="" className="bg-slate-900">
                        Select a vibe
                      </option>
                      <option value="website" className="bg-slate-900">
                        Full website experience
                      </option>
                      <option value="branding" className="bg-slate-900">
                        Brand / visual refresh
                      </option>
                      <option value="ui" className="bg-slate-900">
                        UI / UX design
                      </option>
                      <option value="consult" className="bg-slate-900">
                        Consultation / collab
                      </option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-[0.18em] text-slate-300/80">
                    Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Share your goals, timelines, and anything that captures your vibe."
                    rows={5}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-50 outline-none transition focus:border-violet-400/70 focus:ring-2 focus:ring-violet-500/40 placeholder:text-slate-400/70 resize-none"
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[11px] leading-relaxed text-slate-300/80 max-w-xs">
                    By sending this message you agree to be contacted back regarding your project and potential collaboration.
                  </p>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-violet-500/30 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSubmitting ? 'Sending...' : 'Send message'}
                  </button>
                </div>

                {error && (
                  <p className="text-xs text-rose-300 bg-rose-900/40 border border-rose-500/40 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}
                {success && (
                  <p className="text-xs text-emerald-200 bg-emerald-900/40 border border-emerald-500/40 rounded-lg px-3 py-2">
                    {success}
                  </p>
                )}
              </form>
            </section>

            {/* Overview / profile side */}
            <aside className="relative flex flex-col justify-between rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-violet-900/60 px-5 py-6 sm:px-6 lg:px-7 lg:py-8 shadow-inner shadow-slate-950/60 overflow-hidden">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-violet-500/30 blur-3xl" />
              <div className="pointer-events-none absolute -left-16 bottom-[-3rem] h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />

              <div className="relative space-y-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-400 via-fuchsia-400 to-amber-300 text-slate-950 font-bold text-xl shadow-lg shadow-violet-500/50">
                    RE
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-300/80">
                      RockEnMyVibe
                    </p>
                    <p className="text-sm text-slate-100/90">Creative Web Experiences</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-slate-200/90">
                    Every project is a chance to craft a digital experience that feels alive. Share your idea and we&apos;ll turn it into something people remember.
                  </p>
                  <p className="text-xs text-slate-300/75">
                    Expect a thoughtful response, usually within 24–48 hours depending on current workload.
                  </p>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-3 text-xs text-slate-200/90">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400/90">
                      Direct Email
                    </p>
                    <p className="mt-1 font-medium break-all">contact@rockenmyvibe.com</p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-3 text-xs text-slate-200/90">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400/90">
                      Preferred Collabs
                    </p>
                    <p className="mt-1">Creators, brands &amp; builders who care about craft.</p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-3 text-xs text-slate-200/90">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400/90">
                      Timezone
                    </p>
                    <p className="mt-1">Mountain Time (MT)</p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-3 text-xs text-slate-200/90">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400/90">
                      Socials
                    </p>
                    <p className="mt-1">Link up on your favorite platforms.</p>
                  </div>
                </div>
              </div>

              <div className="relative mt-6 flex items-center justify-between gap-3 text-[11px] text-slate-300/80">
                <p className="max-w-[70%]">
                  Ready when you are. The more context you share, the more tailored the response.
                </p>
                <div className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1.5 text-[10px] font-medium tracking-wide text-emerald-200/90 ring-1 ring-emerald-400/40">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
                  <span>Accepting new projects</span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ContactClient;
