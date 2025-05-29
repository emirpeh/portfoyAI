-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_mail_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "externalId" TEXT,
    "from" TEXT NOT NULL DEFAULT '',
    "to" TEXT NOT NULL DEFAULT '',
    "cc" TEXT NOT NULL DEFAULT '',
    "contentTitle" TEXT NOT NULL DEFAULT '',
    "contentBody" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL,
    "offerId" INTEGER,
    "customerMailListId" INTEGER,
    "supplierOfferId" INTEGER,
    "supplierContactId" INTEGER,
    CONSTRAINT "mail_logs_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "mail_logs_customerMailListId_fkey" FOREIGN KEY ("customerMailListId") REFERENCES "customer_mail_list" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "mail_logs_supplierOfferId_fkey" FOREIGN KEY ("supplierOfferId") REFERENCES "SupplierOffer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "mail_logs_supplierContactId_fkey" FOREIGN KEY ("supplierContactId") REFERENCES "supplier_contacts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_mail_logs" ("cc", "contentBody", "contentTitle", "createdAt", "customerMailListId", "deletedAt", "externalId", "from", "id", "offerId", "supplierContactId", "supplierOfferId", "to", "type", "updatedAt") SELECT "cc", "contentBody", "contentTitle", "createdAt", "customerMailListId", "deletedAt", "externalId", "from", "id", "offerId", "supplierContactId", "supplierOfferId", "to", "type", "updatedAt" FROM "mail_logs";
DROP TABLE "mail_logs";
ALTER TABLE "new_mail_logs" RENAME TO "mail_logs";
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
