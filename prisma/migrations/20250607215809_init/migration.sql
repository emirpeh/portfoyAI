-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "password" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "customerType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "userId" TEXT,
    CONSTRAINT "Customer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RealEstateListing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT,
    "listingNo" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "propertyType" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "city" TEXT NOT NULL,
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
    "description" TEXT NOT NULL,
    "features" JSONB,
    "images" JSONB,
    "videos" JSONB,
    "virtualTour" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "RealEstateListing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RealEstateInterest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "notes" TEXT,
    "viewingDate" DATETIME,
    "offerAmount" REAL,
    "offerCurrency" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RealEstateInterest_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "RealEstateListing" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RealEstateInterest_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BuyerPreference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "preferredLocations" JSONB,
    "minPrice" REAL,
    "maxPrice" REAL,
    "currency" TEXT DEFAULT 'TRY',
    "minSize" REAL,
    "maxSize" REAL,
    "propertyTypes" JSONB,
    "roomCountMin" INTEGER,
    "roomCountMax" INTEGER,
    "requiredFeatures" JSONB,
    "hasGarage" BOOLEAN,
    "hasGarden" BOOLEAN,
    "hasPool" BOOLEAN,
    "isFurnished" BOOLEAN,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BuyerPreference_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PropertySearchRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestNo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
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

-- CreateTable
CREATE TABLE "MatchedProperty" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "searchRequestId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUGGESTED',
    "matchScore" REAL,
    "suggestionReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MatchedProperty_searchRequestId_fkey" FOREIGN KEY ("searchRequestId") REFERENCES "PropertySearchRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MatchedProperty_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "RealEstateListing" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MailLogs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "externalId" TEXT,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "cc" TEXT,
    "contentTitle" TEXT,
    "contentBody" TEXT,
    "isSend" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "language" TEXT,
    "status" TEXT,
    "parsedData" JSONB,
    "offerId" TEXT,
    "propertySearchRequestId" TEXT,
    "listingId" TEXT,
    CONSTRAINT "MailLogs_propertySearchRequestId_fkey" FOREIGN KEY ("propertySearchRequestId") REFERENCES "PropertySearchRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CustomerMailList" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "mail" TEXT NOT NULL,
    "isSend" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);

-- CreateTable
CREATE TABLE "RealEstateFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileName" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "listingId" TEXT NOT NULL,
    "realEstateListingId" TEXT NOT NULL,
    CONSTRAINT "RealEstateFile_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "RealEstateListing" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertySearchRequestId" TEXT NOT NULL,
    "realEstateListingId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Offer_propertySearchRequestId_fkey" FOREIGN KEY ("propertySearchRequestId") REFERENCES "PropertySearchRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Offer_realEstateListingId_fkey" FOREIGN KEY ("realEstateListingId") REFERENCES "RealEstateListing" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_userId_key" ON "Customer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RealEstateListing_listingNo_key" ON "RealEstateListing"("listingNo");

-- CreateIndex
CREATE UNIQUE INDEX "BuyerPreference_customerId_key" ON "BuyerPreference"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "PropertySearchRequest_requestNo_key" ON "PropertySearchRequest"("requestNo");

-- CreateIndex
CREATE UNIQUE INDEX "MatchedProperty_searchRequestId_listingId_key" ON "MatchedProperty"("searchRequestId", "listingId");

-- CreateIndex
CREATE UNIQUE INDEX "MailLogs_externalId_key" ON "MailLogs"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerMailList_customerId_mail_key" ON "CustomerMailList"("customerId", "mail");

-- CreateIndex
CREATE UNIQUE INDEX "Offer_propertySearchRequestId_realEstateListingId_key" ON "Offer"("propertySearchRequestId", "realEstateListingId");
