import { Metadata } from 'next';
import { requireContractor } from '@/lib/auth-guard';
import { ContractorInbox } from '@/components/contractor/contractor-inbox';

export const metadata: Metadata = {
  title: 'Messages | Contractor',
  description: 'View and respond to customer messages',
};

export default async function ContractorMessagesPage() {
  const session = await requireContractor();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
        <p className="text-slate-500 text-sm mt-1">
          Conversations with customers and homeowners
        </p>
      </div>
      <ContractorInbox userId={session.user.id} />
    </div>
  );
}
