-- AlterTable
ALTER TABLE "Order" ADD COLUMN "trackingNumber" TEXT UNIQUE,
ADD COLUMN "trackingStatus" TEXT DEFAULT 'pending',
ADD COLUMN "trackingEvents" JSON[] DEFAULT ARRAY[]::JSON[],
ADD COLUMN "lastTrackingUpdate" TIMESTAMP(6);
