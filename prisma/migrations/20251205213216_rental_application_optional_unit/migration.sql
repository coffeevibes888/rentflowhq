-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "bathrooms" DECIMAL(3,1),
ADD COLUMN     "bedrooms" INTEGER,
ADD COLUMN     "sizeSqFt" INTEGER;

-- AlterTable
ALTER TABLE "RentalApplication" ALTER COLUMN "unitId" DROP NOT NULL;
