-- AlterTable: Add Stripe fields to Organization
ALTER TABLE "Organization" ADD COLUMN "stripe_customer_id" TEXT;
ALTER TABLE "Organization" ADD COLUMN "stripe_subscription_id" TEXT;

-- AlterTable: Add Stripe fields to SubscriptionPlan
ALTER TABLE "SubscriptionPlan" ADD COLUMN "stripe_product_id" TEXT;
ALTER TABLE "SubscriptionPlan" ADD COLUMN "stripe_price_id_monthly" TEXT;
ALTER TABLE "SubscriptionPlan" ADD COLUMN "stripe_price_id_yearly" TEXT;

-- CreateIndex: Add unique constraints for Stripe fields in Organization
CREATE UNIQUE INDEX "Organization_stripe_customer_id_key" ON "Organization"("stripe_customer_id");
CREATE UNIQUE INDEX "Organization_stripe_subscription_id_key" ON "Organization"("stripe_subscription_id");

-- CreateIndex: Add unique constraints for Stripe fields in SubscriptionPlan
CREATE UNIQUE INDEX "SubscriptionPlan_stripe_product_id_key" ON "SubscriptionPlan"("stripe_product_id");
CREATE UNIQUE INDEX "SubscriptionPlan_stripe_price_id_monthly_key" ON "SubscriptionPlan"("stripe_price_id_monthly");
CREATE UNIQUE INDEX "SubscriptionPlan_stripe_price_id_yearly_key" ON "SubscriptionPlan"("stripe_price_id_yearly");

-- CreateIndex: Add regular indexes for Stripe fields in Organization
CREATE INDEX "Organization_stripe_customer_id_idx" ON "Organization"("stripe_customer_id");
CREATE INDEX "Organization_stripe_subscription_id_idx" ON "Organization"("stripe_subscription_id");
