-- AlterTable
ALTER TABLE `healthrecord` ADD COLUMN `condition` VARCHAR(191) NOT NULL DEFAULT 'normal',
    ADD COLUMN `walkMinutes` INTEGER NULL,
    ADD COLUMN `walked` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `medication` ADD COLUMN `doseAmount` DOUBLE NULL,
    ADD COLUMN `note` VARCHAR(191) NULL,
    ADD COLUMN `stockCount` DOUBLE NULL,
    ADD COLUMN `stockUnit` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `visit` ADD COLUMN `hospitalId` VARCHAR(191) NULL,
    ADD COLUMN `note` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Hospital` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `note` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deletedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Salon` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `note` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deletedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Trimming` (
    `id` VARCHAR(191) NOT NULL,
    `petId` VARCHAR(191) NOT NULL,
    `salonId` VARCHAR(191) NULL,
    `salonName` VARCHAR(191) NULL,
    `scheduledDate` DATETIME(3) NOT NULL,
    `completedDate` DATETIME(3) NULL,
    `content` VARCHAR(191) NULL,
    `cost` INTEGER NULL,
    `note` VARCHAR(191) NULL,
    `nextScheduledDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Hospital` ADD CONSTRAINT `Hospital_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Visit` ADD CONSTRAINT `Visit_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Salon` ADD CONSTRAINT `Salon_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Trimming` ADD CONSTRAINT `Trimming_petId_fkey` FOREIGN KEY (`petId`) REFERENCES `Pet`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Trimming` ADD CONSTRAINT `Trimming_salonId_fkey` FOREIGN KEY (`salonId`) REFERENCES `Salon`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
