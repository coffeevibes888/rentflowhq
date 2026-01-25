-- CreateTable
CREATE TABLE "ContractorUsageTracking" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "contractorId" UUID NOT NULL,
    "activeJobsCount" INTEGER NOT NULL DEFAULT 0,
    "invoicesThisMonth" INTEGER NOT NULL DEFAULT 0,
    "totalCustomers" INTEGER NOT NULL DEFAULT 0,
    "teamMembersCount" INTEGER NOT NULL DEFAULT 0,
    "inventoryCount" INTEGER NOT NULL DEFAULT 0,
    "equipmentCount" INTEGER NOT NULL DEFAULT 0,
    "activeLeadsCount" INTEGER NOT NULL DEFAULT 0,
    "lastResetDate" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractorUsageTracking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContractorUsageTracking_contractorId_key" ON "ContractorUsageTracking"("contractorId");

-- CreateIndex
CREATE INDEX "ContractorUsageTracking_contractorId_idx" ON "ContractorUsageTracking"("contractorId");

-- AddForeignKey
ALTER TABLE "ContractorUsageTracking" ADD CONSTRAINT "ContractorUsageTracking_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "ContractorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
