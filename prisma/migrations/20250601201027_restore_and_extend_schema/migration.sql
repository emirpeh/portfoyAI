-- CreateTable
CREATE TABLE "offers" (
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
    "customs" TEXT,
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
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "rate" TEXT NOT NULL,
    "profitMargin" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SupplierOffer" (
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

-- CreateTable
CREATE TABLE "supplier_contacts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "countries" TEXT NOT NULL,
    "customs" TEXT,
    "foreignTrades" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_mail_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "externalId" TEXT,
    "from" TEXT NOT NULL DEFAULT '',
    "to" TEXT NOT NULL DEFAULT '',
    "cc" TEXT NOT NULL DEFAULT '',
    "contentTitle" TEXT NOT NULL DEFAULT '',
    "contentBody" TEXT NOT NULL DEFAULT '',
    "modelResponseMail" TEXT,
    "language" TEXT,
    "type" TEXT NOT NULL,
    "realEstateListingId" INTEGER,
    "customerMailListId" INTEGER,
    "offerId" INTEGER,
    "supplierOfferId" INTEGER,
    "supplierContactId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "mail_logs_realEstateListingId_fkey" FOREIGN KEY ("realEstateListingId") REFERENCES "real_estate_listings" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "mail_logs_customerMailListId_fkey" FOREIGN KEY ("customerMailListId") REFERENCES "customer_mail_list" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "mail_logs_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "mail_logs_supplierOfferId_fkey" FOREIGN KEY ("supplierOfferId") REFERENCES "SupplierOffer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "mail_logs_supplierContactId_fkey" FOREIGN KEY ("supplierContactId") REFERENCES "supplier_contacts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_mail_logs" ("cc", "contentBody", "contentTitle", "createdAt", "customerMailListId", "deletedAt", "externalId", "from", "id", "language", "modelResponseMail", "realEstateListingId", "to", "type", "updatedAt") SELECT "cc", "contentBody", "contentTitle", "createdAt", "customerMailListId", "deletedAt", "externalId", "from", "id", "language", "modelResponseMail", "realEstateListingId", "to", "type", "updatedAt" FROM "mail_logs";
DROP TABLE "mail_logs";
ALTER TABLE "new_mail_logs" RENAME TO "mail_logs";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "offers_offerNo_key" ON "offers"("offerNo");
