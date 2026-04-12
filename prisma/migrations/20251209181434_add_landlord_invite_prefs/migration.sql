-- AlterTable
ALTER TABLE "Landlord" ADD COLUMN     "inviteViaEmail" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "inviteViaSms" BOOLEAN NOT NULL DEFAULT false;
