/*
  Warnings:

  - You are about to drop the column `deliveryAddress` on the `offers` table. All the data in the column will be lost.
  - You are about to drop the column `loadAddress` on the `offers` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_offers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "offerNo" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "loadDate" DATETIME,
    "loadCountry" TEXT,
    "loadCity" TEXT,
    "packagingType" TEXT,
    "numOfContainers" INTEGER,
    "containerType" TEXT,
    "containerDimensions" TEXT,
    "goodsType" TEXT,
    "isStackable" TEXT,
    "deliveryCountry" TEXT,
    "deliveryCity" TEXT,
    "foreignTrade" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);
INSERT INTO "new_offers" ("containerDimensions", "containerType", "createdAt", "deletedAt", "goodsType", "id", "isStackable", "loadDate", "numOfContainers", "offerNo", "packagingType", "status", "updatedAt") SELECT "containerDimensions", "containerType", "createdAt", "deletedAt", "goodsType", "id", "isStackable", "loadDate", "numOfContainers", "offerNo", "packagingType", "status", "updatedAt" FROM "offers";
DROP TABLE "offers";
ALTER TABLE "new_offers" RENAME TO "offers";
CREATE UNIQUE INDEX "offers_offerNo_key" ON "offers"("offerNo");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
