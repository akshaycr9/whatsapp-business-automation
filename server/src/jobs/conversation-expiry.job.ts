import cron from 'node-cron';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { emitConversationUpdated } from '../socket/index.js';
import { env } from '../config/env.js';

const SCHEDULE = env.NODE_ENV === 'production' ? '*/30 * * * *' : '* * * * *';
const SCHEDULE_LABEL = env.NODE_ENV === 'production' ? 'every 30 minutes' : 'every minute';

export function startConversationExpiryJob(): void {
  cron.schedule(SCHEDULE, () => {
    void runConversationExpiryCheck();
  });
  logger.info(`Conversation expiry job started (${SCHEDULE_LABEL})`);
}

async function runConversationExpiryCheck(): Promise<void> {
  const windowCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const expired = await prisma.conversation.findMany({
    where: {
      tab: { in: ['REQUESTING', 'INTERVENED'] },
      lastInboundMessageAt: { lt: windowCutoff },
    },
    include: { customer: true },
  });

  if (expired.length === 0) return;

  await prisma.conversation.updateMany({
    where: { id: { in: expired.map((c) => c.id) } },
    data: { tab: 'CHATS' },
  });

  for (const conv of expired) {
    emitConversationUpdated({ ...conv, tab: 'CHATS' });
  }

  logger.info(`conversation-expiry: moved ${expired.length} conversation(s) to CHATS`);
}
