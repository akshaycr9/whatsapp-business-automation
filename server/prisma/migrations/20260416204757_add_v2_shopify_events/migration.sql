-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ShopifyEvent" ADD VALUE 'ORDER_CANCELLED';
ALTER TYPE "ShopifyEvent" ADD VALUE 'COD_ORDER_FOLLOW_UP';
ALTER TYPE "ShopifyEvent" ADD VALUE 'ABANDONED_CART_FOLLOW_UP';
ALTER TYPE "ShopifyEvent" ADD VALUE 'ABANDONED_CART_WIN_BACK';
