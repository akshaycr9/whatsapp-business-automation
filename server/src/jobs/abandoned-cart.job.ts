import cron from 'node-cron';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { executeAutomation } from '../services/automation.service.js';
import { env } from '../config/env.js';

const SCHEDULE = env.NODE_ENV === 'production' ? '*/5 * * * *' : '* * * * *';
const SCHEDULE_LABEL = env.NODE_ENV === 'production' ? 'every 5 minutes' : 'every minute';

export function startAbandonedCartQueueJob(): void {
  cron.schedule(SCHEDULE, () => {
    void runAbandonedCartQueueCheck();
  });
  logger.info(`Abandoned cart queue job started (${SCHEDULE_LABEL})`);
}

async function runAbandonedCartQueueCheck(): Promise<void> {
  const now = new Date();

  const dueRows = await prisma.abandonedCartQueue.findMany({
    where: { status: 'PENDING', scheduledAt: { lte: now } },
    take: 50,
    orderBy: { scheduledAt: 'asc' },
  });

  if (dueRows.length === 0) {
    logger.debug('Abandoned cart queue: nothing due');
    return;
  }

  logger.info(`Abandoned cart queue: ${dueRows.length} due row(s)`);

  for (const row of dueRows) {
    try {
      const automation = await prisma.automation.findUnique({ where: { id: row.automationId } });

      if (!automation?.isActive) {
        await prisma.abandonedCartQueue.update({
          where: { id: row.id },
          data: { status: 'CANCELLED' },
        });
        logger.info(`Abandoned cart CANCELLED for ${row.customerPhone} — automation inactive`);
        continue;
      }

      await executeAutomation(
        row.automationId,
        row.cartData as Record<string, unknown>,
        row.customerPhone,
      );

      await prisma.abandonedCartQueue.update({
        where: { id: row.id },
        data: { status: 'SENT' },
      });

      logger.info(`Abandoned cart SENT to ${row.customerPhone} (${automation.shopifyEvent})`);
    } catch (err: unknown) {
      logger.error(`Abandoned cart queue: failed for row ${row.id}:`, err);
      // Row stays PENDING — retried next tick
    }
  }
}
