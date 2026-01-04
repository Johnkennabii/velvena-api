-- CreateTable
CREATE TABLE "public"."ProspectNote" (
    "id" TEXT NOT NULL,
    "prospect_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3),
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,

    CONSTRAINT "ProspectNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProspectNote_prospect_id_idx" ON "public"."ProspectNote"("prospect_id");

-- AddForeignKey
ALTER TABLE "public"."ProspectNote" ADD CONSTRAINT "ProspectNote_prospect_id_fkey" FOREIGN KEY ("prospect_id") REFERENCES "public"."Prospect"("id") ON DELETE CASCADE ON UPDATE CASCADE;
