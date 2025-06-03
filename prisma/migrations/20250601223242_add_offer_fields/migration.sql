-- AlterTable
ALTER TABLE "Offer" ADD COLUMN "deliveryCity" TEXT;
ALTER TABLE "Offer" ADD COLUMN "deliveryCountry" TEXT;
ALTER TABLE "Offer" ADD COLUMN "deliveryDate" DATETIME;
ALTER TABLE "Offer" ADD COLUMN "foreignTrade" TEXT;
ALTER TABLE "Offer" ADD COLUMN "isStackable" TEXT;
ALTER TABLE "Offer" ADD COLUMN "loadCity" TEXT;
ALTER TABLE "Offer" ADD COLUMN "loadCountry" TEXT;
ALTER TABLE "Offer" ADD COLUMN "loadDate" DATETIME;
