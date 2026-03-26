import { Router } from 'express';
import { type Prisma } from '@prisma/client';
import { verifyShopifyHmac } from '../../middleware/shopify-hmac.js';
import { logger } from '../../lib/logger.js';
import { prisma } from '../../lib/prisma.js';
import { normalizePhone } from '../../utils/phone.js';
import { triggerForEvent } from '../../services/automation.service.js';

const router = Router();

// In-memory dedup set — prevents duplicate processing when Shopify retries the same
// webhook (identified by X-Shopify-Webhook-Id). Sufficient for a single-process server.
const processedWebhookIds = new Set<string>();

// Apply HMAC verification to all Shopify webhook routes
router.use(verifyShopifyHmac);

router.post('/', (req, res) => {
  // Respond immediately — Shopify requires a response within 5 seconds
  res.sendStatus(200);

  const topic = req.headers['x-shopify-topic'] as string | undefined;
  const webhookId = req.headers['x-shopify-webhook-id'] as string | undefined;
  const body = req.body as Record<string, unknown>;

  if (!topic) {
    logger.warn('Shopify webhook: missing topic header');
    return;
  }

  processShopifyWebhook(topic, webhookId, body).catch((err: unknown) => {
    logger.error(`Shopify webhook processing error [${topic}]:`, err);
  });
});

async function processShopifyWebhook(
  topic: string,
  webhookId: string | undefined,
  body: Record<string, unknown>,
): Promise<void> {
  // Idempotency — skip if we've already processed this webhook ID in this process lifetime
  if (webhookId) {
    if (processedWebhookIds.has(webhookId)) {
      logger.info(`Shopify webhook duplicate skipped: ${webhookId} [${topic}]`);
      return;
    }
    processedWebhookIds.add(webhookId);
  }

  logger.info(`Shopify webhook: ${topic}`, { webhookId });

  switch (topic) {
    case 'orders/create':
    // orders/updated fires when financial_status changes (e.g. COD → paid).
    // handleOrderCreate() reads financial_status and triggers the correct automation.
    case 'orders/updated':
      await handleOrderCreate(body);
      break;
    case 'fulfillments/create':
      await handleFulfillmentCreate(body);
      break;
    case 'checkouts/create':
      await handleCheckoutCreate(body);
      break;
    default:
      logger.info(`Shopify webhook: unhandled topic ${topic}`);
  }
}

async function handleOrderCreate(body: Record<string, unknown>): Promise<void> {
  const orderId = String(body['id'] ?? '');
  const financialStatus = body['financial_status'] as string | undefined;
  const customer = body['customer'] as Record<string, unknown> | undefined;
  const phone = customer?.['phone'] as string | null | undefined;

  logger.info(`Order created: ${orderId}, status: ${financialStatus}`);

  if (phone) {
    const normalizedPhone = normalizePhone(phone);
    // Mark any open checkout trackers for this phone as converted
    await prisma.checkoutTracker.updateMany({
      where: { customerPhone: normalizedPhone, orderCreated: false },
      data: { orderCreated: true },
    });

    const event =
      financialStatus === 'paid' ? 'PREPAID_ORDER_CONFIRMED' : 'COD_ORDER_CONFIRMED';
    await triggerForEvent(event, body, normalizedPhone);
  }
}

async function handleFulfillmentCreate(body: Record<string, unknown>): Promise<void> {
  const fulfillmentId = String(body['id'] ?? '');
  logger.info(`Fulfillment created: ${fulfillmentId}`);

  const destination = body['destination'] as Record<string, unknown> | undefined;
  const fulfillmentPhone = destination?.['phone'] as string | null | undefined;

  if (fulfillmentPhone) {
    await triggerForEvent('ORDER_FULFILLED', body, normalizePhone(fulfillmentPhone));
  }
}

async function handleCheckoutCreate(body: Record<string, unknown>): Promise<void> {
  const checkoutId = String(body['id'] ?? '');
  const phone = body['phone'] as string | null | undefined;
  const email = body['email'] as string | null | undefined;

  if (!checkoutId) return;

  const customerPhone = phone ? normalizePhone(phone) : null;

  const checkoutDataJson = body as Prisma.InputJsonValue;

  await prisma.checkoutTracker.upsert({
    where: { shopifyCheckoutId: checkoutId },
    create: {
      shopifyCheckoutId: checkoutId,
      customerPhone,
      customerEmail: email ?? null,
      checkoutData: checkoutDataJson,
      orderCreated: false,
      abandonedNotified: false,
    },
    update: {
      customerPhone,
      customerEmail: email ?? null,
      checkoutData: checkoutDataJson,
    },
  });

  logger.info(`CheckoutTracker upserted: ${checkoutId}`);
}

export default router;
