-- AlterTable
ALTER TABLE "Landlord" ADD COLUMN     "managesForOthers" BOOLEAN DEFAULT false,
ADD COLUMN     "ownsProperties" BOOLEAN DEFAULT false,
ADD COLUMN     "unitsEstimateMax" INTEGER,
ADD COLUMN     "unitsEstimateMin" INTEGER,
ADD COLUMN     "useSubdomain" BOOLEAN NOT NULL DEFAULT true;
