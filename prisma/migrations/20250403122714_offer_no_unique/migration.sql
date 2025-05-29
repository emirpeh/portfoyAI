/*
  Warnings:

  - A unique constraint covering the columns `[offerNo]` on the table `offers` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "offers_offerNo_key" ON "offers"("offerNo");
