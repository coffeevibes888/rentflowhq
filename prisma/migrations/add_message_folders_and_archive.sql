-- Add message folder support and archive functionality

-- Create MessageFolder table
CREATE TABLE "MessageFolder" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "color" TEXT DEFAULT '#3B82F6',
  "icon" TEXT DEFAULT 'folder',
  "order" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MessageFolder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Add indexes to MessageFolder
CREATE INDEX "MessageFolder_userId_idx" ON "MessageFolder"("userId");

-- Add new columns to Thread table
ALTER TABLE "Thread" ADD COLUMN "folderId" UUID;
ALTER TABLE "Thread" ADD COLUMN "isArchived" BOOLEAN DEFAULT false;

-- Add foreign key constraint for folderId
ALTER TABLE "Thread" ADD CONSTRAINT "Thread_folderId_fkey" 
  FOREIGN KEY ("folderId") REFERENCES "MessageFolder"("id") ON DELETE SET NULL;

-- Add indexes to Thread
CREATE INDEX "Thread_folderId_idx" ON "Thread"("folderId");
CREATE INDEX "Thread_isArchived_idx" ON "Thread"("isArchived");

-- Add isDeleted column to ThreadParticipant
ALTER TABLE "ThreadParticipant" ADD COLUMN "isDeleted" BOOLEAN DEFAULT false;

-- Add index to ThreadParticipant
CREATE INDEX "ThreadParticipant_isDeleted_idx" ON "ThreadParticipant"("isDeleted");
