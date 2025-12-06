-- Migration SQL pour ajouter le multi-tenant
-- NOTE: Ce fichier est un GUIDE. Les migrations Prisma seront générées automatiquement avec `prisma migrate dev`
-- Utilisez ce fichier comme référence pour comprendre les changements

-- 1. Créer la table Organization
CREATE TABLE IF NOT EXISTS "Organization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL UNIQUE,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "postal_code" TEXT,
    "country" TEXT,
    "logo_url" TEXT,
    "settings" JSONB,
    "subscription_plan" TEXT DEFAULT 'free',
    "trial_ends_at" TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP,
    "deleted_by" TEXT
);

CREATE INDEX "Organization_slug_idx" ON "Organization"("slug");
CREATE INDEX "Organization_is_active_idx" ON "Organization"("is_active");

-- 2. Créer une organisation par défaut pour la migration
INSERT INTO "Organization" ("id", "name", "slug", "created_at", "is_active")
VALUES (gen_random_uuid(), 'Default Organization', 'default', CURRENT_TIMESTAMP, true)
ON CONFLICT DO NOTHING;

-- 3. Ajouter organization_id à User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "organization_id" TEXT;

-- Assigner tous les utilisateurs existants à l'organisation par défaut
UPDATE "User"
SET "organization_id" = (SELECT "id" FROM "Organization" WHERE "slug" = 'default')
WHERE "organization_id" IS NULL;

-- Rendre organization_id NOT NULL après assignation
ALTER TABLE "User" ALTER COLUMN "organization_id" SET NOT NULL;

CREATE INDEX "User_organization_id_idx" ON "User"("organization_id");
ALTER TABLE "User" ADD CONSTRAINT "User_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 4. Modifier Role pour support multi-tenant (nullable organization_id)
ALTER TABLE "Role" ADD COLUMN IF NOT EXISTS "organization_id" TEXT;

-- Supprimer l'ancienne contrainte unique sur name
ALTER TABLE "Role" DROP CONSTRAINT IF EXISTS "Role_name_key";

-- Ajouter nouvelle contrainte unique composite
ALTER TABLE "Role" ADD CONSTRAINT "Role_name_organization_id_key"
    UNIQUE ("name", "organization_id");

CREATE INDEX "Role_organization_id_idx" ON "Role"("organization_id");
ALTER TABLE "Role" ADD CONSTRAINT "Role_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 5. Modifier DressType (nullable organization_id)
ALTER TABLE "DressType" ADD COLUMN IF NOT EXISTS "organization_id" TEXT;
ALTER TABLE "DressType" DROP CONSTRAINT IF EXISTS "DressType_name_key";
ALTER TABLE "DressType" ADD CONSTRAINT "DressType_name_organization_id_key"
    UNIQUE ("name", "organization_id");
CREATE INDEX "DressType_organization_id_idx" ON "DressType"("organization_id");
ALTER TABLE "DressType" ADD CONSTRAINT "DressType_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 6. Modifier DressSize (nullable organization_id)
ALTER TABLE "DressSize" ADD COLUMN IF NOT EXISTS "organization_id" TEXT;
ALTER TABLE "DressSize" DROP CONSTRAINT IF EXISTS "DressSize_name_key";
ALTER TABLE "DressSize" ADD CONSTRAINT "DressSize_name_organization_id_key"
    UNIQUE ("name", "organization_id");
CREATE INDEX "DressSize_organization_id_idx" ON "DressSize"("organization_id");
ALTER TABLE "DressSize" ADD CONSTRAINT "DressSize_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 7. Modifier DressCondition (nullable organization_id)
ALTER TABLE "DressCondition" ADD COLUMN IF NOT EXISTS "organization_id" TEXT;
ALTER TABLE "DressCondition" DROP CONSTRAINT IF EXISTS "DressCondition_name_key";
ALTER TABLE "DressCondition" ADD CONSTRAINT "DressCondition_name_organization_id_key"
    UNIQUE ("name", "organization_id");
CREATE INDEX "DressCondition_organization_id_idx" ON "DressCondition"("organization_id");
ALTER TABLE "DressCondition" ADD CONSTRAINT "DressCondition_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 8. Modifier DressColor (nullable organization_id)
ALTER TABLE "DressColor" ADD COLUMN IF NOT EXISTS "organization_id" TEXT;
ALTER TABLE "DressColor" DROP CONSTRAINT IF EXISTS "DressColor_name_key";
ALTER TABLE "DressColor" DROP CONSTRAINT IF EXISTS "DressColor_hex_code_key";
ALTER TABLE "DressColor" ADD CONSTRAINT "DressColor_name_organization_id_key"
    UNIQUE ("name", "organization_id");
