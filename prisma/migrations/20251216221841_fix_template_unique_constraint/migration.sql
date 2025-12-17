-- DropIndex (supprime l'ancienne contrainte trop restrictive)
DROP INDEX "public"."ContractTemplate_contract_type_id_organization_id_is_defaul_key";

-- CreateIndex (index normal pour les requêtes)
CREATE INDEX "ContractTemplate_contract_type_id_organization_id_is_defaul_idx" ON "public"."ContractTemplate"("contract_type_id", "organization_id", "is_default");

-- CreateUniqueIndex partiel (contrainte uniquement pour les templates actifs ET par défaut)
-- Permet un seul template actif + default par (contract_type_id, organization_id)
-- Permet plusieurs templates inactifs ou non-default
CREATE UNIQUE INDEX "ContractTemplate_unique_active_default_per_type_org"
ON "public"."ContractTemplate"("contract_type_id", "organization_id")
WHERE "is_default" = true AND "is_active" = true AND "deleted_at" IS NULL;
