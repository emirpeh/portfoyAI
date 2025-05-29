-- CreateTable
CREATE TABLE "OfferResult" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "offerId" INTEGER NOT NULL,
    "supplierContactId" INTEGER,
    "price" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OfferResult_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OfferResult_supplierContactId_fkey" FOREIGN KEY ("supplierContactId") REFERENCES "supplier_contacts" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OfferConfiguration" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "rate" TEXT NOT NULL,
    "profitMargin" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);
INSERT INTO "new_offers" ("containerDimensions", "containerType", "createdAt", "deletedAt", "deliveryCity", "deliveryCountry", "deliveryDate", "foreignTrade", "goodsType", "id", "isStackable", "loadCity", "loadCountry", "loadDate", "numOfContainers", "offerNo", "packagingType", "status", "updatedAt") SELECT "containerDimensions", "containerType", "createdAt", "deletedAt", "deliveryCity", "deliveryCountry", "deliveryDate", "foreignTrade", "goodsType", "id", "isStackable", "loadCity", "loadCountry", "loadDate", "numOfContainers", "offerNo", "packagingType", "status", "updatedAt" FROM "offers";
DROP TABLE "offers";
ALTER TABLE "new_offers" RENAME TO "offers";
CREATE UNIQUE INDEX "offers_offerNo_key" ON "offers"("offerNo");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