ALTER TABLE "DressColor" ADD CONSTRAINT "DressColor_hex_code_organization_id_key"
    UNIQUE ("hex_code", "organization_id");
CREATE INDEX "DressColor_organization_id_idx" ON "DressColor"("organization_id");
ALTER TABLE "DressColor" ADD CONSTRAINT "DressColor_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 9. Modifier Dress (organization_id requis)
ALTER TABLE "Dress" ADD COLUMN IF NOT EXISTS "organization_id" TEXT;

UPDATE "Dress"
SET "organization_id" = (SELECT "id" FROM "Organization" WHERE "slug" = 'default')
WHERE "organization_id" IS NULL;

ALTER TABLE "Dress" ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "Dress" DROP CONSTRAINT IF EXISTS "Dress_reference_key";
ALTER TABLE "Dress" ADD CONSTRAINT "Dress_reference_organization_id_key"
    UNIQUE ("reference", "organization_id");
CREATE INDEX "Dress_organization_id_idx" ON "Dress"("organization_id");
ALTER TABLE "Dress" ADD CONSTRAINT "Dress_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 10. Modifier Customer (organization_id requis)
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "organization_id" TEXT;

UPDATE "Customer"
SET "organization_id" = (SELECT "id" FROM "Organization" WHERE "slug" = 'default')
WHERE "organization_id" IS NULL;

ALTER TABLE "Customer" ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "Customer" DROP CONSTRAINT IF EXISTS "Customer_email_key";
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_email_organization_id_key"
    UNIQUE ("email", "organization_id");
CREATE INDEX "Customer_organization_id_idx" ON "Customer"("organization_id");
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 11. Modifier Prospect (organization_id requis)
ALTER TABLE "Prospect" ADD COLUMN IF NOT EXISTS "organization_id" TEXT;

UPDATE "Prospect"
SET "organization_id" = (SELECT "id" FROM "Organization" WHERE "slug" = 'default')
WHERE "organization_id" IS NULL;

ALTER TABLE "Prospect" ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "Prospect" DROP CONSTRAINT IF EXISTS "Prospect_email_key";
ALTER TABLE "Prospect" ADD CONSTRAINT "Prospect_email_organization_id_key"
    UNIQUE ("email", "organization_id");
CREATE INDEX "Prospect_organization_id_idx" ON "Prospect"("organization_id");
ALTER TABLE "Prospect" ADD CONSTRAINT "Prospect_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 12. Modifier ContractType (nullable organization_id)
ALTER TABLE "ContractType" ADD COLUMN IF NOT EXISTS "organization_id" TEXT;
CREATE INDEX "ContractType_organization_id_idx" ON "ContractType"("organization_id");
ALTER TABLE "ContractType" ADD CONSTRAINT "ContractType_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 13. Modifier ContractPackage (nullable organization_id)
ALTER TABLE "ContractPackage" ADD COLUMN IF NOT EXISTS "organization_id" TEXT;
CREATE INDEX "ContractPackage_organization_id_idx" ON "ContractPackage"("organization_id");
ALTER TABLE "ContractPackage" ADD CONSTRAINT "ContractPackage_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 14. Modifier ContractAddon (nullable organization_id)
ALTER TABLE "ContractAddon" ADD COLUMN IF NOT EXISTS "organization_id" TEXT;
CREATE INDEX "ContractAddon_organization_id_idx" ON "ContractAddon"("organization_id");
ALTER TABLE "ContractAddon" ADD CONSTRAINT "ContractAddon_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 15. Modifier Contract (organization_id requis)
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "organization_id" TEXT;

UPDATE "Contract"
SET "organization_id" = (SELECT "id" FROM "Organization" WHERE "slug" = 'default')
WHERE "organization_id" IS NULL;

ALTER TABLE "Contract" ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "Contract" DROP CONSTRAINT IF EXISTS "Contract_contract_number_key";
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_contract_number_organization_id_key"
    UNIQUE ("contract_number", "organization_id");
CREATE INDEX "Contract_organization_id_idx" ON "Contract"("organization_id");
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 16. IMPORTANT: Vérifications post-migration
-- Vérifier que toutes les données ont bien été assignées
SELECT 'Users sans organization' as check_name, COUNT(*) FROM "User" WHERE "organization_id" IS NULL;
SELECT 'Dresses sans organization' as check_name, COUNT(*) FROM "Dress" WHERE "organization_id" IS NULL;
SELECT 'Customers sans organization' as check_name, COUNT(*) FROM "Customer" WHERE "organization_id" IS NULL;
SELECT 'Prospects sans organization' as check_name, COUNT(*) FROM "Prospect" WHERE "organization_id" IS NULL;
SELECT 'Contracts sans organization' as check_name, COUNT(*) FROM "Contract" WHERE "organization_id" IS NULL;

-- Tous ces compteurs devraient être à 0
