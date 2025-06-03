-- CreateTable
CREATE TABLE "SupplierContactList" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "companyName" TEXT,
    "gender" TEXT,
    "countries" TEXT,
    "foreignTrades" TEXT,
    "language" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);

-- CreateTable
CREATE TABLE "MailLogs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "externalId" TEXT,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "cc" TEXT,
    "contentTitle" TEXT,
    "contentBody" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "language" TEXT,
    "supplierOfferId" INTEGER,
    "customerMailListId" INTEGER,
    "supplierContactId" INTEGER,
    "offerId" INTEGER,
    CONSTRAINT "MailLogs_supplierContactId_fkey" FOREIGN KEY ("supplierContactId") REFERENCES "SupplierContactList" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MailLogs_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CustomerMailList" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customerId" INTEGER NOT NULL,
    "mail" TEXT NOT NULL,
    "isSend" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);

-- CreateTable
CREATE TABLE "OfferResult" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "offerId" INTEGER NOT NULL,
    "supplierContactId" INTEGER NOT NULL,
    "price" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OfferResult_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OfferResult_supplierContactId_fkey" FOREIGN KEY ("supplierContactId") REFERENCES "SupplierContactList" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SupplierOffer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "supplierId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "offerId" INTEGER,
    "supplierContactId" INTEGER,
    "price" TEXT,
    "note" TEXT,
    CONSTRAINT "SupplierOffer_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SupplierOffer_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SupplierOffer_supplierContactId_fkey" FOREIGN KEY ("supplierContactId") REFERENCES "SupplierContactList" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_SupplierOffer" ("createdAt", "id", "status", "supplierId", "updatedAt") SELECT "createdAt", "id", "status", "supplierId", "updatedAt" FROM "SupplierOffer";
DROP TABLE "SupplierOffer";
ALTER TABLE "new_SupplierOffer" RENAME TO "SupplierOffer";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "SupplierContactList_email_key" ON "SupplierContactList"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerMailList_customerId_mail_key" ON "CustomerMailList"("customerId", "mail");
