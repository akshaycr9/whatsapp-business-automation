import { Router } from 'express';
import { type Prisma } from '@prisma/client';
import { verifyShopifyHmac } from '../../middleware/shopify-hmac.js';
import { logger } from '../../lib/logger.js';
import { prisma } from '../../lib/prisma.js';
import { normalizePhone, extractShopifyPhone } from '../../utils/phone.js';
import { triggerForEvent } from '../../services/automation.service.js';

const router = Router();

// In-memory dedup sets — survive only for the lifetime of the process, which is
// sufficient because we respond 200 immediately (Shopify won't retry on success).
//
// processedWebhookIds: guards against Shopify re-delivering the exact same webhook ID.
// processedOrderIds:   guards against the same order ID arriving via different webhook
//                      topics (secondary safety net — primary fix is not subscribing to
//                      both orders/create and orders/paid for the same handler).
const processedWebhookIds = new Set<string>();
const processedOrderIds = new Set<string>();

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
      await handleOrderCreate(body);
      break;

    // orders/paid is intentionally NOT subscribed — for prepaid orders Shopify fires
    // both orders/create and orders/paid, which caused duplicate WhatsApp messages.
    // orders/create alone handles prepaid (financial_status='paid') and COD
    // (financial_status='pending') without any duplication.

    // orders/fulfilled fires once when the entire order is marked fulfilled.
    // Payload is the full order object — customer phone is at customer.phone.
    case 'orders/fulfilled':
      await handleOrderFulfilled(body);
      break;

    case 'checkouts/create':
    // checkouts/update fires on cart changes — upsert keeps the tracker data fresh
    // so the abandoned-cart job works with the latest item/price info.
    case 'checkouts/update':
      await handleCheckoutUpsert(body);
      break;

    default:
      logger.info(`Shopify webhook: unhandled topic ${topic}`);
  }
}

async function handleOrderCreate(body: Record<string, unknown>): Promise<void> {
  const orderId = String(body['id'] ?? '');
  const financialStatus = body['financial_status'] as string | undefined;
  const phone = extractShopifyPhone(body);

  // Secondary dedup: skip if this order ID was already processed in this process lifetime.
  // Primary prevention is not subscribing to orders/paid, but this guards edge cases
  // where the same order might arrive via different webhook deliveries.
  if (processedOrderIds.has(orderId)) {
    logger.info(`Order ${orderId} already processed — skipping duplicate`);
    return;
  }
  processedOrderIds.add(orderId);

  logger.info(`Order created: ${orderId}, status: ${financialStatus}, phone: ${phone}`);

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

// Handles orders/fulfilled — payload is the full order object.
// Phone is extracted from shipping_address, billing_address, customer, or root body (in that order).
async function handleOrderFulfilled(body: Record<string, unknown>): Promise<void> {
  const orderId = String(body['id'] ?? '');
  logger.info(`Order fulfilled: ${orderId}`);

  const phone = extractShopifyPhone(body);

  if (phone) {
    await triggerForEvent('ORDER_FULFILLED', body, normalizePhone(phone));
  } else {
    logger.warn(`Order fulfilled ${orderId}: no phone found in any payload field, skipping automation`);
  }
}

// Handles both checkouts/create and checkouts/update — upserts the tracker
// so the abandoned-cart job always has the latest checkout data.
async function handleCheckoutUpsert(body: Record<string, unknown>): Promise<void> {
  const checkoutId = String(body['id'] ?? '');
  const phone = extractShopifyPhone(body);
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
