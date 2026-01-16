-- Add advanced analytics tables for detailed user behavior tracking

-- Page views with detailed session tracking
CREATE TABLE IF NOT EXISTS "PageView" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "sessionId" TEXT NOT NULL,
  "userId" UUID,
  "path" TEXT NOT NULL,
  "referrer" TEXT,
  "utmSource" TEXT,
  "utmMedium" TEXT,
  "utmCampaign" TEXT,
  "utmTerm" TEXT,
  "utmContent" TEXT,
  "country" TEXT,
  "region" TEXT,
  "city" TEXT,
  "device" TEXT,
  "browser" TEXT,
  "os" TEXT,
  "screenWidth" INTEGER,
  "screenHeight" INTEGER,
  "timeOnPage" INTEGER, -- milliseconds
  "scrollDepth" INTEGER, -- percentage 0-100
  "exitPage" BOOLEAN DEFAULT false,
  "bounced" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP
);

-- Click events for heatmap generation
CREATE TABLE IF NOT EXISTS "ClickEvent" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "sessionId" TEXT NOT NULL,
  "userId" UUID,
  "path" TEXT NOT NULL,
  "elementId" TEXT,
  "elementClass" TEXT,
  "elementTag" TEXT,
  "elementText" TEXT,
  "xPosition" INTEGER,
  "yPosition" INTEGER,
  "timestamp" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP
);

-- User sessions for tracking complete journeys
CREATE TABLE IF NOT EXISTS "UserSession" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "sessionId" TEXT UNIQUE NOT NULL,
  "userId" UUID,
  "startTime" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  "endTime" TIMESTAMP(6),
  "duration" INTEGER, -- milliseconds
  "pageCount" INTEGER DEFAULT 0,
  "clickCount" INTEGER DEFAULT 0,
  "converted" BOOLEAN DEFAULT false,
  "conversionType" TEXT, -- signup, application, payment, etc
  "conversionValue" DECIMAL(12,2),
  "landingPage" TEXT,
  "exitPage" TEXT,
  "referrer" TEXT,
  "utmSource" TEXT,
  "utmMedium" TEXT,
  "utmCampaign" TEXT,
  "device" TEXT,
  "browser" TEXT,
  "os" TEXT,
  "country" TEXT,
  "region" TEXT,
  "city" TEXT
);

-- Form interactions for conversion optimization
CREATE TABLE IF NOT EXISTS "FormInteraction" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "sessionId" TEXT NOT NULL,
  "userId" UUID,
  "formId" TEXT NOT NULL,
  "formName" TEXT,
  "fieldName" TEXT,
  "action" TEXT, -- focus, blur, change, submit, abandon
  "timeSpent" INTEGER, -- milliseconds on field
  "completed" BOOLEAN DEFAULT false,
  "timestamp" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP
);

-- Conversion funnel tracking
CREATE TABLE IF NOT EXISTS "ConversionFunnel" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "sessionId" TEXT NOT NULL,
  "userId" UUID,
  "step" TEXT NOT NULL, -- visit, view_listing, start_application, submit_application, payment
  "stepOrder" INTEGER NOT NULL,
  "completed" BOOLEAN DEFAULT false,
  "timeToComplete" INTEGER, -- milliseconds from previous step
  "metadata" JSONB,
  "timestamp" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "PageView_sessionId_idx" ON "PageView"("sessionId");
CREATE INDEX IF NOT EXISTS "PageView_userId_idx" ON "PageView"("userId");
CREATE INDEX IF NOT EXISTS "PageView_path_idx" ON "PageView"("path");
CREATE INDEX IF NOT EXISTS "PageView_createdAt_idx" ON "PageView"("createdAt");
CREATE INDEX IF NOT EXISTS "PageView_exitPage_idx" ON "PageView"("exitPage");

CREATE INDEX IF NOT EXISTS "ClickEvent_sessionId_idx" ON "ClickEvent"("sessionId");
CREATE INDEX IF NOT EXISTS "ClickEvent_path_idx" ON "ClickEvent"("path");
CREATE INDEX IF NOT EXISTS "ClickEvent_timestamp_idx" ON "ClickEvent"("timestamp");

CREATE INDEX IF NOT EXISTS "UserSession_sessionId_idx" ON "UserSession"("sessionId");
CREATE INDEX IF NOT EXISTS "UserSession_userId_idx" ON "UserSession"("userId");
CREATE INDEX IF NOT EXISTS "UserSession_startTime_idx" ON "UserSession"("startTime");
CREATE INDEX IF NOT EXISTS "UserSession_converted_idx" ON "UserSession"("converted");

CREATE INDEX IF NOT EXISTS "FormInteraction_sessionId_idx" ON "FormInteraction"("sessionId");
CREATE INDEX IF NOT EXISTS "FormInteraction_formId_idx" ON "FormInteraction"("formId");
CREATE INDEX IF NOT EXISTS "FormInteraction_completed_idx" ON "FormInteraction"("completed");

CREATE INDEX IF NOT EXISTS "ConversionFunnel_sessionId_idx" ON "ConversionFunnel"("sessionId");
CREATE INDEX IF NOT EXISTS "ConversionFunnel_step_idx" ON "ConversionFunnel"("step");
CREATE INDEX IF NOT EXISTS "ConversionFunnel_completed_idx" ON "ConversionFunnel"("completed");
