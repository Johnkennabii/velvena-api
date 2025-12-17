-- Remove soft delete columns from PricingRule (hard delete only)
ALTER TABLE "PricingRule"
DROP COLUMN IF EXISTS "deleted_at",
DROP COLUMN IF EXISTS "deleted_by";

-- Remove organization_id from ContractType (make it global)
ALTER TABLE "ContractType" DROP COLUMN IF EXISTS "organization_id";
DROP INDEX IF EXISTS "ContractType_organization_id_idx";
DROP INDEX IF EXISTS "ContractType_name_organization_id_key";
CREATE UNIQUE INDEX "ContractType_name_key" ON "ContractType"("name");

-- Remove organization_id from Role (make it global)
ALTER TABLE "Role" DROP COLUMN IF EXISTS "organization_id";
DROP INDEX IF EXISTS "Role_organization_id_idx";
DROP INDEX IF EXISTS "Role_name_organization_id_key";
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");
