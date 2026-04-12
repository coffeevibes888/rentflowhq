-- Stripe Treasury Tables
-- Financial accounts for landlords and contractors

-- Financial Account table
CREATE TABLE IF NOT EXISTS "FinancialAccount" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "landlordId" UUID,
    "contractorId" UUID,
    "stripeConnectedAccountId" VARCHAR(255) NOT NULL,
    "stripeFinancialAccountId" VARCHAR(255) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "routingNumber" VARCHAR(20),
    "accountNumberLast4" VARCHAR(4),
    "bankName" VARCHAR(100),
    "availableBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "pendingBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "activeFeatures" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinancialAccount_pkey" PRIMARY KEY ("id")
);

-- Financial Account Transaction table
CREATE TABLE IF NOT EXISTS "FinancialAccountTransaction" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "financialAccountId" UUID NOT NULL,
    "stripeTransactionId" VARCHAR(255),
    "type" VARCHAR(50) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'usd',
    "status" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "counterpartyName" VARCHAR(255),
    "counterpartyType" VARCHAR(50),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinancialAccountTransaction_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "FinancialAccount_stripeFinancialAccountId_key" 
ON "FinancialAccount"("stripeFinancialAccountId");

CREATE INDEX IF NOT EXISTS "FinancialAccount_landlordId_idx" 
ON "FinancialAccount"("landlordId");

CREATE INDEX IF NOT EXISTS "FinancialAccount_contractorId_idx" 
ON "FinancialAccount"("contractorId");

CREATE INDEX IF NOT EXISTS "FinancialAccount_stripeConnectedAccountId_idx" 
ON "FinancialAccount"("stripeConnectedAccountId");

CREATE INDEX IF NOT EXISTS "FinancialAccount_status_idx" 
ON "FinancialAccount"("status");

CREATE INDEX IF NOT EXISTS "FinancialAccountTransaction_financialAccountId_idx" 
ON "FinancialAccountTransaction"("financialAccountId");

CREATE INDEX IF NOT EXISTS "FinancialAccountTransaction_type_idx" 
ON "FinancialAccountTransaction"("type");

CREATE INDEX IF NOT EXISTS "FinancialAccountTransaction_status_idx" 
ON "FinancialAccountTransaction"("status");

CREATE INDEX IF NOT EXISTS "FinancialAccountTransaction_createdAt_idx" 
ON "FinancialAccountTransaction"("createdAt");

-- Foreign key for transactions
ALTER TABLE "FinancialAccountTransaction" 
ADD CONSTRAINT "FinancialAccountTransaction_financialAccountId_fkey" 
FOREIGN KEY ("financialAccountId") REFERENCES "FinancialAccount"("id") 
ON DELETE CASCADE ON UPDATE CASCADE;
