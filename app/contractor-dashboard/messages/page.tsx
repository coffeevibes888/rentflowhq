import { Metadata } from 'next';
import { requireContractor } from '@/lib/auth-guard';
import { ContractorInbox } from '@/components/contractor/contractor-inbox';
import { MessageCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Messages | Contractor',
  description: 'View and respond to customer messages',
};

export default async function ContractorMessagesPage() {
  const session = await requireContractor();

  return (
    <div className='w-full space-y-5'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
        <div>
          <h1 className='text-xl sm:text-2xl md:text-3xl font-bold text-black'>Messages</h1>
          <p className='text-xs sm:text-sm text-gray-500 mt-0.5'>
            Conversations with customers and homeowners
          </p>
        </div>
        <div className='flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-100'>
          <MessageCircle className='h-4 w-4 text-amber-500' />
          <span className='text-xs font-medium text-amber-700'>Inbox</span>
        </div>
      </div>

      <ContractorInbox userId={session.user.id} />
    </div>
  );
}
