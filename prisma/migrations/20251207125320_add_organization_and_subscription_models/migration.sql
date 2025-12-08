/*
  Warnings:

  - A unique constraint covering the columns `[contract_number,organization_id]` on the table `Contract` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,organization_id]` on the table `ContractAddon` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,organization_id]` on the table `ContractPackage` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,organization_id]` on the table `ContractType` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email,organization_id]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[reference,organization_id]` on the table `Dress` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,organization_id]` on the table `DressColor` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[hex_code,organization_id]` on the table `DressColor` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,organization_id]` on the table `DressCondition` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,organization_id]` on the table `DressSize` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,organization_id]` on the table `DressType` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email,organization_id]` on the table `Prospect` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,organization_id]` on the table `Role` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `organization_id` to the `Contract` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organization_id` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organization_id` to the `Dress` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organization_id` to the `Prospect` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organization_id` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."Contract_contract_number_key";

-- DropIndex
DROP INDEX "public"."Customer_email_key";

-- DropIndex
DROP INDEX "public"."Dress_reference_key";

-- DropIndex
DROP INDEX "public"."DressColor_hex_code_key";

-- DropIndex
DROP INDEX "public"."DressColor_name_key";

-- DropIndex
DROP INDEX "public"."DressCondition_name_key";

-- DropIndex
DROP INDEX "public"."DressSize_name_key";

-- DropIndex
DROP INDEX "public"."DressType_name_key";

-- DropIndex
DROP INDEX "public"."Prospect_email_key";

-- DropIndex
DROP INDEX "public"."Role_name_key";

-- AlterTable
ALTER TABLE "public"."Contract" ADD COLUMN     "organization_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."ContractAddon" ADD COLUMN     "organization_id" TEXT;

-- AlterTable
ALTER TABLE "public"."ContractPackage" ADD COLUMN     "organization_id" TEXT;

-- AlterTable
ALTER TABLE "public"."ContractType" ADD COLUMN     "organization_id" TEXT;

-- AlterTable
ALTER TABLE "public"."Customer" ADD COLUMN     "organization_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Dress" ADD COLUMN     "organization_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."DressColor" ADD COLUMN     "organization_id" TEXT;

-- AlterTable
ALTER TABLE "public"."DressCondition" ADD COLUMN     "organization_id" TEXT;

-- AlterTable
ALTER TABLE "public"."DressSize" ADD COLUMN     "organization_id" TEXT;

-- AlterTable
ALTER TABLE "public"."DressType" ADD COLUMN     "organization_id" TEXT;

-- AlterTable
ALTER TABLE "public"."Prospect" ADD COLUMN     "organization_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Role" ADD COLUMN     "organization_id" TEXT;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "organization_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "public"."Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "postal_code" TEXT,
    "country" TEXT,
    "logo_url" TEXT,
    "settings" JSONB,
    "business_rules" JSONB,
    "subscription_plan_id" TEXT,
    "subscription_status" TEXT NOT NULL DEFAULT 'trial',
    "subscription_started_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "trial_ends_at" TIMESTAMP(3),
    "subscription_ends_at" TIMESTAMP(3),
    "subscription_plan" TEXT DEFAULT 'free',
    "current_usage" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3),
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ServiceType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "organization_id" TEXT,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3),
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,

    CONSTRAINT "ServiceType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PricingRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organization_id" TEXT,
    "service_type_id" TEXT,
    "strategy" TEXT NOT NULL,
    "calculation_config" JSONB,
    "applies_to" JSONB,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3),
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,

    CONSTRAINT "PricingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "price_monthly" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "price_yearly" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "trial_days" INTEGER NOT NULL DEFAULT 14,
    "limits" JSONB NOT NULL,
    "features" JSONB NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "is_popular" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UsageEvent" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT,
    "metadata" JSONB,
    "event_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "event_month" TEXT NOT NULL,
    "event_day" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "public"."Organization"("slug");

-- CreateIndex
CREATE INDEX "Organization_slug_idx" ON "public"."Organization"("slug");

-- CreateIndex
CREATE INDEX "Organization_is_active_idx" ON "public"."Organization"("is_active");

-- CreateIndex
CREATE INDEX "Organization_subscription_plan_id_idx" ON "public"."Organization"("subscription_plan_id");

-- CreateIndex
CREATE INDEX "Organization_subscription_status_idx" ON "public"."Organization"("subscription_status");

-- CreateIndex
CREATE INDEX "ServiceType_organization_id_idx" ON "public"."ServiceType"("organization_id");

-- CreateIndex
CREATE INDEX "ServiceType_is_active_idx" ON "public"."ServiceType"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceType_code_organization_id_key" ON "public"."ServiceType"("code", "organization_id");

-- CreateIndex
CREATE INDEX "PricingRule_organization_id_idx" ON "public"."PricingRule"("organization_id");

-- CreateIndex
CREATE INDEX "PricingRule_service_type_id_idx" ON "public"."PricingRule"("service_type_id");

-- CreateIndex
CREATE INDEX "PricingRule_strategy_idx" ON "public"."PricingRule"("strategy");

-- CreateIndex
CREATE INDEX "PricingRule_is_active_idx" ON "public"."PricingRule"("is_active");

-- CreateIndex
CREATE INDEX "PricingRule_priority_idx" ON "public"."PricingRule"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "PricingRule_name_organization_id_key" ON "public"."PricingRule"("name", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_name_key" ON "public"."SubscriptionPlan"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_code_key" ON "public"."SubscriptionPlan"("code");

-- CreateIndex
CREATE INDEX "SubscriptionPlan_code_idx" ON "public"."SubscriptionPlan"("code");

-- CreateIndex
CREATE INDEX "SubscriptionPlan_is_public_idx" ON "public"."SubscriptionPlan"("is_public");

-- CreateIndex
CREATE INDEX "UsageEvent_organization_id_idx" ON "public"."UsageEvent"("organization_id");

-- CreateIndex
CREATE INDEX "UsageEvent_event_type_idx" ON "public"."UsageEvent"("event_type");

-- CreateIndex
CREATE INDEX "UsageEvent_resource_type_idx" ON "public"."UsageEvent"("resource_type");

-- CreateIndex
CREATE INDEX "UsageEvent_event_month_idx" ON "public"."UsageEvent"("event_month");

-- CreateIndex
CREATE INDEX "UsageEvent_event_day_idx" ON "public"."UsageEvent"("event_day");

-- CreateIndex
CREATE INDEX "UsageEvent_created_at_idx" ON "public"."UsageEvent"("created_at");

-- CreateIndex
CREATE INDEX "Contract_organization_id_idx" ON "public"."Contract"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_contract_number_organization_id_key" ON "public"."Contract"("contract_number", "organization_id");

-- CreateIndex
CREATE INDEX "ContractAddon_organization_id_idx" ON "public"."ContractAddon"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "ContractAddon_name_organization_id_key" ON "public"."ContractAddon"("name", "organization_id");

-- CreateIndex
CREATE INDEX "ContractPackage_organization_id_idx" ON "public"."ContractPackage"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "ContractPackage_name_organization_id_key" ON "public"."ContractPackage"("name", "organization_id");

-- CreateIndex
CREATE INDEX "ContractType_organization_id_idx" ON "public"."ContractType"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "ContractType_name_organization_id_key" ON "public"."ContractType"("name", "organization_id");

-- CreateIndex
CREATE INDEX "Customer_organization_id_idx" ON "public"."Customer"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_organization_id_key" ON "public"."Customer"("email", "organization_id");

-- CreateIndex
CREATE INDEX "Dress_organization_id_idx" ON "public"."Dress"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "Dress_reference_organization_id_key" ON "public"."Dress"("reference", "organization_id");

-- CreateIndex
CREATE INDEX "DressColor_organization_id_idx" ON "public"."DressColor"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "DressColor_name_organization_id_key" ON "public"."DressColor"("name", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "DressColor_hex_code_organization_id_key" ON "public"."DressColor"("hex_code", "organization_id");

-- CreateIndex
CREATE INDEX "DressCondition_organization_id_idx" ON "public"."DressCondition"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "DressCondition_name_organization_id_key" ON "public"."DressCondition"("name", "organization_id");

-- CreateIndex
CREATE INDEX "DressSize_organization_id_idx" ON "public"."DressSize"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "DressSize_name_organization_id_key" ON "public"."DressSize"("name", "organization_id");

-- CreateIndex
CREATE INDEX "DressType_organization_id_idx" ON "public"."DressType"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "DressType_name_organization_id_key" ON "public"."DressType"("name", "organization_id");

-- CreateIndex
CREATE INDEX "Prospect_organization_id_idx" ON "public"."Prospect"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "Prospect_email_organization_id_key" ON "public"."Prospect"("email", "organization_id");

-- CreateIndex
CREATE INDEX "Role_organization_id_idx" ON "public"."Role"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_organization_id_key" ON "public"."Role"("name", "organization_id");

-- CreateIndex
CREATE INDEX "User_organization_id_idx" ON "public"."User"("organization_id");

-- AddForeignKey
ALTER TABLE "public"."Organization" ADD CONSTRAINT "Organization_subscription_plan_id_fkey" FOREIGN KEY ("subscription_plan_id") REFERENCES "public"."SubscriptionPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Role" ADD CONSTRAINT "Role_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DressType" ADD CONSTRAINT "DressType_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DressSize" ADD CONSTRAINT "DressSize_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DressCondition" ADD CONSTRAINT "DressCondition_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DressColor" ADD CONSTRAINT "DressColor_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Dress" ADD CONSTRAINT "Dress_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Customer" ADD CONSTRAINT "Customer_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Prospect" ADD CONSTRAINT "Prospect_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContractType" ADD CONSTRAINT "ContractType_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContractPackage" ADD CONSTRAINT "ContractPackage_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContractAddon" ADD CONSTRAINT "ContractAddon_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Contract" ADD CONSTRAINT "Contract_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ServiceType" ADD CONSTRAINT "ServiceType_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PricingRule" ADD CONSTRAINT "PricingRule_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PricingRule" ADD CONSTRAINT "PricingRule_service_type_id_fkey" FOREIGN KEY ("service_type_id") REFERENCES "public"."ServiceType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UsageEvent" ADD CONSTRAINT "UsageEvent_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
