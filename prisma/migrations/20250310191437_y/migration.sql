/*
  Warnings:

  - You are about to drop the column `deletedAt` on the `customers` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_customers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT,
    "externalId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "customers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_customers" ("createdAt", "externalId", "id", "updatedAt", "userId") SELECT "createdAt", "externalId", "id", "updatedAt", "userId" FROM "customers";
DROP TABLE "customers";
ALTER TABLE "new_customers" RENAME TO "customers";
CREATE UNIQUE INDEX "customers_userId_key" ON "customers"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
