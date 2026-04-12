'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  CheckCircle, 
  Copy, 
  Mail, 
  MessageSquare,
  Linkedin,
  Facebook,
  Twitter,
  AlertTriangle,
  FileText,
  CreditCard,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Target,
  Lightbulb,
  Building2,
  Shield,
  Info
} from 'lucide-react';
import Link from 'next/link';
import AffiliateSignUpModal from './affiliate-signup-modal';

export default function AffiliateProgramClient() {
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const searchParams = useSearchParams();
  
  // Check for signup required message
  const signupRequired = searchParams.get('signup') === 'required';

  // Auto-open signup modal if redirected with signup=required
  useEffect(() => {
    if (signupRequired) {
      setShowSignUpModal(true);
    }
  }, [signupRequired]);

  const commissionTiers = [
    { plan: 'Starter Plan', price: '$19.99/mo', commission: '$5', color: 'bg-slate-500' },
    { plan: 'Pro Plan', price: '$39.99/mo', commission: '$10', color: 'bg-violet-500' },
    { plan: 'Enterprise Plan', price: '$79.99/mo', commission: '$25', color: 'bg-amber-500' },
  ];

  const benefits = [
    { icon: DollarSign, title: 'Competitive Commissions', description: 'Earn $5-$10 for every successful referral that converts to a paid plan.' },
    { icon: TrendingUp, title: '30-Day Cookie', description: 'Your referrals are tracked for 30 days, giving them time to convert.' },
    { icon: Users, title: 'Recurring Potential', description: 'Build passive income as your referrals continue their subscriptions.' },
    { icon: CheckCircle, title: 'Real-Time Tracking', description: 'Monitor clicks, signups, and earnings in your personal dashboard.' },
  ];

  const faqs = [
    {
      question: 'How do I get paid?',
      answer: 'Commissions are held for 30 days after a successful signup to ensure customer retention. After the holding period, you can request a payout via PayPal, Venmo, or bank transfer. Minimum payout is $25.'
    },
    {
      question: 'When do I earn a commission?',
      answer: 'You earn a commission when someone signs up using your referral link AND subscribes to a paid plan (Pro, Professional, or Enterprise). Free tier signups do not qualify for commissions.'
    },
    {
      question: 'How long does the cookie last?',
      answer: 'Our tracking cookie lasts 30 days. If someone clicks your link and signs up within 30 days, you get credit for the referral.'
    },
    {
      question: 'Can I refer myself or my own properties?',
      answer: 'No. Self-referrals are not allowed and will result in disqualification from the program. We monitor for fraudulent activity.'
    },
    {
      question: 'Is there a limit to how much I can earn?',
      answer: 'No! There is no cap on earnings. The more quality referrals you bring, the more you earn.'
    },
    {
      question: 'What marketing materials are provided?',
      answer: 'We provide email templates, social media copy, and talking points. You can find all resources in your affiliate dashboard after signing up.'
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Signup Required Banner */}
      {signupRequired && (
        <div className="bg-amber-500/20 border-b border-amber-500/30 px-4 py-3">
          <div className="max-w-6xl mx-auto flex items-center gap-3 text-amber-200">
            <Info className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">
              You're signed in but not yet registered as an affiliate. Sign up below to access your affiliate dashboard and start earning!
            </p>
          </div>
        </div>
      )}
      
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-transparent to-blue-600/20" />
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-2 rounded-full bg-violet-500/20 text-violet-300 text-sm font-medium mb-6">
              💰 Affiliate Program
            </span>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Earn Money Referring<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-blue-400">
                Property Managers
              </span>
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">
              Join our affiliate program and earn up to $10 for every landlord or property manager 
              you refer who subscribes to Property Flow HQ.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-violet-600 hover:bg-violet-700 text-white px-8"
                onClick={() => setShowSignUpModal(true)}
              >
                Become an Affiliate
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
                asChild
              >
                <Link href="/sign-in?callbackUrl=/affiliate-program/dashboard">Sign In to Dashboard</Link>
              </Button>
            </div>
          </div>

          {/* Commission Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            {commissionTiers.map((tier) => (
              <div 
                key={tier.plan}
                className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-6 text-center hover:border-violet-500/50 transition-all"
              >
                <div className={`w-12 h-12 ${tier.color} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">{tier.plan}</h3>
                <p className="text-slate-400 text-sm mb-4">{tier.price}</p>
                <p className="text-3xl font-bold text-green-400">{tier.commission}</p>
                <p className="text-slate-500 text-sm">per referral</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Sign Up', description: 'Create your free affiliate account in minutes' },
              { step: '2', title: 'Get Your Link', description: 'Receive your unique referral code and tracking link' },
              { step: '3', title: 'Share & Promote', description: 'Share with property managers, landlords, and investors' },
              { step: '4', title: 'Earn Money', description: 'Get paid for every successful paid subscription' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 rounded-full bg-violet-600 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-slate-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Why Join Our Program?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit) => (
              <div 
                key={benefit.title}
                className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-6"
              >
                <benefit.icon className="w-10 h-10 text-violet-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">{benefit.title}</h3>
                <p className="text-slate-400 text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Overview */}
      <section className="py-20 px-4 bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-4">What You're Promoting</h2>
          <p className="text-slate-400 text-center max-w-2xl mx-auto mb-12">
            Property Flow HQ is an all-in-one property management platform that helps landlords 
            and property managers streamline their operations.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Building2, title: 'Property Management', description: 'Manage unlimited properties, units, and tenants from one dashboard' },
              { icon: CreditCard, title: 'Rent Collection', description: 'Automated rent collection with ACH, cards, and cash payment options' },
              { icon: Users, title: 'Tenant Screening', description: 'Background checks, credit reports, and employment verification' },
              { icon: FileText, title: 'Digital Leases', description: 'Create, send, and e-sign leases with DocuSign integration' },
              { icon: Target, title: 'Maintenance Tracking', description: 'Work order management with contractor marketplace' },
              { icon: TrendingUp, title: 'Financial Reports', description: 'Income/expense tracking, tax reports, and analytics' },
            ].map((feature) => (
              <div key={feature.title} className="flex gap-4 p-4 rounded-xl bg-slate-800/50">
                <feature.icon className="w-8 h-8 text-violet-400 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                  <p className="text-slate-400 text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 rounded-2xl border border-violet-500/30 bg-violet-500/10">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-violet-400" />
              Key Selling Points
            </h3>
            <ul className="grid md:grid-cols-2 gap-3">
              {[
                'Free tier for up to 24 units - easy to get started',
                'Only $2 flat fee per rent payment - transparent pricing',
                'No long-term contracts - cancel anytime',
                'Mobile-friendly tenant portal',
                'Automated late fee calculations',
                'Built-in contractor marketplace',
                'QuickBooks integration for accounting',
                '24/7 customer support',
              ].map((point) => (
                <li key={point} className="flex items-start gap-2 text-slate-300">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Marketing Resources */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-4">Marketing Resources</h2>
          <p className="text-slate-400 text-center max-w-2xl mx-auto mb-12">
            We provide everything you need to successfully promote Property Flow HQ
          </p>

          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-slate-800 border border-slate-700 mb-8">
              <TabsTrigger value="email" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-300">
                <Mail className="w-4 h-4 mr-2" />
                Email
              </TabsTrigger>
              <TabsTrigger value="social" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-300">
                <MessageSquare className="w-4 h-4 mr-2" />
                Social
              </TabsTrigger>
              <TabsTrigger value="scripts" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-300">
                <FileText className="w-4 h-4 mr-2" />
                Scripts
              </TabsTrigger>
              <TabsTrigger value="tips" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-300">
                <Target className="w-4 h-4 mr-2" />
                Tips
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="space-y-6">
              <EmailTemplate 
                title="Introduction Email"
                subject="Simplify Your Property Management"
                body={`Hi [Name],

I wanted to share a tool that's been a game-changer for property managers I know - Property Flow HQ.

It's an all-in-one platform that handles:
• Online rent collection (ACH, cards, even cash payments)
• Tenant screening with background checks
• Digital lease signing
• Maintenance request tracking
• Financial reporting

The best part? They have a free tier for up to 24 units, so you can try it risk-free.

Check it out here: [YOUR REFERRAL LINK]

Let me know if you have any questions!

Best,
[Your Name]`}
              />
              <EmailTemplate 
                title="Follow-Up Email"
                subject="Quick question about your properties"
                body={`Hi [Name],

I reached out last week about Property Flow HQ - just wanted to follow up.

Are you still manually collecting rent checks or dealing with spreadsheets for tracking? 

Property Flow HQ automates all of that, plus they only charge $2 per rent payment (no percentage fees).

Here's my link if you want to check it out: [YOUR REFERRAL LINK]

Happy to answer any questions!

[Your Name]`}
              />
              <EmailTemplate 
                title="Pain Point Email"
                subject="Tired of chasing rent payments?"
                body={`Hi [Name],

If you're still chasing tenants for rent every month, I have a solution.

Property Flow HQ lets tenants pay online via ACH, card, or even cash at retail locations. It automatically tracks payments, sends reminders, and calculates late fees.

Plus, the tenant screening feature has saved property managers I know from bad tenants.

Try it free: [YOUR REFERRAL LINK]

[Your Name]`}
              />
            </TabsContent>

            <TabsContent value="social" className="space-y-6">
              <SocialTemplate 
                platform="LinkedIn"
                icon={Linkedin}
                content={`🏠 Property managers: Stop juggling spreadsheets and paper checks.

I've been recommending Property Flow HQ to landlords and they love it:
✅ Online rent collection
✅ Tenant screening
✅ Digital lease signing
✅ Maintenance tracking

Free for up to 24 units. Check it out 👇
[YOUR REFERRAL LINK]

#PropertyManagement #RealEstate #Landlords`}
              />
              <SocialTemplate 
                platform="Facebook"
                icon={Facebook}
                content={`Any landlords or property managers in my network? 🏠

Just discovered Property Flow HQ and it's seriously impressive. Handles rent collection, tenant screening, lease signing, and maintenance requests all in one place.

They have a free tier too! Link in comments 👇`}
              />
              <SocialTemplate 
                platform="Twitter/X"
                icon={Twitter}
                content={`Property managers: tired of the rent collection chaos?

@PropertyFlowHQ handles:
• Online payments
• Tenant screening  
• Digital leases
• Maintenance tracking

Free for up to 24 units 🔥

[YOUR REFERRAL LINK]`}
              />
            </TabsContent>

            <TabsContent value="scripts" className="space-y-6">
              <ScriptTemplate 
                title="Phone/In-Person Script"
                scenario="When talking to a landlord or property manager"
                script={`"Hey, do you manage any rental properties? I've been telling people about this platform called Property Flow HQ.

It basically handles everything - rent collection, tenant screening, lease signing, maintenance requests. The cool thing is tenants can pay online, so you're not chasing checks anymore.

They have a free version for smaller portfolios, and even the paid plans are pretty affordable - just $30-80 a month depending on how many units you have.

Want me to send you the link? I think you'd find it useful."`}
              />
              <ScriptTemplate 
                title="Real Estate Meetup Script"
                scenario="At networking events or investor meetups"
                script={`"What software are you using for property management? I've been recommending Property Flow HQ to a lot of investors lately.

The main things people love are the automated rent collection - tenants can pay via ACH, card, or even cash at stores - and the tenant screening is built right in.

Plus they integrate with QuickBooks for accounting. It's been a game-changer for the landlords I know.

Here's my card with the link - definitely worth checking out if you're scaling your portfolio."`}
              />
              <ScriptTemplate 
                title="DM Script"
                scenario="For direct messages on social media"
                script={`"Hey [Name]! Saw you're in property management. Quick question - what are you using for rent collection and tenant management?

I've been telling people about Property Flow HQ. It handles online payments, screening, leases, and maintenance all in one place. Free tier for up to 24 units.

Not trying to sell you anything - just thought it might be useful! Here's the link if you want to check it out: [YOUR REFERRAL LINK]"`}
              />
            </TabsContent>

            <TabsContent value="tips" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <TipCard 
                  title="Target the Right Audience"
                  tips={[
                    'Landlords with 5-50 units (sweet spot for paid plans)',
                    'Property management companies',
                    'Real estate investors scaling their portfolio',
                    'Real estate agents who work with investors',
                    'Accountants who serve landlords',
                  ]}
                />
                <TipCard 
                  title="Best Places to Promote"
                  tips={[
                    'Real estate investing Facebook groups',
                    'LinkedIn property management communities',
                    'Local landlord associations',
                    'Real estate meetups and networking events',
                    'BiggerPockets forums',
                    'YouTube videos about landlording',
                  ]}
                />
                <TipCard 
                  title="Highlight These Pain Points"
                  tips={[
                    'Chasing rent payments every month',
                    'Bad tenants from poor screening',
                    'Paper lease hassles',
                    'Maintenance request chaos',
                    'Tax time spreadsheet nightmares',
                    'High percentage fees from other platforms',
                  ]}
                />
                <TipCard 
                  title="Conversion Tips"
                  tips={[
                    'Emphasize the free tier - low barrier to try',
                    'Mention the flat $2 fee vs percentage fees',
                    'Share success stories if you have them',
                    'Follow up! Most conversions happen after 2-3 touches',
                    'Offer to help them get set up',
                  ]}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Rules & Disqualification */}
      <section className="py-20 px-4 bg-slate-900/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-4">Program Rules</h2>
          <p className="text-slate-400 text-center mb-12">
            Please review these guidelines to maintain your affiliate status
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-6">
              <h3 className="text-xl font-semibold text-green-400 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Allowed Activities
              </h3>
              <ul className="space-y-3">
                {[
                  'Sharing your link on social media',
                  'Email marketing to your own list',
                  'Writing blog posts or reviews',
                  'Creating YouTube content',
                  'Word-of-mouth referrals',
                  'Posting in relevant online communities',
                  'Networking at real estate events',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-slate-300">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-1" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
              <h3 className="text-xl font-semibold text-red-400 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Prohibited Activities
              </h3>
              <ul className="space-y-3">
                {[
                  'Self-referrals or referring your own accounts',
                  'Paid advertising bidding on our brand terms',
                  'Spam or unsolicited bulk messaging',
                  'False or misleading claims about the product',
                  'Cookie stuffing or click fraud',
                  'Creating fake accounts to earn commissions',
                  'Incentivizing signups with cash/gifts',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-slate-300">
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-1" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-8 p-6 rounded-2xl border border-amber-500/30 bg-amber-500/10">
            <h3 className="text-lg font-semibold text-amber-400 mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Disqualification Policy
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Violation of any prohibited activities will result in immediate termination from the affiliate program, 
              forfeiture of pending commissions, and potential legal action for fraud. We actively monitor for 
              suspicious activity and reserve the right to withhold or reverse commissions if fraud is detected.
            </p>
          </div>
        </div>
      </section>

      {/* Payment Information */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-4">Getting Paid</h2>
          <p className="text-slate-400 text-center mb-12">
            We make it easy to receive your commissions
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { method: 'PayPal', description: 'Instant transfer to your PayPal account', icon: '💳' },
              { method: 'Venmo', description: 'Quick payment to your Venmo', icon: '📱' },
              { method: 'Bank Transfer', description: 'Direct deposit to your bank account', icon: '🏦' },
            ].map((payment) => (
              <div key={payment.method} className="rounded-xl border border-white/10 bg-slate-800/50 p-6 text-center">
                <span className="text-4xl mb-4 block">{payment.icon}</span>
                <h3 className="font-semibold text-white mb-2">{payment.method}</h3>
                <p className="text-slate-400 text-sm">{payment.description}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Payment Schedule</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold flex-shrink-0">1</div>
                <div>
                  <p className="text-white font-medium">Commission Earned</p>
                  <p className="text-slate-400 text-sm">When your referral subscribes to a paid plan</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold flex-shrink-0">2</div>
                <div>
                  <p className="text-white font-medium">30-Day Hold Period</p>
                  <p className="text-slate-400 text-sm">Commission is held to ensure customer retention and prevent fraud</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold flex-shrink-0">3</div>
                <div>
                  <p className="text-white font-medium">Available for Payout</p>
                  <p className="text-slate-400 text-sm">Request payout once you reach the $25 minimum balance</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-bold flex-shrink-0">✓</div>
                <div>
                  <p className="text-white font-medium">Payment Processed</p>
                  <p className="text-slate-400 text-sm">Payments are processed within 5-7 business days</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-slate-900/50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className="rounded-xl border border-white/10 bg-slate-800/50 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left"
                >
                  <span className="font-medium text-white">{faq.question}</span>
                  {expandedFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </button>
                {expandedFaq === index && (
                  <div className="px-6 pb-4">
                    <p className="text-slate-400">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Earning?</h2>
          <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
            Join hundreds of affiliates who are earning commissions by referring property managers 
            to Property Flow HQ. Sign up takes less than 2 minutes.
          </p>
          <Button 
            size="lg" 
            className="bg-violet-600 hover:bg-violet-700 text-white px-12"
            onClick={() => setShowSignUpModal(true)}
          >
            Become an Affiliate Today
          </Button>
          <p className="text-slate-400 text-sm mt-4">
            Already an affiliate?{' '}
            <Link href="/sign-in?callbackUrl=/affiliate-program/dashboard" className="text-violet-400 hover:underline">
              Sign in to your dashboard
            </Link>
          </p>
          <p className="text-slate-500 text-sm mt-2">
            Questions? Email us at <a href="mailto:affiliates@propertyflowhq.com" className="text-violet-400 hover:underline">affiliates@propertyflowhq.com</a>
          </p>
        </div>
      </section>

      {/* Sign Up Modal */}
      <AffiliateSignUpModal 
        isOpen={showSignUpModal} 
        onClose={() => setShowSignUpModal(false)} 
      />
    </div>
  );
}

// Helper Components
function EmailTemplate({ title, subject, body }: { title: string; subject: string; body: string }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-white/10 bg-slate-800/50 overflow-hidden">
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white">{title}</h3>
          <p className="text-sm text-slate-400">Subject: {subject}</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={copyToClipboard}
          className="border-slate-600"
        >
          {copied ? <CheckCircle className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </div>
      <pre className="p-6 text-sm text-slate-300 whitespace-pre-wrap font-sans">{body}</pre>
    </div>
  );
}

function SocialTemplate({ platform, icon: Icon, content }: { platform: string; icon: any; content: string }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-white/10 bg-slate-800/50 overflow-hidden">
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-violet-400" />
          <h3 className="font-semibold text-white">{platform}</h3>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={copyToClipboard}
          className="border-slate-600"
        >
          {copied ? <CheckCircle className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </div>
      <pre className="p-6 text-sm text-slate-300 whitespace-pre-wrap font-sans">{content}</pre>
    </div>
  );
}

function ScriptTemplate({ title, scenario, script }: { title: string; scenario: string; script: string }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-white/10 bg-slate-800/50 overflow-hidden">
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white">{title}</h3>
          <p className="text-sm text-slate-400">{scenario}</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={copyToClipboard}
          className="border-slate-600"
        >
          {copied ? <CheckCircle className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </div>
      <pre className="p-6 text-sm text-slate-300 whitespace-pre-wrap font-sans">{script}</pre>
    </div>
  );
}

function TipCard({ title, tips }: { title: string; tips: string[] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-800/50 p-6">
      <h3 className="font-semibold text-white mb-4">{title}</h3>
      <ul className="space-y-2">
        {tips.map((tip, index) => (
          <li key={index} className="flex items-start gap-2 text-slate-300 text-sm">
            <span className="text-violet-400">•</span>
            {tip}
          </li>
        ))}
      </ul>
    </div>
  );
}
