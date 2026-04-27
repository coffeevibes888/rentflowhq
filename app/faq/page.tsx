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
        a: 'No platform fees on any transactions - your subscription covers everything. Tenants pay rent with no added fees, and payments go directly to your bank account.',
      },
      {
        q: 'What payment methods do tenants have?',
        a: 'Tenants can pay rent via ACH bank transfer or credit/debit card. No fees are charged to tenants - your subscription covers payment processing.',
      },
    ],
  },
  {
    category: 'For Landlords',
    questions: [
      {
        q: 'How do I receive rent payments?',
        a: 'Rent payments go directly to your bank account via Stripe. Complete a quick onboarding process (about 5 minutes), and payments will automatically deposit to your bank - typically within 2 business days for card payments or 5 days for ACH.',
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
        a: 'Log into your tenant dashboard and click "Pay Rent". You can pay via bank account (ACH) or credit/debit card - no fees either way.',
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
        a: 'No platform fees for contractors. Payments go directly to your connected bank account when jobs are completed.',
      },
      {
        q: 'Do I get API access as a contractor?',
        a: 'Yes, on the Enterprise plan ($79.99/month). Contractor API keys start with pfhq_c_ and give you programmatic access to your jobs, invoices, and customers. You can also set up webhooks to receive real-time notifications when jobs are completed, invoices are paid, reviews come in, and more. Manage everything from Settings → API & Webhooks in your dashboard. Full docs at /docs/api/contractor.',
      },
      {
        q: 'What is the difference between the PM API and the Contractor API?',
        a: 'They are completely separate systems. The Property Manager API (pfhq_ keys) gives access to properties, units, leases, tenants, and rent payments — for landlords managing their portfolio. The Contractor API (pfhq_c_ keys) gives access to jobs, invoices, and customers — for contractors automating their business. Both require the Enterprise plan on their respective accounts.',
      },
      {
        q: 'How does the ranking system work? How do I show up higher in search?',
        a: 'Your position in search results is based entirely on merit — a composite score out of 100 points. Here\'s exactly how it breaks down: Average Rating (25pts, Bayesian-weighted so one review can\'t game the system), Review Volume (15pts, log scale so new contractors aren\'t buried), Completed Jobs (15pts, log scale), Response Rate (15pts — reply to messages fast!), Profile Completeness (10pts — fill in your photo, bio, tagline, location, and rate), Trust & Verification (10pts — get identity verified and insured), On-Time Rate (5pts), and Recent Activity (5pts — stay active). The best way to rank higher is completely free: get reviews, complete your profile, respond quickly, and get verified.',
      },
      {
        q: 'Can I pay to rank higher in search results?',
        a: 'No. Money cannot change your organic rank — that is always based on merit. What you can purchase is a Visibility Boost, which increases how many people see your card. Boosted cards appear in clearly labeled "Sponsored" slots (max 3 at a time) that rotate daily so no one locks the top forever. Packages start at $2.99 for 500 impressions, up to $9.99 for 3,000 impressions. Credits never expire.',
      },
      {
        q: 'What is the Visibility Boost and how does it work?',
        a: 'A Visibility Boost is an optional purchase that gets your contractor card shown to more people. You buy impression credits ($2.99–$9.99), and your card rotates into one of up to 3 "Sponsored" slots at the top of the marketplace. The rotation changes daily using a random seed, so even if many contractors have boosts, each gets fair exposure over time. Your organic rank is never affected — this is purely about reach, not rank. You can purchase boosts from your dashboard under Business → Marketplace Visibility.',
      },
      {
        q: 'Do new contractors get any help getting noticed?',
        a: 'Yes! Every new contractor automatically receives a free 30-day visibility boost when they create their profile. This gives you time to complete your profile, get your first reviews, and build your job history before competing purely on merit. After 30 days, your ranking is based on your actual quality signals.',
      },
      {
        q: 'What does "Verified" mean on a contractor card?',
        a: 'The green "Verified" badge means the contractor has completed both identity verification and insurance verification. This is worth 10 points in the ranking algorithm and signals to clients that you\'re a trusted professional. You can complete verification from your contractor dashboard.',
      },
      {
        q: 'Why does my specialty filter not show me even though I offer that service?',
        a: 'Make sure your specialties are listed in your profile under Business → Public Profile → Specialties. The filter matches against your listed specialties. If you offer Roofing and Electrical, you\'ll appear in results for both filters. The system matches regardless of capitalization.',
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
        a: 'Yes! Both Property Managers and Contractors on the Enterprise plan ($79.99/month) have access to their own REST API and webhooks. Property Managers can automate properties, units, leases, tenants, and payments. Contractors can automate jobs, invoices, and customers. API keys are created from your dashboard under Settings → API & Webhooks. Full documentation is at /docs/api.',
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
