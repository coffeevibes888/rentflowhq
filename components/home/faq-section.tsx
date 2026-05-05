'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, HelpCircle, ArrowRight } from 'lucide-react';

const faqs = [
  {
    question: 'How much does Property Flow HQ cost?',
    answer: 'Plans start at $19.99/month and include a 14-day free trial so you can test everything before being charged. We have three tiers — Starter ($19.99/mo, up to 24 units), Pro ($39.99/mo, up to 150 units), and Enterprise ($79.99/mo, unlimited units). Rent collection is included with no additional per-payment fees.',
  },
  {
    question: 'How does rent collection work?',
    answer: 'Tenants pay rent through our secure Stripe-powered payment system. They can use credit cards, debit cards, or bank transfers (ACH). Funds are deposited directly to your bank account with no additional per-payment fees from us.'
  },
  {
    question: 'Can tenants pay rent in cash?',
    answer: 'Yes! Landlords can record cash payments received directly from tenants through the tenant management dashboard. The payment is tracked and reflected in the tenant\'s payment history.',
  },
  {
    question: 'How do digital leases and e-signatures work?',
    answer: 'Upload your lease template or use our state-specific templates. Send leases to tenants for electronic signature — no printing, scanning, or mailing required. All signed documents are stored securely and accessible anytime.',
  },
  {
    question: 'What is the branded tenant portal?',
    answer: 'Every landlord gets a custom subdomain (yourname.propertyflowhq.com) where tenants can view available units, submit applications, pay rent, request maintenance, and access their lease documents. It\'s your own professional property management website.',
  },
  {
    question: 'How do maintenance requests work?',
    answer: 'Tenants submit maintenance requests through their portal with photos and descriptions. You receive instant notifications, can assign priority levels, track progress, and communicate with tenants — all in one place.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Absolutely. We use bank-level 256-bit encryption for all sensitive data. Payments are processed through Stripe, a PCI-DSS Level 1 certified payment processor. We never store credit card numbers on our servers.',
  },
  {
    question: 'Can I upgrade or downgrade my plan?',
    answer: 'Yes, you can change your plan anytime. Upgrades take effect immediately, and downgrades take effect at the end of your billing cycle. If you downgrade below your current unit count, you\'ll need to remove units first.',
  },
  {
    question: 'Do you offer tenant screening?',
    answer: 'Yes! Our Growth and Professional plans include integrated tenant screening with background checks, credit reports, and eviction history. You can run screenings directly from the application review page.',
  },
  {
    question: 'How do I get started?',
    answer: 'Start your 14-day free trial in under 2 minutes — no setup fees, no contracts. Add your properties, invite your tenants, and start collecting rent online. A credit card is required to begin your trial.',
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className='w-full py-10 md:py-20 px-3 md:px-4 bg-white'>
      <div className='max-w-4xl mx-auto space-y-8 md:space-y-12'>

        {/* Header */}
        <div className='text-center space-y-3'>
          <div className='inline-flex items-center gap-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 px-4 py-1.5'>
            <HelpCircle className='h-3.5 w-3.5 text-cyan-400' />
            <span className='text-xs font-bold text-cyan-600'>Got Questions?</span>
          </div>
          <h2 className='text-2xl md:text-4xl font-black text-slate-900'>
            Frequently Asked{' '}
            <span className='bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent'>Questions</span>
          </h2>
          <p className='text-sm md:text-base text-slate-400 max-w-2xl mx-auto'>
            Everything you need to know about Property Flow HQ
          </p>
        </div>

        {/* Accordion */}
        <div className='space-y-3'>
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`rounded-xl border overflow-hidden transition-all duration-300 ${
                openIndex === index
                  ? 'border-cyan-300 bg-cyan-50/50'
                  : 'border-slate-200 bg-slate-50 hover:border-slate-300'
              }`}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className='w-full flex items-center justify-between p-4 md:p-5 text-left transition-colors'
              >
                <span className='text-sm md:text-base font-semibold text-slate-900 pr-4'>
                  {faq.question}
                </span>
                {openIndex === index ? (
                  <ChevronUp className='h-5 w-5 text-cyan-400 flex-shrink-0' />
                ) : (
                  <ChevronDown className='h-5 w-5 text-slate-500 flex-shrink-0' />
                )}
              </button>
              {openIndex === index && (
                <div className='px-4 md:px-5 pb-4 md:pb-5 border-t border-white/5'>
                  <p className='text-xs md:text-sm text-slate-600 leading-relaxed pt-4'>
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className='text-center space-y-3 pt-4'>
          <p className='text-slate-500 text-sm'>Still have questions?</p>
          <div className='flex flex-col sm:flex-row items-center justify-center gap-3'>
            <Link
              href='/sign-up'
              className='inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-7 py-3 text-sm font-bold shadow-xl shadow-cyan-500/20 hover:scale-105 transition-transform duration-200'
            >
              Start Your Free Trial
              <ArrowRight className='h-4 w-4' />
            </Link>
            <Link
              href='/contact'
              className='text-sm text-slate-400 hover:text-white transition-colors font-medium'
            >
              Contact Support &rarr;
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
