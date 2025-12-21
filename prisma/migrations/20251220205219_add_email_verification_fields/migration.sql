-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN "email_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "email_verification_token" TEXT,
ADD COLUMN "email_verification_token_expires_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_verification_token_key" ON "public"."User"("email_verification_token");

-- CreateIndex
CREATE INDEX "User_email_verification_token_idx" ON "public"."User"("email_verification_token");
