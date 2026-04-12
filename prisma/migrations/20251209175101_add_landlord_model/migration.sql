-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "landlordId" UUID;

-- CreateTable
CREATE TABLE "Landlord" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "ownerUserId" UUID,
    "stripeConnectAccountId" TEXT,
    "stripeOnboardingStatus" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Landlord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Landlord_subdomain_key" ON "Landlord"("subdomain");

-- AddForeignKey
ALTER TABLE "Landlord" ADD CONSTRAINT "Landlord_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "Landlord"("id") ON DELETE SET NULL ON UPDATE CASCADE;
