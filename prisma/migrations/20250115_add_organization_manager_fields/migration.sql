-- Add manager and legal information to Organization
ALTER TABLE "Organization"
ADD COLUMN IF NOT EXISTS "siret" VARCHAR(14),
ADD COLUMN IF NOT EXISTS "manager_gender" VARCHAR(10),
ADD COLUMN IF NOT EXISTS "manager_first_name" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "manager_last_name" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "manager_title" VARCHAR(255);

-- Add comments for documentation
COMMENT ON COLUMN "Organization"."siret" IS 'SIRET number (French business registration number)';
COMMENT ON COLUMN "Organization"."manager_gender" IS 'Manager gender: Mr, Mme, Mx, etc.';
COMMENT ON COLUMN "Organization"."manager_first_name" IS 'Manager first name';
COMMENT ON COLUMN "Organization"."manager_last_name" IS 'Manager last name';
COMMENT ON COLUMN "Organization"."manager_title" IS 'Manager position title (e.g., "gérante", "gérant", "directeur")';
