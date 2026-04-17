-- CreateEnum
CREATE TYPE "CodFollowUpStatus" AS ENUM ('PENDING', 'SENT', 'SKIPPED', 'CANCELLED');

-- CreateTable
CREATE TABLE "CodFollowUpQueue" (
    "id" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "automationId" TEXT NOT NULL,
    "shopifyData" JSONB NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3) NOT NULL,
    "status" "CodFollowUpStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CodFollowUpQueue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CodFollowUpQueue_status_scheduledAt_idx" ON "CodFollowUpQueue"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "CodFollowUpQueue_customerPhone_status_idx" ON "CodFollowUpQueue"("customerPhone", "status");

-- AddForeignKey
ALTER TABLE "CodFollowUpQueue" ADD CONSTRAINT "CodFollowUpQueue_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "Automation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
