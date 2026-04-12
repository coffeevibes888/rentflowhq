-- Add vendorId column to ContractorInventoryItem
ALTER TABLE "ContractorInventoryItem" 
ADD COLUMN IF NOT EXISTS "vendorId" UUID;

-- Add unitCost column (alias for costPerUnit)
ALTER TABLE "ContractorInventoryItem" 
ADD COLUMN IF NOT EXISTS "unitCost" DECIMAL(10,2) DEFAULT 0;

-- Add reorderPoint column (alias for reorderLevel)
ALTER TABLE "ContractorInventoryItem" 
ADD COLUMN IF NOT EXISTS "reorderPoint" INTEGER;

-- Make category nullable
ALTER TABLE "ContractorInventoryItem" 
ALTER COLUMN "category" DROP NOT NULL;

-- Add default value for unit
ALTER TABLE "ContractorInventoryItem" 
ALTER COLUMN "unit" SET DEFAULT 'each';

-- Copy existing data
UPDATE "ContractorInventoryItem" 
SET "unitCost" = "costPerUnit" 
WHERE "unitCost" = 0;

UPDATE "ContractorInventoryItem" 
SET "reorderPoint" = "reorderLevel" 
WHERE "reorderPoint" IS NULL AND "reorderLevel" IS NOT NULL;

-- Add foreign key constraint
ALTER TABLE "ContractorInventoryItem"
ADD CONSTRAINT "ContractorInventoryItem_vendorId_fkey" 
FOREIGN KEY ("vendorId") 
REFERENCES "ContractorVendor"("id") 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- Create index on vendorId
CREATE INDEX IF NOT EXISTS "ContractorInventoryItem_vendorId_idx" 
ON "ContractorInventoryItem"("vendorId");
