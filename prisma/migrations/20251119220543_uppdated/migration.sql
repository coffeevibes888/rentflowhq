/*
  Warnings:

  - A unique constraint covering the columns `[stripePaymentMethodId]` on the table `SavedPaymentMethod` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `stripePaymentMethodId` to the `SavedPaymentMethod` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SavedPaymentMethod" ADD COLUMN     "billingAddress" JSON,
ADD COLUMN     "brand" TEXT,
ADD COLUMN     "cardholderName" TEXT,
ADD COLUMN     "expirationDate" TEXT,
ADD COLUMN     "stripePaymentMethodId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "billingAddress" JSON,
ADD COLUMN     "shippingAddress" JSON;

-- CreateIndex
CREATE UNIQUE INDEX "SavedPaymentMethod_stripePaymentMethodId_key" ON "SavedPaymentMethod"("stripePaymentMethodId");

-- CreateIndex
CREATE INDEX "SavedPaymentMethod_stripePaymentMethodId_idx" ON "SavedPaymentMethod"("stripePaymentMethodId");
