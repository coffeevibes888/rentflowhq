'use client';

import Link from 'next/link';
import { Star, Quote, ArrowRight, Users, Clock, Shield } from 'lucide-react';

const reviews = [
  {
    id: '1',
    name: 'Sarah Martinez',
    role: 'Landlord, 8 units',
    rating: 5,
    text: 'Finally, a tool that doesn\'t cost an arm and a leg. I went from spending 10+ hours a month on admin work to maybe 2 hours. The online rent collection alone is worth every penny.',
    location: 'Las Vegas, NV',
  },
  {
    id: '2',
    name: 'Michael Chen',
    role: 'Property Manager, 24 units',
    rating: 5,
    text: 'The maintenance ticket system changed everything. No more lost texts or forgotten requests. Everything is tracked and organized. My tenants love how easy it is to submit tickets.',
    location: 'Phoenix, AZ',
  },
  {
    id: '3',
    name: 'Jennifer Williams',
    role: 'Landlord, 3 units',
    rating: 5,
    text: 'At $19.99/month I was skeptical, but it pays for itself in the first hour I save. Buildium wanted $55+ just to start. This has everything I need without the ridiculous price tag.',
    location: 'Reno, NV',
  },
];

const stats = [
  { icon: Users,  label: 'Landlords & PMs',   value: '500+' },
  { icon: Clock,  label: 'Hours saved / month', value: '8+' },
  { icon: Shield, label: 'Secure & Encrypted',  value: '256-bit' },
];

const CustomerReviews = () => {
  return (
    <section className='w-full py-16 md:py-24 px-4 bg-slate-50'>
      <div className='max-w-6xl mx-auto space-y-12'>

        {/* Header */}
        <div className='text-center space-y-4'>
          <div className='inline-flex items-center gap-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 px-4 py-1.5'>
            <div className='flex items-center gap-0.5'>
              {[...Array(5)].map((_, i) => (
                <Star key={i} className='h-3.5 w-3.5 fill-amber-400 text-amber-400' />
              ))}
            </div>
            <span className='text-xs font-bold text-cyan-600'>4.9 · Trusted by 500+ landlords</span>
          </div>
          <h2 className='text-3xl md:text-4xl font-black text-slate-900'>
            Real Landlords.{' '}
            <span className='bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent'>Real Results.</span>
          </h2>
          <p className='text-slate-500 max-w-xl mx-auto text-sm md:text-base'>
            Property managers across the country switched from expensive software and spreadsheets. Here&apos;s what they say.
          </p>
        </div>

        {/* Stats bar */}
        <div className='grid grid-cols-3 gap-4 max-w-2xl mx-auto'>
          {stats.map((stat) => (
            <div key={stat.label} className='text-center space-y-1'>
              <stat.icon className='h-5 w-5 text-cyan-400 mx-auto' />
              <div className='text-2xl font-black text-slate-900'>{stat.value}</div>
              <div className='text-xs text-slate-500 font-medium'>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Review cards */}
        <div className='grid gap-6 md:grid-cols-3'>
          {reviews.map((review, index) => (
            <article
              key={review.id}
              className='group relative rounded-2xl border border-slate-200 bg-white p-6 space-y-4 hover:border-cyan-300 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]'
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className='absolute top-4 right-4 opacity-20 group-hover:opacity-50 transition-opacity'>
                <Quote className='h-8 w-8 text-cyan-400' />
              </div>

              <div className='flex items-center gap-1'>
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < review.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-700 text-slate-700'
                    }`}
                  />
                ))}
              </div>

              <p className='text-sm text-slate-600 leading-relaxed relative z-10'>
                &ldquo;{review.text}&rdquo;
              </p>

              <div className='pt-4 border-t border-slate-200'>
                <div className='flex items-center gap-3'>
                  <div className='h-10 w-10 rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-500/30 border border-cyan-500/30 flex items-center justify-center'>
                    <span className='text-cyan-300 font-bold text-sm'>
                      {review.name.split(' ').map((n: string) => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <div className='font-semibold text-slate-900 text-sm'>{review.name}</div>
                    <div className='text-xs text-slate-400'>{review.role}</div>
                    <div className='text-xs text-slate-500'>{review.location}</div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* CTA */}
        <div className='text-center'>
          <Link
            href='/sign-up'
            className='inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-3.5 text-sm font-bold shadow-xl shadow-cyan-500/20 hover:scale-105 transition-transform duration-200'
          >
            Join these landlords
            <ArrowRight className='h-4 w-4' />
          </Link>
          <p className='mt-2 text-xs text-slate-400'>14-day free trial &mdash; credit card required</p>
        </div>
      </div>
    </section>
  );
};

export default CustomerReviews;
