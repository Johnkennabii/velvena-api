-- CreateTable: ContractTemplate
CREATE TABLE "ContractTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "contract_type_id" TEXT NOT NULL,
    "organization_id" TEXT,
    "content" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3),
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,

    CONSTRAINT "ContractTemplate_pkey" PRIMARY KEY ("id")
);

-- Add template_id to Contract table
ALTER TABLE "Contract" ADD COLUMN "template_id" TEXT;

-- CreateIndex
CREATE INDEX "ContractTemplate_organization_id_idx" ON "ContractTemplate"("organization_id");

-- CreateIndex
CREATE INDEX "ContractTemplate_contract_type_id_idx" ON "ContractTemplate"("contract_type_id");

-- CreateIndex
CREATE INDEX "ContractTemplate_is_active_idx" ON "ContractTemplate"("is_active");

-- CreateIndex: Ensure only one default template per contract_type/organization combination
CREATE UNIQUE INDEX "ContractTemplate_contract_type_id_organization_id_is_default_key" ON "ContractTemplate"("contract_type_id", "organization_id", "is_default");

-- AddForeignKey
ALTER TABLE "ContractTemplate" ADD CONSTRAINT "ContractTemplate_contract_type_id_fkey" FOREIGN KEY ("contract_type_id") REFERENCES "ContractType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractTemplate" ADD CONSTRAINT "ContractTemplate_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "ContractTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
