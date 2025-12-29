-- Add Estimate model for contractor quotes
-- Add escrow fields to WorkOrder for Upwork-style flow
-- Run with: npx prisma db push (for development) or npx prisma migrate dev --name add_estimates_escrow

-- CreateTable: ContractorEstimate
CREATE TABLE IF NOT EXISTS "ContractorEstimate" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "contractorId" UUID NOT NULL,
    "landlordId" UUID,
    "workOrderId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "lineItems" JSONB NOT NULL DEFAULT '[]',
    "laborCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "materialsCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "estimatedHours" DECIMAL(6,2),
    "validUntil" TIMESTAMP(6),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "templateName" TEXT,
    "attachmentUrl" TEXT,
    "sentAt" TIMESTAMP(6),
    "viewedAt" TIMESTAMP(6),
    "respondedAt" TIMESTAMP(6),
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractorEstimate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ContractorEstimate_contractorId_idx" ON "ContractorEstimate"("contractorId");
CREATE INDEX IF NOT EXISTS "ContractorEstimate_landlordId_idx" ON "ContractorEstimate"("landlordId");
CREATE INDEX IF NOT EXISTS "ContractorEstimate_status_idx" ON "ContractorEstimate"("status");
CREATE INDEX IF NOT EXISTS "ContractorEstimate_isTemplate_idx" ON "ContractorEstimate"("isTemplate");

-- AddForeignKey
ALTER TABLE "ContractorEstimate" DROP CONSTRAINT IF EXISTS "ContractorEstimate_contractorId_fkey";
ALTER TABLE "ContractorEstimate" ADD CONSTRAINT "ContractorEstimate_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ContractorEstimate" DROP CONSTRAINT IF EXISTS "ContractorEstimate_landlordId_fkey";
ALTER TABLE "ContractorEstimate" ADD CONSTRAINT "ContractorEstimate_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "Landlord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ContractorEstimate" DROP CONSTRAINT IF EXISTS "ContractorEstimate_workOrderId_fkey";
ALTER TABLE "ContractorEstimate" ADD CONSTRAINT "ContractorEstimate_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add escrow fields to WorkOrder (if not exists)
ALTER TABLE "WorkOrder" ADD COLUMN IF NOT EXISTS "escrowStatus" TEXT DEFAULT 'none';
ALTER TABLE "WorkOrder" ADD COLUMN IF NOT EXISTS "escrowAmount" DECIMAL(12,2);
ALTER TABLE "WorkOrder" ADD COLUMN IF NOT EXISTS "escrowFundedAt" TIMESTAMP(6);
ALTER TABLE "WorkOrder" ADD COLUMN IF NOT EXISTS "escrowReleasedAt" TIMESTAMP(6);
ALTER TABLE "WorkOrder" ADD COLUMN IF NOT EXISTS "stripePaymentIntentId" TEXT;
ALTER TABLE "WorkOrder" ADD COLUMN IF NOT EXISTS "bidDeadline" TIMESTAMP(6);
ALTER TABLE "WorkOrder" ADD COLUMN IF NOT EXISTS "isOpenBid" BOOLEAN DEFAULT false;
ALTER TABLE "WorkOrder" ADD COLUMN IF NOT EXISTS "budgetMin" DECIMAL(12,2);
ALTER TABLE "WorkOrder" ADD COLUMN IF NOT EXISTS "budgetMax" DECIMAL(12,2);

-- Make contractorId nullable for open bid jobs
ALTER TABLE "WorkOrder" ALTER COLUMN "contractorId" DROP NOT NULL;
ALTER TABLE "WorkOrder" ALTER COLUMN "agreedPrice" DROP NOT NULL;

-- CreateIndex for open bids
CREATE INDEX IF NOT EXISTS "WorkOrder_isOpenBid_idx" ON "WorkOrder"("isOpenBid");

-- CreateTable: WorkOrderBid (for open job postings)
CREATE TABLE IF NOT EXISTS "WorkOrderBid" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workOrderId" UUID NOT NULL,
    "contractorId" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "estimatedHours" DECIMAL(6,2),
    "proposedStartDate" TIMESTAMP(6),
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkOrderBid_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "WorkOrderBid_workOrderId_idx" ON "WorkOrderBid"("workOrderId");
CREATE INDEX IF NOT EXISTS "WorkOrderBid_contractorId_idx" ON "WorkOrderBid"("contractorId");
CREATE UNIQUE INDEX IF NOT EXISTS "WorkOrderBid_workOrderId_contractorId_key" ON "WorkOrderBid"("workOrderId", "contractorId");

-- AddForeignKey
ALTER TABLE "WorkOrderBid" DROP CONSTRAINT IF EXISTS "WorkOrderBid_workOrderId_fkey";
ALTER TABLE "WorkOrderBid" ADD CONSTRAINT "WorkOrderBid_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkOrderBid" DROP CONSTRAINT IF EXISTS "WorkOrderBid_contractorId_fkey";
ALTER TABLE "WorkOrderBid" ADD CONSTRAINT "WorkOrderBid_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
