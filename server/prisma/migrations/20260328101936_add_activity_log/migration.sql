-- CreateEnum
CREATE TYPE "ActivityLogType" AS ENUM ('TEMPLATE_CREATED', 'TEMPLATE_UPDATED', 'TEMPLATE_APPROVED', 'TEMPLATE_REJECTED', 'TEMPLATE_DELETED', 'AUTOMATION_CREATED', 'AUTOMATION_UPDATED', 'AUTOMATION_ENABLED', 'AUTOMATION_DISABLED', 'AUTOMATION_DELETED');

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "type" "ActivityLogType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");
