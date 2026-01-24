import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import { BidSubmitForm } from '@/components/contractor/bid-submit-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Submit Bid',
};

export default async function SubmitBidPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  // Get contractor profile
  const contractor = await prisma.contractorProfile.findFirst({
    where: { userId: session.user.id },
  });

  if (!contractor) {
    redirect('/onboarding/contractor');
  }

  // Get the job
  const job = await prisma.workOrder.findUnique({
    where: { id: params.id },
    include: {
      landlord: {
        select: {
          companyName: true,
          logoUrl: true,
        },
      },
      bids: {
        where: {
          contractorId: contractor.id,
        },
      },
    },
  });

  if (!job) {
    redirect('/contractor/marketplace');
  }

  // Check if already bid
  if (job.bids.length > 0) {
    redirect(`/contractor/marketplace?error=already_bid`);
  }

  // Check if bidding is still open
  if (job.bidDeadline && new Date(job.bidDeadline) < new Date()) {
    redirect(`/contractor/marketplace?error=deadline_passed`);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        href="/contractor/marketplace"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Marketplace
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-blue-600">Submit Your Bid</h1>
        <p className="text-sm text-gray-600 mt-1">
          Provide a competitive bid and proposal to win this job
        </p>
      </div>

      {/* Job Details */}
      <div className="rounded-xl border-2 border-gray-200 bg-white shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Details</h3>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Title</p>
            <p className="text-lg font-semibold text-gray-900">{job.title}</p>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-1">Description</p>
            <p className="text-sm text-gray-700">{job.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Category</p>
              <p className="text-sm font-medium text-gray-900">{job.category}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Priority</p>
              <p className="text-sm font-medium text-gray-900 capitalize">
                {job.priority}
              </p>
            </div>
          </div>

          {job.address && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Location</p>
              <p className="text-sm text-gray-900">{job.address}</p>
            </div>
          )}

          <div>
            <p className="text-sm text-gray-600 mb-1">Customer Budget Range</p>
            <p className="text-xl font-bold text-blue-600">
              ${Number(job.budgetMin).toLocaleString()} - $
              {Number(job.budgetMax).toLocaleString()}
            </p>
          </div>

          {job.bidDeadline && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Bidding Deadline</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(job.bidDeadline).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          )}

          {job.landlord.companyName && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Posted By</p>
              <p className="text-sm font-medium text-gray-900">
                {job.landlord.companyName}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bid Form */}
      <BidSubmitForm
        jobId={job.id}
        contractorId={contractor.id}
        jobTitle={job.title}
        jobBudget={{
          min: Number(job.budgetMin),
          max: Number(job.budgetMax),
        }}
      />
    </div>
  );
}
