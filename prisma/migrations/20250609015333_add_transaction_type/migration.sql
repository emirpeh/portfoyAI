-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PropertySearchRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestNo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "transactionType" TEXT NOT NULL DEFAULT 'SALE',
    "customerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "propertyTypes" JSONB,
    "locations" JSONB,
    "minPrice" REAL,
    "maxPrice" REAL,
    "currency" TEXT DEFAULT 'TRY',
    "minSize" REAL,
    "maxSize" REAL,
    "minRooms" INTEGER,
    "maxRooms" INTEGER,
    "requiredFeatures" JSONB,
    "notes" TEXT,
    CONSTRAINT "PropertySearchRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PropertySearchRequest" ("createdAt", "currency", "customerId", "id", "locations", "maxPrice", "maxRooms", "maxSize", "minPrice", "minRooms", "minSize", "notes", "propertyTypes", "requestNo", "requiredFeatures", "status", "updatedAt") SELECT "createdAt", "currency", "customerId", "id", "locations", "maxPrice", "maxRooms", "maxSize", "minPrice", "minRooms", "minSize", "notes", "propertyTypes", "requestNo", "requiredFeatures", "status", "updatedAt" FROM "PropertySearchRequest";
DROP TABLE "PropertySearchRequest";
ALTER TABLE "new_PropertySearchRequest" RENAME TO "PropertySearchRequest";
CREATE UNIQUE INDEX "PropertySearchRequest_requestNo_key" ON "PropertySearchRequest"("requestNo");
CREATE TABLE "new_RealEstateListing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT,
    "listingNo" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "transactionType" TEXT NOT NULL DEFAULT 'SALE',
    "sellerId" TEXT NOT NULL,
    "propertyType" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "city" TEXT,
    "district" TEXT,
    "neighborhood" TEXT,
    "price" REAL NOT NULL,
    "currency" TEXT NOT NULL,
    "size" REAL,
    "roomCount" INTEGER,
    "bathroomCount" INTEGER,
    "floor" INTEGER,
    "totalFloors" INTEGER,
    "hasGarage" BOOLEAN NOT NULL DEFAULT false,
    "hasGarden" BOOLEAN NOT NULL DEFAULT false,
    "hasPool" BOOLEAN NOT NULL DEFAULT false,
    "isFurnished" BOOLEAN NOT NULL DEFAULT false,
    "yearBuilt" INTEGER,
    "description" TEXT,
    "features" JSONB,
    "images" JSONB,
    "videos" JSONB,
    "virtualTour" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "RealEstateListing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_RealEstateListing" ("bathroomCount", "city", "createdAt", "currency", "deletedAt", "description", "district", "features", "floor", "hasGarage", "hasGarden", "hasPool", "id", "images", "isFurnished", "listingNo", "location", "neighborhood", "price", "propertyType", "roomCount", "sellerId", "size", "status", "title", "totalFloors", "updatedAt", "videos", "virtualTour", "yearBuilt") SELECT "bathroomCount", "city", "createdAt", "currency", "deletedAt", "description", "district", "features", "floor", "hasGarage", "hasGarden", "hasPool", "id", "images", "isFurnished", "listingNo", "location", "neighborhood", "price", "propertyType", "roomCount", "sellerId", "size", "status", "title", "totalFloors", "updatedAt", "videos", "virtualTour", "yearBuilt" FROM "RealEstateListing";
DROP TABLE "RealEstateListing";
ALTER TABLE "new_RealEstateListing" RENAME TO "RealEstateListing";
CREATE UNIQUE INDEX "RealEstateListing_listingNo_key" ON "RealEstateListing"("listingNo");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
