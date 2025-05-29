-- CreateTable
CREATE TABLE "customer_mail_list" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mail" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "customer_mail_list_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "mail_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
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
