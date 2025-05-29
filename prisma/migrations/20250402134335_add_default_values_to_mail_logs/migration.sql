/*
  Warnings:

  - The primary key for the `mail_logs` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `customerId` on the `mail_logs` table. All the data in the column will be lost.
  - You are about to drop the column `customerMailList` on the `mail_logs` table. All the data in the column will be lost.
  - You are about to drop the column `externalId` on the `mail_logs` table. All the data in the column will be lost.
  - You are about to drop the column `mail` on the `mail_logs` table. All the data in the column will be lost.
  - You are about to drop the column `pozNo` on the `mail_logs` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `mail_logs` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "offers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "offerNo" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "loadDate" DATETIME,
    "loadAddress" TEXT,
    "packagingType" TEXT,
    "numOfContainers" INTEGER,
    "containerType" TEXT,
    "containerDimensions" TEXT,
    "goodsType" TEXT,
    "isStackable" TEXT,
    "deliveryAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);

-- CreateTable
CREATE TABLE "SupplierOffer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "offerId" INTEGER NOT NULL,
    "supplierContactId" INTEGER NOT NULL,
    "price" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "SupplierOffer_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SupplierOffer_supplierContactId_fkey" FOREIGN KEY ("supplierContactId") REFERENCES "supplier_contacts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "supplier_contacts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "countries" TEXT NOT NULL,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "from" TEXT NOT NULL DEFAULT '',
    "to" TEXT NOT NULL DEFAULT '',
    "cc" TEXT NOT NULL DEFAULT '',
    "contentTitle" TEXT NOT NULL DEFAULT '',
    "contentBody" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL,
    "offerId" INTEGER NOT NULL DEFAULT 0,
    "supplierOfferId" INTEGER,
    CONSTRAINT "mail_logs_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "mail_logs_supplierOfferId_fkey" FOREIGN KEY ("supplierOfferId") REFERENCES "SupplierOffer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_mail_logs" ("createdAt", "deletedAt", "id", "type", "updatedAt") SELECT "createdAt", "deletedAt", "id", "type", "updatedAt" FROM "mail_logs";
DROP TABLE "mail_logs";
ALTER TABLE "new_mail_logs" RENAME TO "mail_logs";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
