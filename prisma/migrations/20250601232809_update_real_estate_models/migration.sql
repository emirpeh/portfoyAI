/*
  Warnings:

  - You are about to drop the `Offer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OfferResult` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SupplierOffer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `buyerId` on the `BuyerPreference` table. All the data in the column will be lost.
  - You are about to drop the column `preferredDistricts` on the `BuyerPreference` table. All the data in the column will be lost.
  - You are about to alter the column `preferredLocations` on the `BuyerPreference` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.
  - You are about to alter the column `propertyTypes` on the `BuyerPreference` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.
  - You are about to drop the column `customerMailListId` on the `MailLogs` table. All the data in the column will be lost.
  - You are about to drop the column `offerId` on the `MailLogs` table. All the data in the column will be lost.
  - You are about to drop the column `supplierOfferId` on the `MailLogs` table. All the data in the column will be lost.
  - You are about to alter the column `features` on the `RealEstateListing` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.
  - Added the required column `customerId` to the `BuyerPreference` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Offer_supplierOfferId_key";

-- DropIndex
DROP INDEX "Offer_offerNo_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Offer";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "OfferResult";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "SupplierOffer";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "PropertySearchRequest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "requestNo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "customerId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "propertyTypes" JSONB,
    "locations" JSONB,
    "minPrice" REAL,
    "maxPrice" REAL,
    "currency" TEXT DEFAULT 'TRY',
    "minSize" REAL,
    "maxSize" REAL,
    "minRooms" INTEGER,
    "maxRooms" INTEGER,
    "requiredFeatures" JSONB,
    "notes" TEXT,
    CONSTRAINT "PropertySearchRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MatchedProperty" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "searchRequestId" INTEGER NOT NULL,
    "listingId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUGGESTED',
    "matchScore" REAL,
    "suggestionReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MatchedProperty_searchRequestId_fkey" FOREIGN KEY ("searchRequestId") REFERENCES "PropertySearchRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MatchedProperty_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "RealEstateListing" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BuyerPreference" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customerId" INTEGER NOT NULL,
    "preferredLocations" JSONB,
    "minPrice" REAL,
    "maxPrice" REAL,
    "currency" TEXT DEFAULT 'TRY',
    "minSize" REAL,
    "maxSize" REAL,
    "propertyTypes" JSONB,
    "roomCountMin" INTEGER,
    "roomCountMax" INTEGER,
    "requiredFeatures" JSONB,
    "hasGarage" BOOLEAN,
    "hasGarden" BOOLEAN,
    "hasPool" BOOLEAN,
    "isFurnished" BOOLEAN,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BuyerPreference_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_BuyerPreference" ("createdAt", "hasGarage", "hasGarden", "hasPool", "id", "isFurnished", "maxPrice", "maxSize", "minPrice", "minSize", "preferredLocations", "propertyTypes", "roomCountMin", "updatedAt") SELECT "createdAt", "hasGarage", "hasGarden", "hasPool", "id", "isFurnished", "maxPrice", "maxSize", "minPrice", "minSize", "preferredLocations", "propertyTypes", "roomCountMin", "updatedAt" FROM "BuyerPreference";
DROP TABLE "BuyerPreference";
ALTER TABLE "new_BuyerPreference" RENAME TO "BuyerPreference";
CREATE UNIQUE INDEX "BuyerPreference_customerId_key" ON "BuyerPreference"("customerId");
CREATE TABLE "new_MailLogs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "externalId" TEXT,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "cc" TEXT,
    "contentTitle" TEXT,
    "contentBody" TEXT,
    "parsedData" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "language" TEXT,
    "searchRequestId" INTEGER,
    "supplierContactId" INTEGER,
    CONSTRAINT "MailLogs_searchRequestId_fkey" FOREIGN KEY ("searchRequestId") REFERENCES "PropertySearchRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MailLogs_supplierContactId_fkey" FOREIGN KEY ("supplierContactId") REFERENCES "SupplierContactList" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_MailLogs" ("cc", "contentBody", "contentTitle", "createdAt", "deletedAt", "externalId", "from", "id", "language", "supplierContactId", "to", "type", "updatedAt") SELECT "cc", "contentBody", "contentTitle", "createdAt", "deletedAt", "externalId", "from", "id", "language", "supplierContactId", "to", "type", "updatedAt" FROM "MailLogs";
DROP TABLE "MailLogs";
ALTER TABLE "new_MailLogs" RENAME TO "MailLogs";
CREATE TABLE "new_RealEstateConfiguration" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "commissionRate" TEXT NOT NULL DEFAULT '3',
    "defaultCurrency" TEXT NOT NULL DEFAULT 'TRY',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_RealEstateConfiguration" ("commissionRate", "createdAt", "defaultCurrency", "id", "isEnabled", "updatedAt") SELECT "commissionRate", "createdAt", "defaultCurrency", "id", "isEnabled", "updatedAt" FROM "RealEstateConfiguration";
DROP TABLE "RealEstateConfiguration";
ALTER TABLE "new_RealEstateConfiguration" RENAME TO "RealEstateConfiguration";
CREATE TABLE "new_RealEstateListing" (
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
    "currency" TEXT NOT NULL,
    "size" REAL,
    "roomCount" INTEGER,
    "bathroomCount" INTEGER,
    "floor" INTEGER,
    "totalFloors" INTEGER,
    "hasGarage" BOOLEAN NOT NULL DEFAULT false,
    "hasGarden" BOOLEAN NOT NULL DEFAULT false,
    "hasPool" BOOLEAN NOT NULL DEFAULT false,
    "isFurnished" BOOLEAN NOT NULL DEFAULT false,
    "yearBuilt" INTEGER,
    "description" TEXT NOT NULL,
    "features" JSONB,
    "images" JSONB,
    "videos" JSONB,
    "virtualTour" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "RealEstateListing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_RealEstateListing" ("bathroomCount", "city", "createdAt", "currency", "deletedAt", "description", "district", "features", "floor", "hasGarage", "hasGarden", "hasPool", "id", "isFurnished", "listingNo", "location", "neighborhood", "price", "propertyType", "roomCount", "sellerId", "size", "status", "totalFloors", "updatedAt", "yearBuilt") SELECT "bathroomCount", "city", "createdAt", "currency", "deletedAt", "description", "district", "features", "floor", "hasGarage", "hasGarden", "hasPool", "id", "isFurnished", "listingNo", "location", "neighborhood", "price", "propertyType", "roomCount", "sellerId", "size", "status", "totalFloors", "updatedAt", "yearBuilt" FROM "RealEstateListing";
DROP TABLE "RealEstateListing";
ALTER TABLE "new_RealEstateListing" RENAME TO "RealEstateListing";
CREATE UNIQUE INDEX "RealEstateListing_listingNo_key" ON "RealEstateListing"("listingNo");
CREATE TABLE "new_SupplierContactList" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "companyName" TEXT,
    "gender" TEXT,
    "countries" TEXT,
    "foreignTrades" TEXT,
    "language" TEXT DEFAULT 'TR',
    "customs" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);
INSERT INTO "new_SupplierContactList" ("companyName", "countries", "createdAt", "customs", "deletedAt", "email", "foreignTrades", "gender", "id", "language", "name", "updatedAt") SELECT "companyName", "countries", "createdAt", "customs", "deletedAt", "email", "foreignTrades", "gender", "id", "language", "name", "updatedAt" FROM "SupplierContactList";
DROP TABLE "SupplierContactList";
ALTER TABLE "new_SupplierContactList" RENAME TO "SupplierContactList";
CREATE UNIQUE INDEX "SupplierContactList_email_key" ON "SupplierContactList"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "PropertySearchRequest_requestNo_key" ON "PropertySearchRequest"("requestNo");

-- CreateIndex
CREATE UNIQUE INDEX "MatchedProperty_searchRequestId_listingId_key" ON "MatchedProperty"("searchRequestId", "listingId");
