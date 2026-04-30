-- CreateEnum
CREATE TYPE "ConversationTab" AS ENUM ('CHATS', 'REQUESTING', 'INTERVENED');

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "tab" "ConversationTab" NOT NULL DEFAULT 'CHATS';

-- Backfill tab based on existing timestamp data
UPDATE "Conversation"
SET tab = CASE
  WHEN "lastInboundMessageAt" IS NOT NULL
    AND "lastInboundMessageAt" > NOW() - INTERVAL '24 hours'
    AND ("lastOutboundMessageAt" IS NULL OR "lastOutboundMessageAt" < "lastInboundMessageAt")
    THEN 'REQUESTING'::"ConversationTab"
  WHEN "lastInboundMessageAt" IS NOT NULL
    AND "lastOutboundMessageAt" IS NOT NULL
    AND "lastInboundMessageAt" > NOW() - INTERVAL '24 hours'
    AND "lastOutboundMessageAt" >= "lastInboundMessageAt"
    THEN 'INTERVENED'::"ConversationTab"
  ELSE 'CHATS'::"ConversationTab"
END;
