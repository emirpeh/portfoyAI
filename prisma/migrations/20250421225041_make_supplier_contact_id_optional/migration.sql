-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SupplierOffer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "offerId" INTEGER NOT NULL,
    "supplierContactId" INTEGER,
    "price" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "SupplierOffer_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SupplierOffer_supplierContactId_fkey" FOREIGN KEY ("supplierContactId") REFERENCES "supplier_contacts" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_SupplierOffer" ("createdAt", "deletedAt", "id", "note", "offerId", "price", "supplierContactId", "updatedAt") SELECT "createdAt", "deletedAt", "id", "note", "offerId", "price", "supplierContactId", "updatedAt" FROM "SupplierOffer";
DROP TABLE "SupplierOffer";
ALTER TABLE "new_SupplierOffer" RENAME TO "SupplierOffer";
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
