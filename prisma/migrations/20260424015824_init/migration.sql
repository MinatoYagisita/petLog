-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "FcmToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FcmToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotificationSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "medReminder" BOOLEAN NOT NULL DEFAULT true,
    "medOverdue" BOOLEAN NOT NULL DEFAULT true,
    "stockAlert" BOOLEAN NOT NULL DEFAULT true,
    "visitReminder" BOOLEAN NOT NULL DEFAULT true,
    "trimmingReminder" BOOLEAN NOT NULL DEFAULT true,
    "healthPrompt" BOOLEAN NOT NULL DEFAULT false,
    "stockThreshold" INTEGER NOT NULL DEFAULT 7,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NotificationSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "refId" TEXT NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotificationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "gender" TEXT,
    "birthday" DATETIME,
    "size" TEXT,
    "neutered" BOOLEAN,
    "photoUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" DATETIME,
    CONSTRAINT "Pet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HealthRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "petId" TEXT NOT NULL,
    "condition" TEXT NOT NULL DEFAULT 'normal',
    "walked" BOOLEAN NOT NULL DEFAULT false,
    "walkMinutes" INTEGER,
    "weight" REAL,
    "temperature" REAL,
    "mealCount" INTEGER,
    "mealAmount" INTEGER,
    "waterCount" INTEGER,
    "urineCount" INTEGER,
    "fecalCount" INTEGER,
    "fecalType" INTEGER,
    "vomitCount" INTEGER,
    "activityLevel" INTEGER,
    "recordedAt" DATETIME NOT NULL,
    "isBackfilled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" DATETIME,
    CONSTRAINT "HealthRecord_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Medication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "petId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "stockCount" REAL,
    "doseAmount" REAL,
    "stockUnit" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" DATETIME,
    CONSTRAINT "Medication_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MedicationSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "medicationId" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    CONSTRAINT "MedicationSchedule_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "Medication" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MedicationLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scheduleId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "actualTime" DATETIME,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MedicationLog_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "MedicationSchedule" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Hospital" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" DATETIME,
    CONSTRAINT "Hospital_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Visit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "petId" TEXT NOT NULL,
    "hospitalId" TEXT,
    "hospitalName" TEXT NOT NULL,
    "visitDate" DATETIME NOT NULL,
    "diagnosis" TEXT,
    "note" TEXT,
    "nextVisitDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Visit_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Visit_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Prescription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "petId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "visitId" TEXT,
    "prescribedDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" DATETIME,
    CONSTRAINT "Prescription_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Prescription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Prescription_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PrescriptionMedication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "prescriptionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "frequency" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    CONSTRAINT "PrescriptionMedication_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Salon" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" DATETIME,
    CONSTRAINT "Salon_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Trimming" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "petId" TEXT NOT NULL,
    "salonId" TEXT,
    "salonName" TEXT,
    "scheduledDate" DATETIME NOT NULL,
    "completedDate" DATETIME,
    "content" TEXT,
    "cost" INTEGER,
    "note" TEXT,
    "nextScheduledDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Trimming_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Trimming_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "FcmToken_token_key" ON "FcmToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationSetting_userId_key" ON "NotificationSetting"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationLog_userId_type_refId_key" ON "NotificationLog"("userId", "type", "refId");

-- CreateIndex
CREATE UNIQUE INDEX "Prescription_visitId_key" ON "Prescription"("visitId");
