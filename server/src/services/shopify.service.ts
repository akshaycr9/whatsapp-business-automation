import axios from 'axios';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';

export interface ShopifyCustomer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  city: string | null;
  tags: string;
  orders_count: number;
  total_spent: string;
}

const shopifyApi = axios.create({
  baseURL: `https://${env.SHOPIFY_STORE_URL}/admin/api/2025-01`,
  headers: {
    'X-Shopify-Access-Token': env.SHOPIFY_ACCESS_TOKEN,
    'Content-Type': 'application/json',
  },
});

/**
 * Parse the `Link` header from Shopify's paginated responses.
 * Returns the page_info cursor for the "next" rel, if present.
 */
function parseNextPageInfo(linkHeader: string | undefined): string | undefined {
  if (!linkHeader) return undefined;

  // Link header format: <url>; rel="next", <url>; rel="previous"
  const parts = linkHeader.split(',');
  for (const part of parts) {
    const [urlPart, relPart] = part.trim().split(';');
    if (relPart?.trim() === 'rel="next"') {
      const match = urlPart?.trim().match(/[?&]page_info=([^>&]+)/);
      if (match?.[1]) return match[1];
    }
  }
  return undefined;
}

export const getCustomers = async (
  options: { limit?: number; page_info?: string } = {},
): Promise<{ customers: ShopifyCustomer[]; nextPageInfo?: string }> => {
  const params: Record<string, string | number> = {
    limit: options.limit ?? 250,
  };
  if (options.page_info) {
    params['page_info'] = options.page_info;
  }

  const response = await shopifyApi.get<{ customers: ShopifyCustomer[] }>(
    '/customers.json',
    { params },
  );

  const nextPageInfo = parseNextPageInfo(
    response.headers['link'] as string | undefined,
  );

  logger.info(`Shopify: fetched ${response.data.customers.length} customers`);

  return {
    customers: response.data.customers,
    nextPageInfo,
  };
};

export const getCustomer = async (shopifyId: string): Promise<ShopifyCustomer> => {
  const response = await shopifyApi.get<{ customer: ShopifyCustomer }>(
    `/customers/${shopifyId}.json`,
  );
  return response.data.customer;
};

// ── Webhook registration ───────────────────────────────────────────────────

interface ShopifyWebhookRecord {
  id: number;
  topic: string;
  address: string;
}

interface ShopifyWebhooksListResponse {
  webhooks: ShopifyWebhookRecord[];
}

const REQUIRED_TOPICS = [
  'orders/create',       // new order placed — triggers PREPAID or COD confirmation
  'orders/fulfilled',    // order fully shipped — triggers ORDER_FULFILLED
  'orders/paid',         // payment collected (COD orders going from pending → paid)
  'checkouts/create',    // new checkout — start abandoned cart tracking
  'checkouts/update',    // checkout updated — keep tracker in sync
] as const;

/**
 * Idempotently registers (or updates) all required Shopify webhook subscriptions
 * so they point to `${publicUrl}/api/webhooks/shopify`.
 *
 * Safe to call on every server startup — existing webhooks pointing to the
 * correct URL are left untouched; outdated URLs are updated in-place.
 */
export const registerWebhooks = async (publicUrl: string): Promise<void> => {
  const webhookAddress = `${publicUrl}/api/webhooks/shopify`;

  logger.info(`Shopify webhook registration: token prefix = ${env.SHOPIFY_ACCESS_TOKEN.slice(0, 8)}…`);
  logger.info(`Shopify webhook registration: store = ${env.SHOPIFY_STORE_URL}`);
  logger.info(`Shopify webhook registration: target address = ${webhookAddress}`);

  let listResponse;
  try {
    listResponse = await shopifyApi.get<ShopifyWebhooksListResponse>('/webhooks.json');
  } catch (err: unknown) {
    // Surface the Shopify error body so it's easy to diagnose token/scope issues
    if (err && typeof err === 'object' && 'response' in err) {
      const axiosErr = err as { response?: { status?: number; data?: unknown } };
      logger.error(
        `Shopify GET /webhooks.json failed — HTTP ${axiosErr.response?.status ?? '?'}:`,
        axiosErr.response?.data,
      );
    }
    throw err;
  }
  const existing = listResponse.data.webhooks;

  for (const topic of REQUIRED_TOPICS) {
    const existingHook = existing.find((h) => h.topic === topic);

    if (existingHook) {
      if (existingHook.address === webhookAddress) {
        logger.info(`✓ Shopify webhook already up-to-date: ${topic}`);
      } else {
        // URL changed (e.g. new ngrok domain) — update in-place
        await shopifyApi.put(`/webhooks/${existingHook.id}.json`, {
          webhook: { id: existingHook.id, address: webhookAddress },
        });
        logger.info(`↑ Shopify webhook updated: ${topic} → ${webhookAddress}`);
      }
    } else {
      await shopifyApi.post('/webhooks.json', {
        webhook: { topic, address: webhookAddress, format: 'json' },
      });
      logger.info(`+ Shopify webhook registered: ${topic} → ${webhookAddress}`);
    }
  }

  logger.info('Shopify webhook registration complete ✅');
};
