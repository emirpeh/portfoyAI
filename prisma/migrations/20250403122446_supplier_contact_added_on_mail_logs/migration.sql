/*
  Warnings:

  - You are about to drop the column `supplierContactId` on the `SupplierOffer` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SupplierOffer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "offerId" INTEGER NOT NULL,
    "price" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "SupplierOffer_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SupplierOffer" ("createdAt", "deletedAt", "id", "offerId", "price", "updatedAt") SELECT "createdAt", "deletedAt", "id", "offerId", "price", "updatedAt" FROM "SupplierOffer";
DROP TABLE "SupplierOffer";
ALTER TABLE "new_SupplierOffer" RENAME TO "SupplierOffer";
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
    "offerId" INTEGER NOT NULL DEFAULT 0,
    "customerMailListId" INTEGER,
    "supplierOfferId" INTEGER,
    "supplierContactId" INTEGER,
    CONSTRAINT "mail_logs_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "mail_logs_customerMailListId_fkey" FOREIGN KEY ("customerMailListId") REFERENCES "customer_mail_list" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "mail_logs_supplierOfferId_fkey" FOREIGN KEY ("supplierOfferId") REFERENCES "SupplierOffer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "mail_logs_supplierContactId_fkey" FOREIGN KEY ("supplierContactId") REFERENCES "supplier_contacts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_mail_logs" ("cc", "contentBody", "contentTitle", "createdAt", "customerMailListId", "deletedAt", "externalId", "from", "id", "offerId", "supplierOfferId", "to", "type", "updatedAt") SELECT "cc", "contentBody", "contentTitle", "createdAt", "customerMailListId", "deletedAt", "externalId", "from", "id", "offerId", "supplierOfferId", "to", "type", "updatedAt" FROM "mail_logs";
DROP TABLE "mail_logs";
ALTER TABLE "new_mail_logs" RENAME TO "mail_logs";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
