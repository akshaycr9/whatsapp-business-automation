import cron from 'node-cron';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { triggerForEvent } from '../services/automation.service.js';

export function startAbandonedCartJob(): void {
  cron.schedule('*/5 * * * *', () => {
    void runAbandonedCartCheck();
  });

  logger.info('Abandoned cart job started (runs every 5 minutes)');
}

async function runAbandonedCartCheck(): Promise<void> {
  logger.info('Abandoned cart job: checking...');

  try {
    const cutoff = new Date(Date.now() - 60 * 60 * 1000);

    const abandoned = await prisma.checkoutTracker.findMany({
      where: {
        orderCreated: false,
        abandonedNotified: false,
        createdAt: { lt: cutoff },
        customerPhone: { not: null },
      },
      take: 50,
    });

    if (abandoned.length === 0) {
      logger.debug('Abandoned cart job: nothing to process');
      return;
    }

    logger.info(`Abandoned cart job: processing ${abandoned.length} carts`);

    for (const cart of abandoned) {
      if (!cart.customerPhone) continue;

      try {
        await triggerForEvent(
          'ABANDONED_CART',
          cart.checkoutData as Record<string, unknown>,
          cart.customerPhone,
        );

        await prisma.checkoutTracker.update({
          where: { id: cart.id },
          data: { abandonedNotified: true },
        });
      } catch (err: unknown) {
        logger.error(`Abandoned cart job: failed for cart ${cart.id}:`, err);
      }
    }
  } catch (err: unknown) {
    logger.error('Abandoned cart job: unexpected error:', err);
  }
}
