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
  baseURL: `https://${env.SHOPIFY_STORE_URL}/admin/api/2024-01`,
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
