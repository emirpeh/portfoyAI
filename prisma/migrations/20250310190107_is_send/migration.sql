-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_customer_mail_list" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mail" TEXT NOT NULL,
    "isSend" BOOLEAN NOT NULL DEFAULT true,
    "customerId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "customer_mail_list_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_customer_mail_list" ("createdAt", "customerId", "deletedAt", "id", "mail", "updatedAt") SELECT "createdAt", "customerId", "deletedAt", "id", "mail", "updatedAt" FROM "customer_mail_list";
DROP TABLE "customer_mail_list";
ALTER TABLE "new_customer_mail_list" RENAME TO "customer_mail_list";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
