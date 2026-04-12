'use client';

import Link from 'next/link';
import { Star, Quote } from 'lucide-react';

const reviews = [
  {
    id: '1',
    name: 'Sarah Martinez',
    role: 'Landlord, 8 units',
    rating: 5,
    text: 'Finally, a tool that doesn\'t cost an arm and a leg. I went from spending 10+ hours a month on admin work to maybe 2 hours. The online rent collection alone is worth it.',
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
    text: 'As a small landlord, I couldn\'t justify paying $50-100/month for property management software. This being free is incredible. It has everything I need and more.',
    location: 'Reno, NV',
  },
];

const CustomerReviews = () => {
  return (
    <section className="w-full py-16 md:py-20 px-4 bg-gradient-to-b from-transparent to-slate-900/20">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-3 animate-in fade-in duration-700">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Loved by Small Landlords Everywhere
          </h2>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            See what real landlords are saying about managing their properties with us.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {reviews.map((review, index) => (
            <article
              key={review.id}
              className="group relative rounded-2xl border border-white/10 bg-slate-950/60 p-6 space-y-4 hover:border-emerald-500/30 hover:bg-slate-950/80 transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-40 transition-opacity">
                <Quote className="h-8 w-8 text-emerald-400" />
              </div>
              
              <div className="flex items-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < review.rating
                        ? 'fill-emerald-400 text-emerald-400'
                        : 'fill-slate-700 text-slate-700'
                    }`}
                  />
                ))}
              </div>

              <p className="text-sm text-slate-200 leading-relaxed relative z-10">
                "{review.text}"
              </p>

              <div className="pt-4 border-t border-white/10">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                    <span className="text-emerald-300 font-bold text-sm">
                      {review.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">{review.name}</div>
                    <div className="text-xs text-slate-400">{review.role}</div>
                    <div className="text-xs text-slate-500">{review.location}</div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 text-emerald-300 hover:text-emerald-200 font-semibold text-sm transition-colors"
          >
            Join these happy landlords
            <span className="text-emerald-400">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CustomerReviews;
