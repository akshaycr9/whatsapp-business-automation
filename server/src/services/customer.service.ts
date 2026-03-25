import { type Customer } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { AppError, notFound, duplicate, badRequest } from '../lib/app-error.js';
import { logger } from '../lib/logger.js';
import { normalizePhone, isValidPhone } from '../utils/phone.js';
import * as shopifyService from './shopify.service.js';

interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
}

interface ListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ListResult {
  items: Customer[];
  meta: ListMeta;
}

interface CreateCustomerData {
  phone: string;
  name?: string;
  email?: string;
  city?: string;
  tags?: string[];
}

interface UpdateCustomerData {
  name?: string;
  email?: string;
  city?: string;
  tags?: string[];
}

interface SyncResult {
  created: number;
  updated: number;
  skipped: number;
}

export const list = async (params: ListParams): Promise<ListResult> => {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(100, Math.max(1, params.limit ?? 20));
  const skip = (page - 1) * limit;

  const where = params.search
    ? {
        OR: [
          { name: { contains: params.search, mode: 'insensitive' as const } },
          { phone: { contains: params.search, mode: 'insensitive' as const } },
          { email: { contains: params.search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.customer.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.customer.count({ where }),
  ]);

  return {
    items,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getById = async (id: string): Promise<Customer> => {
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) throw notFound('Customer');
  return customer;
};

export const create = async (data: CreateCustomerData): Promise<Customer> => {
  const phone = normalizePhone(data.phone);
  if (!isValidPhone(phone)) {
    throw badRequest('Invalid phone number — must be 10–15 digits in E.164 format');
  }

  try {
    const customer = await prisma.customer.create({
      data: {
        phone,
        name: data.name,
        email: data.email,
        city: data.city,
        tags: data.tags ?? [],
        source: 'MANUAL',
      },
    });
    logger.info(`Customer created: ${customer.id}`);
    return customer;
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      'code' in err &&
      (err as { code: string }).code === 'P2002'
    ) {
      throw duplicate('Customer');
    }
    throw err;
  }
};

export const update = async (id: string, data: UpdateCustomerData): Promise<Customer> => {
  await getById(id);

  const customer = await prisma.customer.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.city !== undefined && { city: data.city }),
      ...(data.tags !== undefined && { tags: data.tags }),
    },
  });

  logger.info(`Customer updated: ${customer.id}`);
  return customer;
};

export const remove = async (id: string): Promise<void> => {
  await getById(id);
  await prisma.customer.delete({ where: { id } });
  logger.info(`Customer deleted: ${id}`);
};

export const syncFromShopify = async (): Promise<SyncResult> => {
  let created = 0;
  let updated = 0;
  let skipped = 0;

  let nextPageInfo: string | undefined;

  do {
    const result = await shopifyService.getCustomers(
      nextPageInfo ? { page_info: nextPageInfo } : {},
    );

    for (const shopifyCustomer of result.customers) {
      const rawPhone = shopifyCustomer.phone;

      if (!rawPhone) {
        skipped++;
        continue;
      }

      const phone = normalizePhone(rawPhone);
      if (!isValidPhone(phone)) {
        logger.warn(`Shopify sync: skipping customer ${shopifyCustomer.id} — invalid phone: ${rawPhone}`);
        skipped++;
        continue;
      }

      const name = [shopifyCustomer.first_name, shopifyCustomer.last_name]
        .filter(Boolean)
        .join(' ') || undefined;

      const shopifyId = String(shopifyCustomer.id);

      try {
        const existing = await prisma.customer.findUnique({ where: { shopifyId } });

        if (existing) {
          await prisma.customer.update({
            where: { shopifyId },
            data: {
              phone,
              name,
              email: shopifyCustomer.email || undefined,
              city: shopifyCustomer.city ?? undefined,
              tags: shopifyCustomer.tags ? shopifyCustomer.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
            },
          });
          updated++;
        } else {
          await prisma.customer.upsert({
            where: { phone },
            create: {
              phone,
              name,
              email: shopifyCustomer.email || undefined,
              city: shopifyCustomer.city ?? undefined,
              tags: shopifyCustomer.tags ? shopifyCustomer.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
              source: 'SHOPIFY',
              shopifyId,
            },
            update: {
              name,
              email: shopifyCustomer.email || undefined,
              city: shopifyCustomer.city ?? undefined,
              tags: shopifyCustomer.tags ? shopifyCustomer.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
              shopifyId,
              source: 'SHOPIFY',
            },
          });
          created++;
        }
      } catch (err: unknown) {
        logger.error(`Shopify sync: failed to upsert customer ${shopifyCustomer.id}:`, err);
        skipped++;
      }
    }

    nextPageInfo = result.nextPageInfo;
  } while (nextPageInfo);

  logger.info(`Shopify sync complete — created: ${created}, updated: ${updated}, skipped: ${skipped}`);
  return { created, updated, skipped };
};

// Re-export AppError for use in routes if needed
export { AppError };
