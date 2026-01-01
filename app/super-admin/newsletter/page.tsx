import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prismaBase } from '@/db/prisma-base';
import NewsletterClient from './newsletter-client';

export const metadata = {
  title: 'Newsletter | Super Admin',
  description: 'Manage newsletter subscribers',
};

export default async function NewsletterPage() {
  const session = await auth();
  
  if (!session?.user?.id || session.user.role !== 'super_admin') {
    redirect('/unauthorized');
  }

  // Fetch subscribers
  const subscribers = await prismaBase.newsletterSubscriber.findMany({
    orderBy: { subscribedAt: 'desc' },
    take: 500,
  });

  // Get stats
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [total, active, unsubscribed, thisMonth] = await Promise.all([
    prismaBase.newsletterSubscriber.count(),
    prismaBase.newsletterSubscriber.count({ where: { status: 'active' } }),
    prismaBase.newsletterSubscriber.count({ where: { status: 'unsubscribed' } }),
    prismaBase.newsletterSubscriber.count({
      where: {
        subscribedAt: { gte: startOfMonth },
        status: 'active',
      },
    }),
  ]);

  return (
    <div className='container mx-auto py-8 px-4'>
      <NewsletterClient 
        initialSubscribers={subscribers.map((sub) => ({
          ...sub,
          subscribedAt: sub.subscribedAt.toISOString(),
          unsubscribedAt: sub.unsubscribedAt?.toISOString() || null,
        }))}
        stats={{
          total,
          active,
          unsubscribed,
          thisMonth,
        }}
      />
    </div>
  );
}
