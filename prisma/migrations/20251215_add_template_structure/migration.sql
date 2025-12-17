-- Migration: Add structure JSON field to ContractTemplate
-- Description: Adds support for JSON-based template structure (unified template system)

-- AlterTable: Make content optional (legacy field)
ALTER TABLE "ContractTemplate" ALTER COLUMN "content" DROP NOT NULL;

-- AlterTable: Add structure field (JSON) for new template system
ALTER TABLE "ContractTemplate" ADD COLUMN "structure" JSONB;

-- AlterTable: Add html_cache field for performance optimization
ALTER TABLE "ContractTemplate" ADD COLUMN "html_cache" TEXT;

-- Comment fields
COMMENT ON COLUMN "ContractTemplate"."content" IS 'Legacy HTML template with Handlebars variables (optional)';
COMMENT ON COLUMN "ContractTemplate"."structure" IS 'JSON structure for unified template system (new)';
COMMENT ON COLUMN "ContractTemplate"."html_cache" IS 'Cached generated HTML for performance';
