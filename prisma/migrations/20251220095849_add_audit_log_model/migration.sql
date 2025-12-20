-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "resource_type" TEXT,
    "resource_id" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "method" TEXT,
    "endpoint" TEXT,
    "status" TEXT NOT NULL,
    "error_message" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retention_until" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_organization_id_idx" ON "public"."AuditLog"("organization_id");

-- CreateIndex
CREATE INDEX "AuditLog_user_id_idx" ON "public"."AuditLog"("user_id");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "public"."AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_resource_type_idx" ON "public"."AuditLog"("resource_type");

-- CreateIndex
CREATE INDEX "AuditLog_status_idx" ON "public"."AuditLog"("status");

-- CreateIndex
CREATE INDEX "AuditLog_created_at_idx" ON "public"."AuditLog"("created_at");

-- CreateIndex
CREATE INDEX "AuditLog_retention_until_idx" ON "public"."AuditLog"("retention_until");

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
