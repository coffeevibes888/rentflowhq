'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Mail, Phone, MapPin, Send, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ContractorQuoteButton } from '@/components/contractor/quote-button';

interface ContractorContactClientProps {
  brandName: string;
  brandEmail: string;
  brandPhone?: string | null;
  location?: string | null;
  logoUrl?: string | null;
  subdomain: string;
  slug: string;
}

export default function ContractorContactClient({
  brandName,
  brandEmail,
  brandPhone,
  location,
  logoUrl,
  subdomain,
  slug,
}: ContractorContactClientProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // TODO: Implement actual contact form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSubmitting(false);
    setSubmitted(true);
  };

  return (
    <main className="min-h-[70vh] w-full px-4 py-12">
      <div className="max-w-5xl mx-auto space-y-10">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.28em] text-white/70">Contact</p>
          <h1 className="text-3xl sm:text-4xl font-semibold text-white">{brandName}</h1>
          <p className="text-sm text-white/80 max-w-2xl">
            Get in touch with us for quotes, questions, or to discuss your project.
          </p>
        </header>

        <section className="grid gap-8 lg:grid-cols-[1fr_1fr] items-start">
          {/* Contact Form */}
          <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm p-6 shadow-lg">
            {submitted ? (
              <div className="text-center py-8">
                <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
                  <Send className="h-8 w-8 text-emerald-300" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">Message Sent!</h2>
                <p className="text-white/70">
                  Thank you for reaching out. We&apos;ll get back to you as soon as possible.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h2 className="text-lg font-semibold text-white mb-4">Send a Message</h2>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white">Your Name</Label>
                    <Input
                      id="name"
                      name="name"
                      required
                      placeholder="John Smith"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="john@example.com"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-white">Phone (optional)</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-white">Subject</Label>
                  <Input
                    id="subject"
                    name="subject"
                    required
                    placeholder="Project inquiry"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-white">Message</Label>
                  <Textarea
                    id="message"
                    name="message"
                    required
                    placeholder="Tell us about your project or question..."
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 min-h-[120px]"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-violet-600 hover:bg-violet-500"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            )}
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm p-6 shadow-lg">
              <div className="flex items-center gap-4 mb-6">
                {logoUrl ? (
                  <div className="relative h-16 w-16 rounded-xl overflow-hidden border border-white/20">
                    <Image src={logoUrl} alt={brandName} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="h-16 w-16 rounded-xl bg-violet-500/20 border border-violet-400/30 flex items-center justify-center">
                    <Briefcase className="h-8 w-8 text-violet-300" />
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-semibold text-white">{brandName}</h2>
                  <p className="text-sm text-white/70">Professional Contractor</p>
                </div>
              </div>

              <div className="space-y-4">
                <a
                  href={`mailto:${brandEmail}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className="h-10 w-10 rounded-lg bg-violet-500/20 border border-violet-400/30 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-violet-300" />
                  </div>
                  <div>
                    <p className="text-xs text-white/60">Email</p>
                    <p className="text-white font-medium">{brandEmail}</p>
                  </div>
                </a>

                {brandPhone && (
                  <a
                    href={`tel:${brandPhone}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
                      <Phone className="h-5 w-5 text-emerald-300" />
                    </div>
                    <div>
                      <p className="text-xs text-white/60">Phone</p>
                      <p className="text-white font-medium">{brandPhone}</p>
                    </div>
                  </a>
                )}

                {location && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="h-10 w-10 rounded-lg bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-cyan-300" />
                    </div>
                    <div>
                      <p className="text-xs text-white/60">Location</p>
                      <p className="text-white font-medium">{location}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Quote CTA */}
            <div className="rounded-2xl border border-violet-400/30 bg-gradient-to-br from-violet-500/20 to-purple-500/20 backdrop-blur-sm p-6 shadow-lg text-center">
              <h3 className="text-lg font-semibold text-white mb-2">Need a Quick Quote?</h3>
              <p className="text-sm text-white/70 mb-4">
                Request a free estimate for your project.
              </p>
              <ContractorQuoteButton
                contractorSlug={slug}
                contractorName={brandName}
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
