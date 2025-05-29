/*
  Warnings:

  - Added the required column `companyName` to the `supplier_contacts` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_supplier_contacts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "countries" TEXT NOT NULL,
    "foreignTrades" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);
INSERT INTO "new_supplier_contacts" ("countries", "createdAt", "deletedAt", "email", "foreignTrades", "gender", "id", "language", "name", "updatedAt") SELECT "countries", "createdAt", "deletedAt", "email", "foreignTrades", "gender", "id", "language", "name", "updatedAt" FROM "supplier_contacts";
DROP TABLE "supplier_contacts";
ALTER TABLE "new_supplier_contacts" RENAME TO "supplier_contacts";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
