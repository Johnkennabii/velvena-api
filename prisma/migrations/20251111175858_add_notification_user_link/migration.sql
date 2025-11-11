/*
  Warnings:

  - You are about to drop the column `seen` on the `Notification` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Notification" DROP COLUMN "seen";

-- CreateTable
CREATE TABLE "public"."NotificationUserLink" (
    "id" TEXT NOT NULL,
    "notification_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "seen" BOOLEAN NOT NULL DEFAULT false,
    "seen_at" TIMESTAMP(3),

    CONSTRAINT "NotificationUserLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationUserLink_notification_id_user_id_key" ON "public"."NotificationUserLink"("notification_id", "user_id");

-- AddForeignKey
ALTER TABLE "public"."NotificationUserLink" ADD CONSTRAINT "NotificationUserLink_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "public"."Notification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NotificationUserLink" ADD CONSTRAINT "NotificationUserLink_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
