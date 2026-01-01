'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const faqs = [
  {
    question: 'Is Property Flow HQ really free?',
    answer: 'Yes! Our free tier includes up to 24 units with full features including online rent collection, maintenance tickets, digital leases, and your own branded tenant portal. We only charge a $2 flat fee per rent payment processed.',
  },
  {
    question: 'How does rent collection work?',
    answer: 'Tenants pay rent through our secure Stripe-powered payment system. They can use credit cards, debit cards, or bank transfers (ACH). Funds are deposited directly to your bank account within 2-3 business days. We charge a flat $2 fee per payment — not a percentage of rent.',
  },
  {
    question: 'Can tenants pay rent in cash?',
    answer: 'Yes! We partner with PayNearMe, GreenDot, and MoneyGram to allow tenants to pay cash at thousands of retail locations nationwide. The payment is automatically recorded in your dashboard.',
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
    answer: 'Sign up for free in under 2 minutes. Add your properties and units, invite your tenants, and start collecting rent online. No credit card required for the free tier.',
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className='w-full py-10 md:py-20 px-3 md:px-4'>
      <div className='max-w-4xl mx-auto space-y-8 md:space-y-12'>
        <div className='text-center space-y-2 md:space-y-3'>
          <h2 className='text-2xl md:text-4xl font-bold text-white'>
            Frequently Asked Questions
          </h2>
          <p className='text-sm md:text-lg text-black font-semibold max-w-2xl mx-auto'>
            Everything you need to know about Property Flow HQ
          </p>
        </div>

        <div className='space-y-3'>
          {faqs.map((faq, index) => (
            <div
              key={index}
              className='rounded-xl border border-white/10 bg-slate-900/60 backdrop-blur-sm overflow-hidden transition-all duration-300'
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className='w-full flex items-center justify-between p-4 md:p-5 text-left hover:bg-white/5 transition-colors'
              >
                <span className='text-sm md:text-base font-semibold text-white pr-4'>
                  {faq.question}
                </span>
                {openIndex === index ? (
                  <ChevronUp className='h-5 w-5 text-violet-400 flex-shrink-0' />
                ) : (
                  <ChevronDown className='h-5 w-5 text-slate-400 flex-shrink-0' />
                )}
              </button>
              {openIndex === index && (
                <div className='px-4 md:px-5 pb-4 md:pb-5'>
                  <p className='text-xs md:text-sm text-slate-300 leading-relaxed'>
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
