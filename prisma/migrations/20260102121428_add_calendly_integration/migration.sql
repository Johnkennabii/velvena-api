-- CreateTable
CREATE TABLE "public"."CalendlyIntegration" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "calendly_user_uri" TEXT NOT NULL,
    "calendly_user_name" TEXT,
    "calendly_email" TEXT,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "token_type" TEXT NOT NULL DEFAULT 'Bearer',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "scope" TEXT,
    "auto_sync_enabled" BOOLEAN NOT NULL DEFAULT true,
    "sync_interval_minutes" INTEGER NOT NULL DEFAULT 30,
    "last_synced_at" TIMESTAMP(3),
    "last_sync_error" TEXT,
    "next_sync_at" TIMESTAMP(3),
    "webhook_subscription_uri" TEXT,
    "webhook_active" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3),
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,

    CONSTRAINT "CalendlyIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CalendlyEvent" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "integration_id" TEXT NOT NULL,
    "calendly_event_uri" TEXT NOT NULL,
    "calendly_event_type" TEXT,
    "event_name" TEXT NOT NULL,
    "event_start_time" TIMESTAMP(3) NOT NULL,
    "event_end_time" TIMESTAMP(3) NOT NULL,
    "event_status" TEXT NOT NULL,
    "location" TEXT,
    "invitee_name" TEXT,
    "invitee_email" TEXT,
    "invitee_phone" TEXT,
    "invitee_timezone" TEXT,
    "invitee_uri" TEXT,
    "invitee_questions" JSONB,
    "prospect_id" TEXT,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "CalendlyEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CalendlyIntegration_calendly_user_uri_key" ON "public"."CalendlyIntegration"("calendly_user_uri");

-- CreateIndex
CREATE INDEX "CalendlyIntegration_organization_id_idx" ON "public"."CalendlyIntegration"("organization_id");

-- CreateIndex
CREATE INDEX "CalendlyIntegration_calendly_user_uri_idx" ON "public"."CalendlyIntegration"("calendly_user_uri");

-- CreateIndex
CREATE INDEX "CalendlyIntegration_is_active_idx" ON "public"."CalendlyIntegration"("is_active");

-- CreateIndex
CREATE INDEX "CalendlyIntegration_last_synced_at_idx" ON "public"."CalendlyIntegration"("last_synced_at");

-- CreateIndex
CREATE INDEX "CalendlyIntegration_next_sync_at_idx" ON "public"."CalendlyIntegration"("next_sync_at");

-- CreateIndex
CREATE UNIQUE INDEX "CalendlyEvent_calendly_event_uri_key" ON "public"."CalendlyEvent"("calendly_event_uri");

-- CreateIndex
CREATE INDEX "CalendlyEvent_organization_id_idx" ON "public"."CalendlyEvent"("organization_id");

-- CreateIndex
CREATE INDEX "CalendlyEvent_integration_id_idx" ON "public"."CalendlyEvent"("integration_id");

-- CreateIndex
CREATE INDEX "CalendlyEvent_prospect_id_idx" ON "public"."CalendlyEvent"("prospect_id");

-- CreateIndex
CREATE INDEX "CalendlyEvent_calendly_event_uri_idx" ON "public"."CalendlyEvent"("calendly_event_uri");

-- CreateIndex
CREATE INDEX "CalendlyEvent_event_start_time_idx" ON "public"."CalendlyEvent"("event_start_time");

-- CreateIndex
CREATE INDEX "CalendlyEvent_event_status_idx" ON "public"."CalendlyEvent"("event_status");

-- CreateIndex
CREATE INDEX "CalendlyEvent_invitee_email_idx" ON "public"."CalendlyEvent"("invitee_email");

-- AddForeignKey
ALTER TABLE "public"."CalendlyIntegration" ADD CONSTRAINT "CalendlyIntegration_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CalendlyEvent" ADD CONSTRAINT "CalendlyEvent_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CalendlyEvent" ADD CONSTRAINT "CalendlyEvent_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "public"."CalendlyIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CalendlyEvent" ADD CONSTRAINT "CalendlyEvent_prospect_id_fkey" FOREIGN KEY ("prospect_id") REFERENCES "public"."Prospect"("id") ON DELETE SET NULL ON UPDATE CASCADE;
