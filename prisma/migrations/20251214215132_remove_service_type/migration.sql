-- Migration: Remove ServiceType and link PricingRule to ContractType
-- This simplifies the architecture by removing the redundant ServiceType model

-- Step 1: Add config column to ContractType (if not exists)
ALTER TABLE "ContractType" ADD COLUMN IF NOT EXISTS "config" JSONB;

-- Step 2: Add contract_type_id to PricingRule (if not exists)
ALTER TABLE "PricingRule" ADD COLUMN IF NOT EXISTS "contract_type_id" TEXT;

-- Step 3: Migrate existing data - if you have data in service_type_id, you may need custom logic
-- For now, we'll just set it to NULL since we're removing the concept
-- UPDATE "PricingRule" SET "contract_type_id" = NULL WHERE "service_type_id" IS NOT NULL;

-- Step 4: Remove the foreign key constraint for service_type_id
ALTER TABLE "PricingRule" DROP CONSTRAINT IF EXISTS "PricingRule_service_type_id_fkey";

-- Step 5: Drop the service_type_id column
ALTER TABLE "PricingRule" DROP COLUMN IF EXISTS "service_type_id";

-- Step 6: Create new index for contract_type_id
CREATE INDEX "PricingRule_contract_type_id_idx" ON "PricingRule"("contract_type_id");

-- Step 7: Add foreign key constraint
ALTER TABLE "PricingRule" ADD CONSTRAINT "PricingRule_contract_type_id_fkey"
  FOREIGN KEY ("contract_type_id") REFERENCES "ContractType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 8: Drop the old service_type_id index (if it exists)
DROP INDEX IF EXISTS "PricingRule_service_type_id_idx";

-- Step 9: Drop ServiceType table (this will cascade delete all relations)
DROP TABLE IF EXISTS "ServiceType" CASCADE;

-- Notes:
-- - This migration removes the ServiceType model completely
-- - PricingRule is now directly linked to ContractType
-- - ContractType now has a config JSON field for business rules
-- - If you have existing ServiceType data you want to preserve,
--   you should create a custom migration script to transfer the data first
