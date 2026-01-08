'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const faqs = [
  {
    category: 'General',
    questions: [
      {
        q: 'What is PropertyFlow HQ?',
        a: 'PropertyFlow HQ is a comprehensive property management platform that helps landlords manage their properties, tenants, and finances all in one place. We offer tools for rent collection, maintenance tracking, lease management, and more.',
      },
      {
        q: 'Who can use PropertyFlow HQ?',
        a: 'Our platform is designed for landlords, property managers, tenants, contractors, and homeowners. Each user type has access to features tailored to their specific needs.',
      },
      {
        q: 'Is there a free trial?',
        a: 'Yes! New landlords can start with our Starter plan which includes up to 24 units. You can upgrade to Pro or Enterprise plans as your portfolio grows.',
      },
    ],
  },
  {
    category: 'Pricing & Billing',
    questions: [
      {
        q: 'What are the subscription tiers?',
        a: 'We offer three tiers: Starter ($19.99/month for up to 24 units), Pro ($39.99/month for up to 100 units), and Enterprise ($79.99/month for unlimited units with team features).',
      },
      {
        q: 'Are there any transaction fees?',
        a: 'No platform fees on rent payments - your subscription covers everything. For contractor marketplace transactions, there is a $1 fee from each party ($2 total per transaction).',
      },
      {
        q: 'What payment methods do tenants have?',
        a: 'Tenants can pay rent via ACH bank transfer (0.8% fee capped at $5), credit/debit card (2.9% + $0.30), or Link for faster checkout.',
      },
    ],
  },
  {
    category: 'For Landlords',
    questions: [
      {
        q: 'How do I receive rent payments?',
        a: 'Rent payments go directly to your connected Stripe account. You\'ll need to complete Stripe onboarding to receive payments, which typically takes a few minutes.',
      },
      {
        q: 'Can I manage multiple properties?',
        a: 'Yes! You can add unlimited properties and units based on your subscription tier. Each property can have multiple units with individual lease tracking.',
      },
      {
        q: 'How does the contractor marketplace work?',
        a: 'You can post work orders and hire verified contractors directly through our platform. Payments are handled securely with escrow protection.',
      },
    ],
  },
  {
    category: 'For Tenants',
    questions: [
      {
        q: 'How do I pay rent?',
        a: 'Log into your tenant dashboard and click "Pay Rent". You can pay via bank account (ACH) for the lowest fees, or use a credit/debit card.',
      },
      {
        q: 'Can I set up autopay?',
        a: 'Yes! You can enable automatic rent payments from your dashboard. We\'ll charge your saved payment method on your rent due date.',
      },
      {
        q: 'How do I submit a maintenance request?',
        a: 'From your tenant dashboard, go to Maintenance and click "New Request". Describe the issue, add photos if needed, and submit. Your landlord will be notified immediately.',
      },
    ],
  },
  {
    category: 'For Contractors',
    questions: [
      {
        q: 'How do I get hired for jobs?',
        a: 'Create a contractor profile, list your services and service areas, and you\'ll appear in search results. Landlords and homeowners can then hire you for work orders.',
      },
      {
        q: 'How do I get paid?',
        a: 'Payments are released to your connected Stripe account once the job is marked complete. Funds typically arrive in 2-3 business days.',
      },
      {
        q: 'What fees do contractors pay?',
        a: 'There\'s a $1 platform fee deducted from each payment you receive. This helps us maintain the marketplace and provide support.',
      },
    ],
  },
  {
    category: 'Security & Support',
    questions: [
      {
        q: 'Is my data secure?',
        a: 'Yes! We use industry-standard encryption, secure payment processing through Stripe, and follow best practices for data protection. We never store sensitive payment information on our servers.',
      },
      {
        q: 'How do I contact support?',
        a: 'You can reach our support team via the Contact page, or email us directly. Enterprise customers have access to priority support.',
      },
      {
        q: 'Do you offer an API?',
        a: 'Yes! Enterprise customers have access to our REST API for integrations. Check out our API documentation for details.',
      },
    ],
  },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-white/10">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 text-left"
      >
        <span className="font-medium text-white">{question}</span>
        <ChevronDown
          className={cn(
            'h-5 w-5 text-white/60 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      {isOpen && (
        <div className="pb-4 text-white/70">
          {answer}
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-white/70">
            Find answers to common questions about PropertyFlow HQ
          </p>
        </div>

        <div className="space-y-8">
          {faqs.map((category) => (
            <div
              key={category.category}
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6"
            >
              <h2 className="text-xl font-semibold text-white mb-4">
                {category.category}
              </h2>
              <div className="space-y-0">
                {category.questions.map((faq) => (
                  <FAQItem
                    key={faq.q}
                    question={faq.q}
                    answer={faq.a}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-white/70 mb-4">
            Still have questions?
          </p>
          <a
            href="/contact"
            className="inline-block bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
  );
}
