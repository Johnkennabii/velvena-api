-- CreateTable
CREATE TABLE "public"."ProspectDressReservation" (
    "id" TEXT NOT NULL,
    "prospect_id" TEXT NOT NULL,
    "dress_id" TEXT NOT NULL,
    "rental_start_date" TIMESTAMP(3) NOT NULL,
    "rental_end_date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3),
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,

    CONSTRAINT "ProspectDressReservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProspectDressReservation_prospect_id_idx" ON "public"."ProspectDressReservation"("prospect_id");

-- CreateIndex
CREATE INDEX "ProspectDressReservation_dress_id_idx" ON "public"."ProspectDressReservation"("dress_id");

-- CreateIndex
CREATE INDEX "ProspectDressReservation_rental_start_date_rental_end_date_idx" ON "public"."ProspectDressReservation"("rental_start_date", "rental_end_date");

-- AddForeignKey
ALTER TABLE "public"."ProspectDressReservation" ADD CONSTRAINT "ProspectDressReservation_prospect_id_fkey" FOREIGN KEY ("prospect_id") REFERENCES "public"."Prospect"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProspectDressReservation" ADD CONSTRAINT "ProspectDressReservation_dress_id_fkey" FOREIGN KEY ("dress_id") REFERENCES "public"."Dress"("id") ON DELETE CASCADE ON UPDATE CASCADE;
