/*
  Warnings:

  - A unique constraint covering the columns `[customDomain]` on the table `Landlord` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Landlord" ADD COLUMN     "aboutBio" TEXT,
ADD COLUMN     "aboutGallery" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "aboutPhoto" TEXT,
ADD COLUMN     "companyAddress" TEXT,
ADD COLUMN     "companyEmail" TEXT,
ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "companyPhone" TEXT,
ADD COLUMN     "customDomain" TEXT,
ADD COLUMN     "freeBackgroundChecks" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "freeEmploymentVerification" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "heroImages" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "stripeSubscriptionId" TEXT,
ADD COLUMN     "subscriptionEndsAt" TIMESTAMP(6),
ADD COLUMN     "subscriptionStatus" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "subscriptionTier" TEXT NOT NULL DEFAULT 'free',
ADD COLUMN     "themeColor" TEXT NOT NULL DEFAULT 'violet',
ADD COLUMN     "unitLimitNotifiedAt" TIMESTAMP(6);

-- AlterTable
ALTER TABLE "Lease" ADD COLUMN     "docusignEnvelopeId" TEXT,
ADD COLUMN     "landlordSignedAt" TIMESTAMP(6),
ADD COLUMN     "tenantSignedAt" TIMESTAMP(6);

-- AlterTable
ALTER TABLE "MaintenanceTicket" ADD COLUMN     "cost" DECIMAL(12,2),
ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "RentPayment" ADD COLUMN     "convenienceFee" DECIMAL(12,2) DEFAULT 0,
ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "payoutId" UUID;

-- AlterTable
ALTER TABLE "RentalApplication" ADD COLUMN     "encryptedSsn" TEXT,
ADD COLUMN     "screeningBundle" TEXT,
ADD COLUMN     "screeningCompletedAt" TIMESTAMP(6),
ADD COLUMN     "screeningProvider" TEXT,
ADD COLUMN     "screeningReportUrl" TEXT,
ADD COLUMN     "screeningRequestedAt" TIMESTAMP(6),
ADD COLUMN     "screeningStatus" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "blockedAt" TIMESTAMP(6),
ADD COLUMN     "blockedBy" UUID,
ADD COLUMN     "blockedReason" TEXT,
ADD COLUMN     "isBlocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notificationPreferences" JSON,
ADD COLUMN     "stripeCustomerId" TEXT;

-- CreateTable
CREATE TABLE "CashPayment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "referenceId" TEXT NOT NULL,
    "paymentIntentId" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "fee" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "partnerId" TEXT NOT NULL,
    "barcodeData" TEXT NOT NULL,
    "confirmationNumber" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "CashPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuickBooksConnection" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "landlordId" UUID NOT NULL,
    "realmId" TEXT,
    "accessTokenEncrypted" TEXT,
    "refreshTokenEncrypted" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "oauthState" TEXT,
    "connectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuickBooksConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocuSignConnection" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "landlordId" UUID NOT NULL,
    "accessTokenEncrypted" TEXT,
    "refreshTokenEncrypted" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "oauthState" TEXT,
    "connectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocuSignConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedPayoutMethod" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "landlordId" UUID NOT NULL,
    "stripePaymentMethodId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "accountHolderName" TEXT,
    "last4" TEXT NOT NULL,
    "bankName" TEXT,
    "accountType" TEXT,
    "routingNumber" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedPayoutMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payout" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "landlordId" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "initiatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(6),
    "stripeTransferId" TEXT,
    "metadata" JSON,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformFee" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "payoutId" UUID NOT NULL,
    "landlordId" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'instant_payout_fee',
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSON,

    CONSTRAINT "PlatformFee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "landlordId" UUID NOT NULL,
    "propertyId" UUID,
    "unitId" UUID,
    "amount" DECIMAL(12,2) NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "incurredAt" TIMESTAMP(6) NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketBenchmark" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "landlordId" UUID NOT NULL,
    "propertyId" UUID,
    "zip" TEXT,
    "propertyType" TEXT,
    "bedrooms" INTEGER,
    "averageRent" DECIMAL(12,2) NOT NULL,
    "source" TEXT,
    "effectiveDate" TIMESTAMP(6) NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketBenchmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyFinance" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "propertyId" UUID NOT NULL,
    "purchasePrice" DECIMAL(12,2),
    "downPayment" DECIMAL(12,2),
    "loanBalance" DECIMAL(12,2),
    "interestRatePercent" DECIMAL(6,3),
    "loanTermMonths" INTEGER,
    "annualPropertyTax" DECIMAL(12,2),
    "annualInsurance" DECIMAL(12,2),
    "hoaMonthly" DECIMAL(12,2),
    "managementFeePercent" DECIMAL(6,3),
    "appreciationRatePercent" DECIMAL(6,3),
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyFinance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaseViolation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "landlordId" UUID NOT NULL,
    "leaseId" UUID NOT NULL,
    "tenantId" UUID,
    "unitId" UUID,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "occurredAt" TIMESTAMP(6) NOT NULL,
    "resolvedAt" TIMESTAMP(6),
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaseViolation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationDocument" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "applicationId" UUID NOT NULL,
    "landlordId" UUID NOT NULL,
    "uploadedById" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "cloudinaryPublicId" TEXT NOT NULL,
    "cloudinaryResourceType" TEXT NOT NULL DEFAULT 'raw',
    "status" TEXT NOT NULL DEFAULT 'uploaded',
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "actionUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalDocument" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "landlordId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT,
    "state" TEXT,
    "fileUrl" TEXT,
    "fileType" TEXT,
    "fileSize" INTEGER,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "docusignTemplateId" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentSignatureRequest" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "documentId" UUID NOT NULL,
    "leaseId" UUID,
    "recipientEmail" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "docusignEnvelopeId" TEXT,
    "signedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "token" TEXT,
    "signerName" TEXT,
    "signerEmail" TEXT,
    "signerIp" TEXT,
    "signerUserAgent" TEXT,
    "signedPdfUrl" TEXT,
    "auditLogUrl" TEXT,
    "documentHash" TEXT,
    "role" TEXT NOT NULL DEFAULT 'tenant',
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentSignatureRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyInspection" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "propertyId" UUID NOT NULL,
    "inspectorId" UUID,
    "unitId" UUID,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "location" JSON,
    "summary" JSON,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(6),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyInspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionItem" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "inspectionId" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InspectionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertySchedule" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "propertyId" UUID NOT NULL,
    "schedule" JSON NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/Los_Angeles',
    "slotDuration" INTEGER NOT NULL DEFAULT 30,
    "bufferTime" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertySchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyAppointment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "propertyId" UUID NOT NULL,
    "scheduleId" UUID,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "date" TIMESTAMP(6) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyAppointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScannedDocument" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "landlordId" UUID NOT NULL,
    "uploadedBy" UUID,
    "originalFileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "ocrText" TEXT,
    "ocrConfidence" DECIMAL(5,2),
    "ocrProcessedAt" TIMESTAMP(6),
    "documentType" TEXT,
    "classificationStatus" TEXT NOT NULL DEFAULT 'pending',
    "classifiedAt" TIMESTAMP(6),
    "extractedData" JSON,
    "conversionStatus" TEXT NOT NULL DEFAULT 'pending',
    "convertedToLeaseId" UUID,
    "convertedToPaymentId" UUID,
    "convertedToTenantId" UUID,
    "notes" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScannedDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentClassificationRule" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "landlordId" UUID,
    "documentType" TEXT NOT NULL,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "patterns" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentClassificationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LandlordSubscription" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "landlordId" UUID NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'free',
    "stripeSubscriptionId" TEXT,
    "stripeCustomerId" TEXT,
    "stripePriceId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "currentPeriodStart" TIMESTAMP(6),
    "currentPeriodEnd" TIMESTAMP(6),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "canceledAt" TIMESTAMP(6),
    "trialEnd" TIMESTAMP(6),
    "unitLimit" INTEGER NOT NULL DEFAULT 24,
    "freeBackgroundChecks" BOOLEAN NOT NULL DEFAULT false,
    "freeEvictionChecks" BOOLEAN NOT NULL DEFAULT false,
    "freeEmploymentVerification" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LandlordSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionEvent" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "landlordId" UUID NOT NULL,
    "eventType" TEXT NOT NULL,
    "fromTier" TEXT,
    "toTier" TEXT,
    "amount" DECIMAL(12,2),
    "stripeEventId" TEXT,
    "metadata" JSON,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmploymentCheck" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "landlordId" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "result" JSON,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmploymentCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "landlordId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "invitedEmail" TEXT,
    "inviteToken" TEXT,
    "inviteExpires" TIMESTAMP(6),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "joinedAt" TIMESTAMP(6),
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamChannel" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "landlordId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'public',
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamChannelMember" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "channelId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "lastReadAt" TIMESTAMP(6),
    "joinedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamChannelMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMessage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "channelId" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "editedAt" TIMESTAMP(6),
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentReminderSettings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "landlordId" UUID NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "reminderDaysBefore" INTEGER[] DEFAULT ARRAY[7, 3, 1]::INTEGER[],
    "reminderChannels" TEXT[] DEFAULT ARRAY['email']::TEXT[],
    "customMessage" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentReminderSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LateFeeSettings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "landlordId" UUID NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "gracePeriodDays" INTEGER NOT NULL DEFAULT 5,
    "feeType" TEXT NOT NULL DEFAULT 'flat',
    "feeAmount" DECIMAL(12,2) NOT NULL,
    "maxFee" DECIMAL(12,2),
    "recurringFee" BOOLEAN NOT NULL DEFAULT false,
    "recurringInterval" TEXT,
    "notifyTenant" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LateFeeSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockedIP" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ipAddress" TEXT NOT NULL,
    "reason" TEXT,
    "blockedBy" UUID,
    "expiresAt" TIMESTAMP(6),
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlockedIP_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CashPayment_referenceId_key" ON "CashPayment"("referenceId");

-- CreateIndex
CREATE INDEX "CashPayment_referenceId_idx" ON "CashPayment"("referenceId");

-- CreateIndex
CREATE INDEX "CashPayment_tenantId_idx" ON "CashPayment"("tenantId");

-- CreateIndex
CREATE INDEX "CashPayment_propertyId_idx" ON "CashPayment"("propertyId");

-- CreateIndex
CREATE INDEX "CashPayment_status_idx" ON "CashPayment"("status");

-- CreateIndex
CREATE INDEX "CashPayment_expiresAt_idx" ON "CashPayment"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "QuickBooksConnection_landlordId_key" ON "QuickBooksConnection"("landlordId");

-- CreateIndex
CREATE INDEX "QuickBooksConnection_landlordId_idx" ON "QuickBooksConnection"("landlordId");

-- CreateIndex
CREATE INDEX "QuickBooksConnection_realmId_idx" ON "QuickBooksConnection"("realmId");

-- CreateIndex
CREATE UNIQUE INDEX "DocuSignConnection_landlordId_key" ON "DocuSignConnection"("landlordId");

-- CreateIndex
CREATE INDEX "DocuSignConnection_landlordId_idx" ON "DocuSignConnection"("landlordId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedPayoutMethod_stripePaymentMethodId_key" ON "SavedPayoutMethod"("stripePaymentMethodId");

-- CreateIndex
CREATE INDEX "SavedPayoutMethod_landlordId_idx" ON "SavedPayoutMethod"("landlordId");

-- CreateIndex
CREATE INDEX "SavedPayoutMethod_stripePaymentMethodId_idx" ON "SavedPayoutMethod"("stripePaymentMethodId");

-- CreateIndex
CREATE INDEX "Payout_landlordId_idx" ON "Payout"("landlordId");

-- CreateIndex
CREATE INDEX "PlatformFee_landlordId_idx" ON "PlatformFee"("landlordId");

-- CreateIndex
CREATE INDEX "PlatformFee_payoutId_idx" ON "PlatformFee"("payoutId");

-- CreateIndex
CREATE INDEX "Expense_landlordId_idx" ON "Expense"("landlordId");

-- CreateIndex
CREATE INDEX "Expense_propertyId_idx" ON "Expense"("propertyId");

-- CreateIndex
CREATE INDEX "Expense_unitId_idx" ON "Expense"("unitId");

-- CreateIndex
CREATE INDEX "Expense_incurredAt_idx" ON "Expense"("incurredAt");

-- CreateIndex
CREATE INDEX "Expense_category_idx" ON "Expense"("category");

-- CreateIndex
CREATE INDEX "MarketBenchmark_landlordId_idx" ON "MarketBenchmark"("landlordId");

-- CreateIndex
CREATE INDEX "MarketBenchmark_propertyId_idx" ON "MarketBenchmark"("propertyId");

-- CreateIndex
CREATE INDEX "MarketBenchmark_effectiveDate_idx" ON "MarketBenchmark"("effectiveDate");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyFinance_propertyId_key" ON "PropertyFinance"("propertyId");

-- CreateIndex
CREATE INDEX "LeaseViolation_landlordId_idx" ON "LeaseViolation"("landlordId");

-- CreateIndex
CREATE INDEX "LeaseViolation_leaseId_idx" ON "LeaseViolation"("leaseId");

-- CreateIndex
CREATE INDEX "LeaseViolation_tenantId_idx" ON "LeaseViolation"("tenantId");

-- CreateIndex
CREATE INDEX "LeaseViolation_unitId_idx" ON "LeaseViolation"("unitId");

-- CreateIndex
CREATE INDEX "LeaseViolation_occurredAt_idx" ON "LeaseViolation"("occurredAt");

-- CreateIndex
CREATE INDEX "LeaseViolation_type_idx" ON "LeaseViolation"("type");

-- CreateIndex
CREATE INDEX "ApplicationDocument_applicationId_idx" ON "ApplicationDocument"("applicationId");

-- CreateIndex
CREATE INDEX "ApplicationDocument_landlordId_idx" ON "ApplicationDocument"("landlordId");

-- CreateIndex
CREATE INDEX "ApplicationDocument_uploadedById_idx" ON "ApplicationDocument"("uploadedById");

-- CreateIndex
CREATE INDEX "ApplicationDocument_category_idx" ON "ApplicationDocument"("category");

-- CreateIndex
CREATE INDEX "ApplicationDocument_docType_idx" ON "ApplicationDocument"("docType");

-- CreateIndex
CREATE INDEX "ApplicationDocument_status_idx" ON "ApplicationDocument"("status");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "LegalDocument_landlordId_idx" ON "LegalDocument"("landlordId");

-- CreateIndex
CREATE INDEX "LegalDocument_type_idx" ON "LegalDocument"("type");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentSignatureRequest_token_key" ON "DocumentSignatureRequest"("token");

-- CreateIndex
CREATE INDEX "DocumentSignatureRequest_documentId_idx" ON "DocumentSignatureRequest"("documentId");

-- CreateIndex
CREATE INDEX "DocumentSignatureRequest_leaseId_idx" ON "DocumentSignatureRequest"("leaseId");

-- CreateIndex
CREATE INDEX "DocumentSignatureRequest_status_idx" ON "DocumentSignatureRequest"("status");

-- CreateIndex
CREATE INDEX "DocumentSignatureRequest_token_idx" ON "DocumentSignatureRequest"("token");

-- CreateIndex
CREATE INDEX "DocumentSignatureRequest_role_idx" ON "DocumentSignatureRequest"("role");

-- CreateIndex
CREATE INDEX "PropertyInspection_propertyId_idx" ON "PropertyInspection"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyInspection_status_idx" ON "PropertyInspection"("status");

-- CreateIndex
CREATE INDEX "InspectionItem_inspectionId_idx" ON "InspectionItem"("inspectionId");

-- CreateIndex
CREATE INDEX "PropertySchedule_propertyId_idx" ON "PropertySchedule"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "PropertySchedule_propertyId_key" ON "PropertySchedule"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyAppointment_propertyId_idx" ON "PropertyAppointment"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyAppointment_date_idx" ON "PropertyAppointment"("date");

-- CreateIndex
CREATE INDEX "PropertyAppointment_status_idx" ON "PropertyAppointment"("status");

-- CreateIndex
CREATE INDEX "ScannedDocument_landlordId_idx" ON "ScannedDocument"("landlordId");

-- CreateIndex
CREATE INDEX "ScannedDocument_documentType_idx" ON "ScannedDocument"("documentType");

-- CreateIndex
CREATE INDEX "ScannedDocument_classificationStatus_idx" ON "ScannedDocument"("classificationStatus");

-- CreateIndex
CREATE INDEX "ScannedDocument_conversionStatus_idx" ON "ScannedDocument"("conversionStatus");

-- CreateIndex
CREATE INDEX "ScannedDocument_createdAt_idx" ON "ScannedDocument"("createdAt");

-- CreateIndex
CREATE INDEX "DocumentClassificationRule_landlordId_idx" ON "DocumentClassificationRule"("landlordId");

-- CreateIndex
CREATE INDEX "DocumentClassificationRule_documentType_idx" ON "DocumentClassificationRule"("documentType");

-- CreateIndex
CREATE UNIQUE INDEX "LandlordSubscription_landlordId_key" ON "LandlordSubscription"("landlordId");

-- CreateIndex
CREATE UNIQUE INDEX "LandlordSubscription_stripeSubscriptionId_key" ON "LandlordSubscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "LandlordSubscription_status_idx" ON "LandlordSubscription"("status");

-- CreateIndex
CREATE INDEX "LandlordSubscription_tier_idx" ON "LandlordSubscription"("tier");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionEvent_stripeEventId_key" ON "SubscriptionEvent"("stripeEventId");

-- CreateIndex
CREATE INDEX "SubscriptionEvent_landlordId_idx" ON "SubscriptionEvent"("landlordId");

-- CreateIndex
CREATE INDEX "SubscriptionEvent_eventType_idx" ON "SubscriptionEvent"("eventType");

-- CreateIndex
CREATE INDEX "SubscriptionEvent_createdAt_idx" ON "SubscriptionEvent"("createdAt");

-- CreateIndex
CREATE INDEX "EmploymentCheck_landlordId_idx" ON "EmploymentCheck"("landlordId");

-- CreateIndex
CREATE INDEX "EmploymentCheck_applicationId_idx" ON "EmploymentCheck"("applicationId");

-- CreateIndex
CREATE INDEX "EmploymentCheck_createdAt_idx" ON "EmploymentCheck"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_inviteToken_key" ON "TeamMember"("inviteToken");

-- CreateIndex
CREATE INDEX "TeamMember_landlordId_idx" ON "TeamMember"("landlordId");

-- CreateIndex
CREATE INDEX "TeamMember_userId_idx" ON "TeamMember"("userId");

-- CreateIndex
CREATE INDEX "TeamMember_inviteToken_idx" ON "TeamMember"("inviteToken");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_landlordId_userId_key" ON "TeamMember"("landlordId", "userId");

-- CreateIndex
CREATE INDEX "TeamChannel_landlordId_idx" ON "TeamChannel"("landlordId");

-- CreateIndex
CREATE INDEX "TeamChannelMember_channelId_idx" ON "TeamChannelMember"("channelId");

-- CreateIndex
CREATE INDEX "TeamChannelMember_userId_idx" ON "TeamChannelMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamChannelMember_channelId_userId_key" ON "TeamChannelMember"("channelId", "userId");

-- CreateIndex
CREATE INDEX "TeamMessage_channelId_idx" ON "TeamMessage"("channelId");

-- CreateIndex
CREATE INDEX "TeamMessage_senderId_idx" ON "TeamMessage"("senderId");

-- CreateIndex
CREATE INDEX "TeamMessage_createdAt_idx" ON "TeamMessage"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RentReminderSettings_landlordId_key" ON "RentReminderSettings"("landlordId");

-- CreateIndex
CREATE INDEX "RentReminderSettings_landlordId_idx" ON "RentReminderSettings"("landlordId");

-- CreateIndex
CREATE UNIQUE INDEX "LateFeeSettings_landlordId_key" ON "LateFeeSettings"("landlordId");

-- CreateIndex
CREATE INDEX "LateFeeSettings_landlordId_idx" ON "LateFeeSettings"("landlordId");

-- CreateIndex
CREATE UNIQUE INDEX "BlockedIP_ipAddress_key" ON "BlockedIP"("ipAddress");

-- CreateIndex
CREATE INDEX "BlockedIP_ipAddress_idx" ON "BlockedIP"("ipAddress");

-- CreateIndex
CREATE INDEX "BlockedIP_expiresAt_idx" ON "BlockedIP"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Landlord_customDomain_key" ON "Landlord"("customDomain");

-- AddForeignKey
ALTER TABLE "CashPayment" ADD CONSTRAINT "CashPayment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashPayment" ADD CONSTRAINT "CashPayment_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuickBooksConnection" ADD CONSTRAINT "QuickBooksConnection_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "Landlord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocuSignConnection" ADD CONSTRAINT "DocuSignConnection_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "Landlord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedPayoutMethod" ADD CONSTRAINT "SavedPayoutMethod_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "Landlord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentPayment" ADD CONSTRAINT "RentPayment_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "Payout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "Landlord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformFee" ADD CONSTRAINT "PlatformFee_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "Payout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformFee" ADD CONSTRAINT "PlatformFee_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "Landlord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "Landlord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketBenchmark" ADD CONSTRAINT "MarketBenchmark_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "Landlord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketBenchmark" ADD CONSTRAINT "MarketBenchmark_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyFinance" ADD CONSTRAINT "PropertyFinance_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaseViolation" ADD CONSTRAINT "LeaseViolation_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "Landlord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaseViolation" ADD CONSTRAINT "LeaseViolation_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaseViolation" ADD CONSTRAINT "LeaseViolation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaseViolation" ADD CONSTRAINT "LeaseViolation_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationDocument" ADD CONSTRAINT "ApplicationDocument_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "RentalApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationDocument" ADD CONSTRAINT "ApplicationDocument_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "Landlord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationDocument" ADD CONSTRAINT "ApplicationDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalDocument" ADD CONSTRAINT "LegalDocument_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "Landlord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentSignatureRequest" ADD CONSTRAINT "DocumentSignatureRequest_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "LegalDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentSignatureRequest" ADD CONSTRAINT "DocumentSignatureRequest_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyInspection" ADD CONSTRAINT "PropertyInspection_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionItem" ADD CONSTRAINT "InspectionItem_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "PropertyInspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertySchedule" ADD CONSTRAINT "PropertySchedule_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyAppointment" ADD CONSTRAINT "PropertyAppointment_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScannedDocument" ADD CONSTRAINT "ScannedDocument_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "Landlord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScannedDocument" ADD CONSTRAINT "ScannedDocument_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentClassificationRule" ADD CONSTRAINT "DocumentClassificationRule_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "Landlord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandlordSubscription" ADD CONSTRAINT "LandlordSubscription_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "Landlord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamChannelMember" ADD CONSTRAINT "TeamChannelMember_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "TeamChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMessage" ADD CONSTRAINT "TeamMessage_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "TeamChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
