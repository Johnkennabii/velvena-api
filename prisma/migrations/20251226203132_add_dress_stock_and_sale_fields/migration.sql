-- AlterTable
ALTER TABLE "public"."Dress" ADD COLUMN     "is_for_sale" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stock_quantity" INTEGER NOT NULL DEFAULT 1;
