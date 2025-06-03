/*
  Warnings:

  - You are about to drop the `OfferConfiguration` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OfferResult` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SupplierOffer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `offers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `supplier_contacts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `offerId` on the `mail_logs` table. All the data in the column will be lost.
  - You are about to drop the column `supplierContactId` on the `mail_logs` table. All the data in the column will be lost.
  - You are about to drop the column `supplierOfferId` on the `mail_logs` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "offers_offerNo_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "OfferConfiguration";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "OfferResult";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "SupplierOffer";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "offers";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "supplier_contacts";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "real_estate_listings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "listingNo" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "sellerId" INTEGER NOT NULL,
    "propertyType" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "district" TEXT,
    "neighborhood" TEXT,
    "price" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TL',
    "size" REAL,
    "roomCount" INTEGER,
    "bathroomCount" INTEGER,
    "floor" INTEGER,
    "totalFloors" INTEGER,
    "hasGarage" BOOLEAN,
    "hasGarden" BOOLEAN,
    "hasPool" BOOLEAN,
    "isFurnished" BOOLEAN,
    "yearBuilt" INTEGER,
    "description" TEXT NOT NULL,
    "features" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "real_estate_listings_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "real_estate_interests" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "buyerId" INTEGER NOT NULL,
    "listingId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONTACTED',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "real_estate_interests_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "real_estate_interests_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "real_estate_listings" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_customers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT,
    "externalId" TEXT,
    "customerType" TEXT NOT NULL DEFAULT 'BUYER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "customers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_customers" ("createdAt", "externalId", "id", "updatedAt", "userId") SELECT "createdAt", "externalId", "id", "updatedAt", "userId" FROM "customers";
DROP TABLE "customers";
ALTER TABLE "new_customers" RENAME TO "customers";
CREATE UNIQUE INDEX "customers_userId_key" ON "customers"("userId");
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "mail_logs_realEstateListingId_fkey" FOREIGN KEY ("realEstateListingId") REFERENCES "real_estate_listings" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "mail_logs_customerMailListId_fkey" FOREIGN KEY ("customerMailListId") REFERENCES "customer_mail_list" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_mail_logs" ("cc", "contentBody", "contentTitle", "createdAt", "customerMailListId", "deletedAt", "externalId", "from", "id", "language", "modelResponseMail", "to", "type", "updatedAt") SELECT "cc", "contentBody", "contentTitle", "createdAt", "customerMailListId", "deletedAt", "externalId", "from", "id", "language", "modelResponseMail", "to", "type", "updatedAt" FROM "mail_logs";
DROP TABLE "mail_logs";
ALTER TABLE "new_mail_logs" RENAME TO "mail_logs";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "real_estate_listings_listingNo_key" ON "real_estate_listings"("listingNo");
