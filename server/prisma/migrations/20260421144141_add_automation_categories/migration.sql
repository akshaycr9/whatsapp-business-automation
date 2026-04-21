/*
  Warnings:

  - Added the required column `categoryId` to the `Automation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ShopifyEvent" ADD VALUE 'COD_ORDER_CONFIRMATION';
ALTER TYPE "ShopifyEvent" ADD VALUE 'COD_ORDER_CANCELLED';

-- DropForeignKey
ALTER TABLE "Automation" DROP CONSTRAINT "Automation_templateId_fkey";

-- AlterTable
ALTER TABLE "Automation" ADD COLUMN     "categoryId" TEXT NOT NULL,
ALTER COLUMN "templateId" DROP NOT NULL,
ALTER COLUMN "variableMapping" SET DEFAULT '{}',
ALTER COLUMN "isActive" SET DEFAULT false;

-- CreateTable
CREATE TABLE "AutomationCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AutomationCategory_name_key" ON "AutomationCategory"("name");

-- CreateIndex
CREATE INDEX "Automation_categoryId_idx" ON "Automation"("categoryId");

-- AddForeignKey
ALTER TABLE "Automation" ADD CONSTRAINT "Automation_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Automation" ADD CONSTRAINT "Automation_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "AutomationCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
