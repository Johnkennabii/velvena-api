/*
  Warnings:

  - Made the column `price_ht` on table `ContractAddon` required. This step will fail if there are existing NULL values in that column.
  - Made the column `price_ttc` on table `ContractAddon` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."ContractAddon" ALTER COLUMN "price_ht" SET NOT NULL,
ALTER COLUMN "price_ht" SET DEFAULT 0,
ALTER COLUMN "price_ttc" SET NOT NULL,
ALTER COLUMN "price_ttc" SET DEFAULT 0;
