import { Router } from 'express';
import { type Prisma } from '@prisma/client';
import { logger } from '../../lib/logger.js';
import { prisma } from '../../lib/prisma.js';
import { normalizePhone } from '../../utils/phone.js';

const router = Router();

// Razorpay does not provide webhook signatures — no HMAC verification.
// Endpoint security relies on the URL not being publicly advertised.
router.post('/', (req, res) => {
  res.sendStatus(200);
  processRazorpayWebhook(req.body as Record<string, unknown>).catch((err: unknown) => {
    logger.error('Razorpay webhook processing error:', err);
  });
});

async function processRazorpayWebhook(body: Record<string, unknown>): Promise<void> {
  const cartToken = body['cart_token'] as string | undefined;
  const rawPhone = body['phone'] as string | undefined;

  if (!cartToken || !rawPhone) {
    logger.warn('Razorpay webhook: missing cart_token or phone — skipping');
    return;
  }

  const customerPhone = normalizePhone(rawPhone);
  const abandonedAt = new Date();

  logger.info(`Razorpay abandoned cart: cartToken=${cartToken}, phone=${customerPhone}`);

  // Log the payload structure once per webhook so we can verify field names.
  // This runs in all environments — remove after confirming the payload shape.
  logger.info(
    `Razorpay payload top-level keys: ${JSON.stringify(Object.keys(body))}`,
  );
  const lineItemsRaw = body['line_items'];
  if (Array.isArray(lineItemsRaw) && lineItemsRaw.length > 0) {
    logger.info(
      `Razorpay line_items[0] keys: ${JSON.stringify(Object.keys(lineItemsRaw[0] as Record<string, unknown>))}`,
    );
  } else {
    logger.warn(
      `Razorpay: line_items missing or empty at root level — cartData will have no line items to summarise`,
    );
  }

  const automations = await prisma.automation.findMany({
    where: {
      triggerType: 'SHOPIFY_EVENT',
      shopifyEvent: { in: ['ABANDONED_CART_1', 'ABANDONED_CART_2', 'ABANDONED_CART_3'] },
      isActive: true,
    },
  });

  if (automations.length === 0) {
    logger.info('Razorpay webhook: no active abandoned cart automations — nothing queued');
    return;
  }

  for (const automation of automations) {
    const existing = await prisma.abandonedCartQueue.findFirst({
      where: { cartToken, automationId: automation.id },
    });
    if (existing) {
      logger.info(`Razorpay: ${cartToken} already queued for automation ${automation.id} — skipping`);
      continue;
    }

    const scheduledAt = new Date(abandonedAt.getTime() + automation.delayMinutes * 60 * 1000);

    await prisma.abandonedCartQueue.create({
      data: {
        cartToken,
        customerPhone,
        automationId: automation.id,
        cartData: body as Prisma.InputJsonValue,
        scheduledAt,
        abandonedAt,
      },
    });

    logger.info(
      `Razorpay: queued ${customerPhone} for ${automation.shopifyEvent} at ${scheduledAt.toISOString()}`,
    );
  }
}

export default router;
