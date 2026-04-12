-- CreateTable
CREATE TABLE "PropertyFeeSettings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "propertyId" UUID NOT NULL,
    "landlordId" UUID NOT NULL,
    "securityDepositMonths" DECIMAL(3,1),
    "noSecurityDeposit" BOOLEAN NOT NULL DEFAULT false,
    "lastMonthRentRequired" BOOLEAN,
    "petDepositEnabled" BOOLEAN,
    "petDepositAmount" DECIMAL(12,2),
    "petRentEnabled" BOOLEAN,
    "petRentAmount" DECIMAL(12,2),
    "noPetFees" BOOLEAN NOT NULL DEFAULT false,
    "cleaningFeeEnabled" BOOLEAN,
    "cleaningFeeAmount" DECIMAL(12,2),
    "noCleaningFee" BOOLEAN NOT NULL DEFAULT false,
    "applicationFeeEnabled" BOOLEAN,
    "applicationFeeAmount" DECIMAL(12,2),
    "noApplicationFee" BOOLEAN NOT NULL DEFAULT false,
    "lateFeeEnabled" BOOLEAN,
    "gracePeriodDays" INTEGER,
    "lateFeeType" TEXT,
    "lateFeeAmount" DECIMAL(12,2),
    "lateFeeMaxFee" DECIMAL(12,2),
    "noLateFees" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyFeeSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PropertyFeeSettings_propertyId_key" ON "PropertyFeeSettings"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyFeeSettings_propertyId_idx" ON "PropertyFeeSettings"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyFeeSettings_landlordId_idx" ON "PropertyFeeSettings"("landlordId");

-- AddForeignKey
ALTER TABLE "PropertyFeeSettings" ADD CONSTRAINT "PropertyFeeSettings_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
