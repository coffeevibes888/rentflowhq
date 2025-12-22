-- CreateTable
CREATE TABLE "VerificationDocument" (
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
    "cloudinarySecureUrl" TEXT NOT NULL,
    "ocrText" TEXT,
    "ocrConfidence" DECIMAL(5,2),
    "ocrProcessedAt" TIMESTAMP(6),
    "extractedData" JSON,
    "verificationStatus" TEXT NOT NULL DEFAULT 'pending',
    "verificationMethod" TEXT,
    "verificationCompletedAt" TIMESTAMP(6),
    "fraudScore" DECIMAL(5,2),
    "fraudIndicators" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rejectionReason" TEXT,
    "reviewNotes" TEXT,
    "reviewedBy" UUID,
    "reviewedAt" TIMESTAMP(6),
    "expiresAt" TIMESTAMP(6),
    "dataRetentionExpiresAt" TIMESTAMP(6) NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationVerification" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "applicationId" UUID NOT NULL,
    "identityStatus" TEXT NOT NULL DEFAULT 'pending',
    "identityVerifiedAt" TIMESTAMP(6),
    "identityDocumentId" UUID,
    "employmentStatus" TEXT NOT NULL DEFAULT 'pending',
    "employmentVerifiedAt" TIMESTAMP(6),
    "monthlyIncome" DECIMAL(12,2),
    "incomeVerificationMethod" TEXT,
    "overallStatus" TEXT NOT NULL DEFAULT 'incomplete',
    "completedAt" TIMESTAMP(6),
    "expiresAt" TIMESTAMP(6),
    "stripeIdentitySessionId" TEXT,
    "plaidLinkToken" TEXT,
    "plaidAccessToken" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmploymentVerificationUsage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "landlordId" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "verificationDocumentId" UUID,
    "method" TEXT NOT NULL,
    "cost" DECIMAL(10,2) NOT NULL,
    "wasFree" BOOLEAN NOT NULL DEFAULT false,
    "billingPeriodStart" TIMESTAMP(6) NOT NULL,
    "billingPeriodEnd" TIMESTAMP(6) NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmploymentVerificationUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FraudDetectionLog" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "verificationDocumentId" UUID NOT NULL,
    "checkType" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "score" DECIMAL(5,2),
    "details" JSON,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FraudDetectionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VerificationDocument_applicationId_idx" ON "VerificationDocument"("applicationId");

-- CreateIndex
CREATE INDEX "VerificationDocument_landlordId_idx" ON "VerificationDocument"("landlordId");

-- CreateIndex
CREATE INDEX "VerificationDocument_uploadedById_idx" ON "VerificationDocument"("uploadedById");

-- CreateIndex
CREATE INDEX "VerificationDocument_category_idx" ON "VerificationDocument"("category");

-- CreateIndex
CREATE INDEX "VerificationDocument_docType_idx" ON "VerificationDocument"("docType");

-- CreateIndex
CREATE INDEX "VerificationDocument_verificationStatus_idx" ON "VerificationDocument"("verificationStatus");

-- CreateIndex
CREATE INDEX "VerificationDocument_dataRetentionExpiresAt_idx" ON "VerificationDocument"("dataRetentionExpiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationVerification_applicationId_key" ON "ApplicationVerification"("applicationId");

-- CreateIndex
CREATE INDEX "ApplicationVerification_applicationId_idx" ON "ApplicationVerification"("applicationId");

-- CreateIndex
CREATE INDEX "ApplicationVerification_identityStatus_idx" ON "ApplicationVerification"("identityStatus");

-- CreateIndex
CREATE INDEX "ApplicationVerification_employmentStatus_idx" ON "ApplicationVerification"("employmentStatus");

-- CreateIndex
CREATE INDEX "ApplicationVerification_overallStatus_idx" ON "ApplicationVerification"("overallStatus");

-- CreateIndex
CREATE INDEX "EmploymentVerificationUsage_landlordId_idx" ON "EmploymentVerificationUsage"("landlordId");

-- CreateIndex
CREATE INDEX "EmploymentVerificationUsage_applicationId_idx" ON "EmploymentVerificationUsage"("applicationId");

-- CreateIndex
CREATE INDEX "EmploymentVerificationUsage_billingPeriodStart_billingPerio_idx" ON "EmploymentVerificationUsage"("billingPeriodStart", "billingPeriodEnd");

-- CreateIndex
CREATE INDEX "EmploymentVerificationUsage_createdAt_idx" ON "EmploymentVerificationUsage"("createdAt");

-- CreateIndex
CREATE INDEX "FraudDetectionLog_verificationDocumentId_idx" ON "FraudDetectionLog"("verificationDocumentId");

-- CreateIndex
CREATE INDEX "FraudDetectionLog_checkType_idx" ON "FraudDetectionLog"("checkType");

-- CreateIndex
CREATE INDEX "FraudDetectionLog_result_idx" ON "FraudDetectionLog"("result");

-- AddForeignKey
ALTER TABLE "VerificationDocument" ADD CONSTRAINT "VerificationDocument_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "RentalApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationDocument" ADD CONSTRAINT "VerificationDocument_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "Landlord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationDocument" ADD CONSTRAINT "VerificationDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationDocument" ADD CONSTRAINT "VerificationDocument_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationVerification" ADD CONSTRAINT "ApplicationVerification_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "RentalApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmploymentVerificationUsage" ADD CONSTRAINT "EmploymentVerificationUsage_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "Landlord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FraudDetectionLog" ADD CONSTRAINT "FraudDetectionLog_verificationDocumentId_fkey" FOREIGN KEY ("verificationDocumentId") REFERENCES "VerificationDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
