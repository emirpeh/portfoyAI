/*
  Warnings:

  - Added the required column `externalId` to the `mail_logs` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_mail_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "externalId" TEXT NOT NULL,
    "mail" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "customerMailList" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "pozNo" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "mail_logs_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_mail_logs" ("createdAt", "customerId", "customerMailList", "deletedAt", "id", "mail", "pozNo", "status", "type", "updatedAt") SELECT "createdAt", "customerId", "customerMailList", "deletedAt", "id", "mail", "pozNo", "status", "type", "updatedAt" FROM "mail_logs";
DROP TABLE "mail_logs";
ALTER TABLE "new_mail_logs" RENAME TO "mail_logs";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
