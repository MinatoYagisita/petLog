-- CreateTable
CREATE TABLE "PlaceAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PlaceListing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "photoUrl" TEXT,
    "address" TEXT,
    "lat" REAL,
    "lng" REAL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "adminNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PlaceListing_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "PlaceAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "PlaceAccount_email_key" ON "PlaceAccount"("email");
