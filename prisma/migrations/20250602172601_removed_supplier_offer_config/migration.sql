/*
  Warnings:

  - You are about to drop the `OfferConfiguration` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RealEstateConfiguration` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SupplierContactList` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `supplierContactId` on the `MailLogs` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "SupplierContactList_email_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "OfferConfiguration";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "RealEstateConfiguration";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "SupplierContactList";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    CONSTRAINT "MailLogs_searchRequestId_fkey" FOREIGN KEY ("searchRequestId") REFERENCES "PropertySearchRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_MailLogs" ("cc", "contentBody", "contentTitle", "createdAt", "deletedAt", "externalId", "from", "id", "language", "parsedData", "searchRequestId", "to", "type", "updatedAt") SELECT "cc", "contentBody", "contentTitle", "createdAt", "deletedAt", "externalId", "from", "id", "language", "parsedData", "searchRequestId", "to", "type", "updatedAt" FROM "MailLogs";
DROP TABLE "MailLogs";
ALTER TABLE "new_MailLogs" RENAME TO "MailLogs";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
