/*
  Warnings:

  - You are about to drop the `OfferResult` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `customer_mail_list` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `customers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `mail_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `offers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `real_estate_interests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `real_estate_listings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `supplier_contacts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `deletedAt` on the `SupplierOffer` table. All the data in the column will be lost.
  - You are about to drop the column `note` on the `SupplierOffer` table. All the data in the column will be lost.
  - You are about to drop the column `offerId` on the `SupplierOffer` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `SupplierOffer` table. All the data in the column will be lost.
  - You are about to drop the column `supplierContactId` on the `SupplierOffer` table. All the data in the column will be lost.
  - Added the required column `supplierId` to the `SupplierOffer` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "customers_userId_key";

-- DropIndex
DROP INDEX "offers_offerNo_key";

-- DropIndex
DROP INDEX "real_estate_listings_listingNo_key";

-- DropIndex
DROP INDEX "users_email_deletedAt_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "OfferResult";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "customer_mail_list";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "customers";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "mail_logs";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "offers";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "real_estate_interests";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "real_estate_listings";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "supplier_contacts";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "users";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "password" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "customerType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "userId" INTEGER,
    CONSTRAINT "Customer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RealEstateListing" (
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
    "features" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "RealEstateListing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RealEstateInterest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "status" TEXT NOT NULL,
    "buyerId" INTEGER NOT NULL,
    "listingId" INTEGER NOT NULL,
    "notes" TEXT,
    "viewingDate" DATETIME,
    "offerAmount" REAL,
    "offerCurrency" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RealEstateInterest_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RealEstateInterest_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "RealEstateListing" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BuyerPreference" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "buyerId" INTEGER NOT NULL,
    "preferredLocations" TEXT,
    "preferredDistricts" TEXT,
    "minPrice" REAL,
    "maxPrice" REAL,
    "minSize" REAL,
    "maxSize" REAL,
    "propertyTypes" TEXT,
    "roomCountMin" INTEGER,
    "hasGarage" BOOLEAN,
    "hasGarden" BOOLEAN,
    "hasPool" BOOLEAN,
    "isFurnished" BOOLEAN,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "offerNo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "customerId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "supplierId" INTEGER,
    "supplierOfferId" INTEGER,
    CONSTRAINT "Offer_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Offer_supplierOfferId_fkey" FOREIGN KEY ("supplierOfferId") REFERENCES "SupplierOffer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RealEstateConfiguration" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "commissionRate" TEXT NOT NULL DEFAULT '3',
    "defaultCurrency" TEXT NOT NULL DEFAULT 'TL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_OfferConfiguration" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "rate" TEXT NOT NULL DEFAULT '10',
    "profitMargin" TEXT NOT NULL DEFAULT '20',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_OfferConfiguration" ("createdAt", "id", "isEnabled", "profitMargin", "rate", "updatedAt") SELECT "createdAt", "id", "isEnabled", "profitMargin", "rate", "updatedAt" FROM "OfferConfiguration";
DROP TABLE "OfferConfiguration";
ALTER TABLE "new_OfferConfiguration" RENAME TO "OfferConfiguration";
CREATE TABLE "new_SupplierOffer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "supplierId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SupplierOffer_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SupplierOffer" ("createdAt", "id", "updatedAt") SELECT "createdAt", "id", "updatedAt" FROM "SupplierOffer";
DROP TABLE "SupplierOffer";
ALTER TABLE "new_SupplierOffer" RENAME TO "SupplierOffer";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_userId_key" ON "Customer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RealEstateListing_listingNo_key" ON "RealEstateListing"("listingNo");

-- CreateIndex
CREATE UNIQUE INDEX "BuyerPreference_buyerId_key" ON "BuyerPreference"("buyerId");

-- CreateIndex
CREATE UNIQUE INDEX "Offer_offerNo_key" ON "Offer"("offerNo");

-- CreateIndex
CREATE UNIQUE INDEX "Offer_supplierOfferId_key" ON "Offer"("supplierOfferId");
