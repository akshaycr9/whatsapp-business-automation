/*
  Warnings:

  - You are about to drop the `AutomationButtonReply` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "AutomationTrigger" AS ENUM ('SHOPIFY_EVENT', 'BUTTON_REPLY');

-- DropForeignKey
ALTER TABLE "AutomationButtonReply" DROP CONSTRAINT "AutomationButtonReply_automationId_fkey";

-- DropForeignKey
ALTER TABLE "AutomationButtonReply" DROP CONSTRAINT "AutomationButtonReply_replyTemplateId_fkey";

-- AlterTable
ALTER TABLE "Automation" ADD COLUMN     "buttonTriggerText" TEXT,
ADD COLUMN     "triggerType" "AutomationTrigger" NOT NULL DEFAULT 'SHOPIFY_EVENT',
ALTER COLUMN "shopifyEvent" DROP NOT NULL;

-- DropTable
DROP TABLE "AutomationButtonReply";

-- CreateIndex
CREATE INDEX "AutomationLog_customerPhone_createdAt_idx" ON "AutomationLog"("customerPhone", "createdAt");
