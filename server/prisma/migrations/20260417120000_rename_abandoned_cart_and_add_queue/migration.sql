-- Rename abandoned cart ShopifyEvent enum values and add AbandonedCartQueue

-- CreateEnum
CREATE TYPE "AbandonedCartStatus" AS ENUM ('PENDING', 'SENT', 'SKIPPED', 'CANCELLED');

-- AlterEnum strategy: convert column to TEXT, drop old enum, update values, recreate enum, restore column type

-- Step 1: Convert shopifyEvent column to TEXT so we can drop the enum and update values freely
ALTER TABLE "Automation" ALTER COLUMN "shopifyEvent" TYPE TEXT;

-- Step 2: Drop the old ShopifyEvent enum (column no longer depends on it)
DROP TYPE "ShopifyEvent";

-- Step 3: Rename old abandoned cart values to numbered convention
UPDATE "Automation" SET "shopifyEvent" = 'ABANDONED_CART_1' WHERE "shopifyEvent" = 'ABANDONED_CART';
UPDATE "Automation" SET "shopifyEvent" = 'ABANDONED_CART_2' WHERE "shopifyEvent" = 'ABANDONED_CART_FOLLOW_UP';
UPDATE "Automation" SET "shopifyEvent" = 'ABANDONED_CART_3' WHERE "shopifyEvent" = 'ABANDONED_CART_WIN_BACK';

-- Step 4: Rename display names
UPDATE "Automation" SET "name" = 'Abandoned Cart 1' WHERE "shopifyEvent" = 'ABANDONED_CART_1';
UPDATE "Automation" SET "name" = 'Abandoned Cart 2' WHERE "shopifyEvent" = 'ABANDONED_CART_2';
UPDATE "Automation" SET "name" = 'Abandoned Cart 3' WHERE "shopifyEvent" = 'ABANDONED_CART_3';

-- Step 5: Recreate ShopifyEvent enum with new values
CREATE TYPE "ShopifyEvent" AS ENUM ('PREPAID_ORDER_CONFIRMED', 'COD_ORDER_CONFIRMED', 'ORDER_FULFILLED', 'ORDER_CANCELLED', 'COD_ORDER_FOLLOW_UP', 'ABANDONED_CART_1', 'ABANDONED_CART_2', 'ABANDONED_CART_3');

-- Step 6: Restore column type back to the new enum
ALTER TABLE "Automation" ALTER COLUMN "shopifyEvent" TYPE "ShopifyEvent" USING "shopifyEvent"::"ShopifyEvent";

-- CreateTable
CREATE TABLE "AbandonedCartQueue" (
    "id" TEXT NOT NULL,
    "cartToken" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "automationId" TEXT NOT NULL,
    "cartData" JSONB NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "abandonedAt" TIMESTAMP(3) NOT NULL,
    "status" "AbandonedCartStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AbandonedCartQueue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AbandonedCartQueue_status_scheduledAt_idx" ON "AbandonedCartQueue"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "AbandonedCartQueue_cartToken_automationId_idx" ON "AbandonedCartQueue"("cartToken", "automationId");

-- AddForeignKey
ALTER TABLE "AbandonedCartQueue" ADD CONSTRAINT "AbandonedCartQueue_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "Automation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
