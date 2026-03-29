import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { notFound } from '../lib/app-error.js';
import { logger } from '../lib/logger.js';

export type ConversationWithCustomer = Prisma.ConversationGetPayload<{
  include: { customer: true; messages: { take: 1 } };
}>;

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
  items: ConversationWithCustomer[];
  meta: ListMeta;
}

interface MessagesCursorMeta {
  cursor?: string;
  hasMore: boolean;
}

type MessageWithReactions = Prisma.MessageGetPayload<{
  include: { reactions: true };
}>;

interface MessagesResult {
  items: MessageWithReactions[];
  meta: MessagesCursorMeta;
}

export const list = async (params: ListParams): Promise<ListResult> => {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const skip = (page - 1) * limit;

  const where: Prisma.ConversationWhereInput = params.search
    ? {
        customer: {
          OR: [
            { name: { contains: params.search, mode: 'insensitive' } },
            { phone: { contains: params.search, mode: 'insensitive' } },
          ],
        },
      }
    : {};

  const [total, items] = await Promise.all([
    prisma.conversation.count({ where }),
    prisma.conversation.findMany({
      where,
      include: {
        customer: true,
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { lastMessageAt: 'desc' },
      skip,
      take: limit,
    }),
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

export const getById = async (id: string): Promise<ConversationWithCustomer> => {
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      customer: true,
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });
  if (!conversation) throw notFound('Conversation');
  return conversation;
};

export const getMessages = async (
  conversationId: string,
  params: { cursor?: string; limit?: number },
): Promise<MessagesResult> => {
  const limit = params.limit ?? 50;

  const where: Prisma.MessageWhereInput = { conversationId };
  if (params.cursor) {
    where.createdAt = { lt: new Date(params.cursor) };
  }

  const rows = await prisma.message.findMany({
    where,
    include: { reactions: true },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
  });

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const lastItem = items[items.length - 1];
  const cursor = lastItem ? lastItem.createdAt.toISOString() : undefined;

  return { items, meta: { cursor, hasMore } };
};

export const findOrCreateForCustomer = async (
  customerPhone: string,
): Promise<{ conversationId: string; customerId: string }> => {
  const customer = await prisma.customer.findUnique({ where: { phone: customerPhone } });
  if (!customer) throw notFound('Customer');

  const conversation = await prisma.conversation.upsert({
    where: { customerId: customer.id },
    create: { customerId: customer.id },
    update: {},
  });

  return { conversationId: conversation.id, customerId: customer.id };
};

export const markRead = async (id: string): Promise<void> => {
  await prisma.conversation.update({
    where: { id },
    data: { unreadCount: 0 },
  });
  logger.info(`Conversation ${id} marked as read`);
};

export const isWithin24HourWindow = async (conversationId: string): Promise<boolean> => {
  const lastInbound = await prisma.message.findFirst({
    where: { conversationId, direction: 'INBOUND' },
    orderBy: { createdAt: 'desc' },
  });

  if (!lastInbound) return false;

  const windowMs = 24 * 60 * 60 * 1000;
  return Date.now() - lastInbound.createdAt.getTime() < windowMs;
};
