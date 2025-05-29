-- AlterTable
ALTER TABLE "supplier_contacts" ADD COLUMN "customs" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_offers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "offerNo" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "loadDate" DATETIME DEFAULT NULL,
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
    "deliveryDate" DATETIME DEFAULT NULL,
    "foreignTrade" TEXT,
    "deliveryPostalCode" TEXT,
    "calculatedVolume" INTEGER,
    "calculatedLdm" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);
INSERT INTO "new_offers" ("calculatedLdm", "calculatedVolume", "containerDimensions", "containerType", "createdAt", "deletedAt", "deliveryCity", "deliveryCountry", "deliveryDate", "deliveryPostalCode", "foreignTrade", "goodsType", "id", "isStackable", "loadCity", "loadCountry", "loadDate", "numOfContainers", "offerNo", "packagingType", "status", "updatedAt") SELECT "calculatedLdm", "calculatedVolume", "containerDimensions", "containerType", "createdAt", "deletedAt", "deliveryCity", "deliveryCountry", "deliveryDate", "deliveryPostalCode", "foreignTrade", "goodsType", "id", "isStackable", "loadCity", "loadCountry", "loadDate", "numOfContainers", "offerNo", "packagingType", "status", "updatedAt" FROM "offers";
DROP TABLE "offers";
ALTER TABLE "new_offers" RENAME TO "offers";
CREATE UNIQUE INDEX "offers_offerNo_key" ON "offers"("offerNo");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
