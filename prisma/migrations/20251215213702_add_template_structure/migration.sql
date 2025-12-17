-- AlterTable
ALTER TABLE "public"."Organization" ALTER COLUMN "siret" SET DATA TYPE TEXT,
ALTER COLUMN "manager_gender" SET DATA TYPE TEXT,
ALTER COLUMN "manager_first_name" SET DATA TYPE TEXT,
ALTER COLUMN "manager_last_name" SET DATA TYPE TEXT,
ALTER COLUMN "manager_title" SET DATA TYPE TEXT;

-- RenameIndex
ALTER INDEX "public"."ContractTemplate_contract_type_id_organization_id_is_default_ke" RENAME TO "ContractTemplate_contract_type_id_organization_id_is_defaul_key";
