-- Enterprise API & Webhooks System
-- Migration to add API keys and webhook configuration tables

-- API Keys table for external integrations
CREATE TABLE "ApiKey" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "landlordId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "keyHash" VARCHAR(255) NOT NULL,
    "keyPrefix" VARCHAR(12) NOT NULL,
    "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rateLimit" INTEGER NOT NULL DEFAULT 1000,
    "rateLimitWindow" INTEGER NOT NULL DEFAULT 3600,
    "lastUsedAt" TIMESTAMP(6),
    "expiresAt" TIMESTAMP(6),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- Webhook Endpoints table
CREATE TABLE "WebhookEndpoint" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "landlordId" UUID NOT NULL,
    "url" VARCHAR(2048) NOT NULL,
    "description" VARCHAR(500),
    "secret" VARCHAR(255) NOT NULL,
    "events" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" VARCHAR(10) NOT NULL DEFAULT 'v1',
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "lastSuccessAt" TIMESTAMP(6),
    "lastFailureAt" TIMESTAMP(6),
    "lastFailureReason" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEndpoint_pkey" PRIMARY KEY ("id")
);

-- Webhook Delivery Log table
CREATE TABLE "WebhookDelivery" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "webhookEndpointId" UUID NOT NULL,
    "eventType" VARCHAR(100) NOT NULL,
    "payload" JSONB NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "httpStatus" INTEGER,
    "responseBody" TEXT,
    "responseTimeMs" INTEGER,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "nextRetryAt" TIMESTAMP(6),
    "deliveredAt" TIMESTAMP(6),
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
);

-- API Request Log for analytics and debugging
CREATE TABLE "ApiRequestLog" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "apiKeyId" UUID,
    "landlordId" UUID NOT NULL,
    "method" VARCHAR(10) NOT NULL,
    "path" VARCHAR(500) NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "responseTimeMs" INTEGER,
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiRequestLog_pkey" PRIMARY KEY ("id")
);

-- Indexes for ApiKey
CREATE INDEX "ApiKey_landlordId_idx" ON "ApiKey"("landlordId");
CREATE INDEX "ApiKey_keyPrefix_idx" ON "ApiKey"("keyPrefix");
CREATE INDEX "ApiKey_isActive_idx" ON "ApiKey"("isActive");
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");

-- Indexes for WebhookEndpoint
CREATE INDEX "WebhookEndpoint_landlordId_idx" ON "WebhookEndpoint"("landlordId");
CREATE INDEX "WebhookEndpoint_isActive_idx" ON "WebhookEndpoint"("isActive");

-- Indexes for WebhookDelivery
CREATE INDEX "WebhookDelivery_webhookEndpointId_idx" ON "WebhookDelivery"("webhookEndpointId");
CREATE INDEX "WebhookDelivery_status_idx" ON "WebhookDelivery"("status");
CREATE INDEX "WebhookDelivery_eventType_idx" ON "WebhookDelivery"("eventType");
CREATE INDEX "WebhookDelivery_createdAt_idx" ON "WebhookDelivery"("createdAt");
CREATE INDEX "WebhookDelivery_nextRetryAt_idx" ON "WebhookDelivery"("nextRetryAt");

-- Indexes for ApiRequestLog
CREATE INDEX "ApiRequestLog_apiKeyId_idx" ON "ApiRequestLog"("apiKeyId");
CREATE INDEX "ApiRequestLog_landlordId_idx" ON "ApiRequestLog"("landlordId");
CREATE INDEX "ApiRequestLog_createdAt_idx" ON "ApiRequestLog"("createdAt");
CREATE INDEX "ApiRequestLog_path_idx" ON "ApiRequestLog"("path");

-- Foreign Keys
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "Landlord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WebhookEndpoint" ADD CONSTRAINT "WebhookEndpoint_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "Landlord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WebhookDelivery" ADD CONSTRAINT "WebhookDelivery_webhookEndpointId_fkey" FOREIGN KEY ("webhookEndpointId") REFERENCES "WebhookEndpoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApiRequestLog" ADD CONSTRAINT "ApiRequestLog_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "ApiKey"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ApiRequestLog" ADD CONSTRAINT "ApiRequestLog_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "Landlord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
