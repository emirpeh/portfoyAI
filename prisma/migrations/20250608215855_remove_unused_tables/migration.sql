/*
  Warnings:

  - You are about to drop the `BuyerPreference` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CustomerMailList` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "BuyerPreference";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "CustomerMailList";
PRAGMA foreign_keys=on;
