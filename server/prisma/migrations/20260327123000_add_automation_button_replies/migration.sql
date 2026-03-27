-- AlterEnum
ALTER TYPE "MessageType" ADD VALUE 'INTERACTIVE';

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "lastInboundMessageAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "AutomationButtonReply" (
    "id" TEXT NOT NULL,
    "automationId" TEXT NOT NULL,
    "buttonText" TEXT NOT NULL,
    "replyTemplateId" TEXT NOT NULL,
    "variableMapping" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationButtonReply_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AutomationButtonReply_automationId_idx" ON "AutomationButtonReply"("automationId");

-- CreateIndex
CREATE UNIQUE INDEX "AutomationButtonReply_automationId_buttonText_key" ON "AutomationButtonReply"("automationId", "buttonText");

-- AddForeignKey
ALTER TABLE "AutomationButtonReply" ADD CONSTRAINT "AutomationButtonReply_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "Automation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationButtonReply" ADD CONSTRAINT "AutomationButtonReply_replyTemplateId_fkey" FOREIGN KEY ("replyTemplateId") REFERENCES "Template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
