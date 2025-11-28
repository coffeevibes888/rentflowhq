'use server';

import { getLatestProductReviews } from '@/lib/actions/review.actions';
import { formatDateTime } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import Rating from '@/components/shared/product/rating';

const CustomerReviews = async () => {
  const reviews = await getLatestProductReviews(3);

  const fallback = !reviews.length
    ? [
        {
          id: 'dummy-1',
          title: 'Rocken my everyday vibe',
          description: 'Super comfy and the design gets compliments everywhere I go.',
          rating: 5,
          createdAt: new Date(),
          user: { name: 'Sample Customer', image: null },
          product: { name: 'Signature Hoodie', slug: '' },
        },
        {
          id: 'dummy-2',
          title: 'Perfect gift',
          description: 'Bought this as a gift and they absolutely loved it.',
          rating: 4,
          createdAt: new Date(),
          user: { name: 'Happy Gifter', image: null },
          product: { name: 'Statement Tee', slug: '' },
        },
        {
          id: 'dummy-3',
          title: 'Great quality & fit',
          description: 'Material feels premium and the fit is just right.',
          rating: 5,
          createdAt: new Date(),
          user: { name: 'First Time Buyer', image: null },
          product: { name: 'Everyday Crewneck', slug: '' },
        },
      ]
    : reviews;

  return (
    <section className="my-16">
      <div className="container mx-auto max-w-5xl px-4 md:px-6 space-y-6">
        <header className="space-y-1">
          <p className="text-xs tracking-[0.28em] uppercase text-violet-300">Customer Reviews</p>
          <h2 className="text-2xl md:text-3xl font-semibold text-white">What people are saying</h2>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          {fallback.map((review) => {
            const created = formatDateTime(review.createdAt);
            const userName = review.user?.name || 'Happy Customer';
            const initials = userName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();

            return (
              <article
                key={review.id}
                className="relative rounded-2xl border border-white/10 bg-slate-950/50 shadow-xl shadow-black/40 p-4 flex flex-col gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-10 rounded-full overflow-hidden bg-violet-600/80 flex items-center justify-center text-xs font-semibold text-white">
                    {review.user?.image ? (
                      <Image
                        src={review.user.image}
                        alt={userName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-white">{userName}</span>
                    <span className="text-[11px] text-gray-300">
                      {created.dateOnly} · {created.timeOnly}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 text-sm text-gray-100">
                  <div className="flex items-center gap-2 text-xs text-violet-200">
                    <Rating value={review.rating} />
                    <span className="uppercase tracking-[0.18em] text-[10px] text-gray-300">
                      {review.product?.name || 'Product'}
                    </span>
                  </div>
                  <p className="font-semibold text-sm text-white line-clamp-2">{review.title}</p>
                  <p className="text-xs text-gray-200 line-clamp-3">{review.description}</p>
                </div>

                <div className="mt-auto pt-2 text-right">
                  {review.product?.slug && (
                    <Link
                      href={`/product/${review.product.slug}`}
                      className="text-[11px] text-violet-300 hover:text-violet-200 underline"
                    >
                      View product
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CustomerReviews;
