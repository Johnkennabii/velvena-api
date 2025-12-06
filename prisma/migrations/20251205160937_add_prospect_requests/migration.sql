-- CreateTable
CREATE TABLE "public"."ProspectRequest" (
    "id" TEXT NOT NULL,
    "request_number" TEXT NOT NULL,
    "prospect_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "total_estimated_ht" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total_estimated_ttc" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3),
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,

    CONSTRAINT "ProspectRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProspectRequestDress" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "dress_id" TEXT NOT NULL,
    "rental_start_date" TIMESTAMP(3) NOT NULL,
    "rental_end_date" TIMESTAMP(3) NOT NULL,
    "rental_days" INTEGER NOT NULL,
    "estimated_price_ht" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "estimated_price_ttc" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3),
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,

    CONSTRAINT "ProspectRequestDress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProspectRequest_request_number_key" ON "public"."ProspectRequest"("request_number");

-- CreateIndex
CREATE INDEX "ProspectRequest_prospect_id_idx" ON "public"."ProspectRequest"("prospect_id");

-- CreateIndex
CREATE INDEX "ProspectRequest_request_number_idx" ON "public"."ProspectRequest"("request_number");

-- CreateIndex
CREATE INDEX "ProspectRequestDress_request_id_idx" ON "public"."ProspectRequestDress"("request_id");

-- CreateIndex
CREATE INDEX "ProspectRequestDress_dress_id_idx" ON "public"."ProspectRequestDress"("dress_id");

-- CreateIndex
CREATE INDEX "ProspectRequestDress_rental_start_date_rental_end_date_idx" ON "public"."ProspectRequestDress"("rental_start_date", "rental_end_date");

-- AddForeignKey
ALTER TABLE "public"."ProspectRequest" ADD CONSTRAINT "ProspectRequest_prospect_id_fkey" FOREIGN KEY ("prospect_id") REFERENCES "public"."Prospect"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProspectRequestDress" ADD CONSTRAINT "ProspectRequestDress_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."ProspectRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProspectRequestDress" ADD CONSTRAINT "ProspectRequestDress_dress_id_fkey" FOREIGN KEY ("dress_id") REFERENCES "public"."Dress"("id") ON DELETE CASCADE ON UPDATE CASCADE;
