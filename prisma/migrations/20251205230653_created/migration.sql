-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "streetAddress" TEXT,
ADD COLUMN     "unitNumber" TEXT;

-- AlterTable
ALTER TABLE "RentalApplication" ADD COLUMN     "adminResponse" TEXT,
ADD COLUMN     "propertySlug" TEXT;
