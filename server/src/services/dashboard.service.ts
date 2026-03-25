import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';

export interface DashboardStats {
  messagesSent: number;
  messagesDelivered: number;
  messagesRead: number;
  automationsRun: number;
  automationsFailed: number;
  activeConversations: number;
  totalCustomers: number;
  templatesApproved: number;
  deliveryRate: number;
}

export interface ActivityItem {
  id: string;
  type: 'message_sent' | 'message_received' | 'automation_triggered' | 'automation_failed';
  description: string;
  customerName?: string;
  customerPhone?: string;
  timestamp: string;
}

export const getStats = async (): Promise<DashboardStats> => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  try {
    const [
      messagesSent,
      messagesDelivered,
      messagesRead,
      automationsRun,
      automationsFailed,
      activeConversations,
      totalCustomers,
      templatesApproved,
    ] = await Promise.all([
      prisma.message.count({
        where: { direction: 'OUTBOUND', createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.message.count({
        where: {
          direction: 'OUTBOUND',
          status: { in: ['DELIVERED', 'READ'] },
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.message.count({
        where: { direction: 'OUTBOUND', status: 'READ', createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.automationLog.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.automationLog.count({
        where: { status: 'FAILED', createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.conversation.count({ where: { lastMessageAt: { gte: sevenDaysAgo } } }),
      prisma.customer.count(),
      prisma.template.count({ where: { status: 'APPROVED' } }),
    ]);

    const deliveryRate =
      messagesSent > 0 ? Math.round((messagesDelivered / messagesSent) * 100) : 0;

    return {
      messagesSent,
      messagesDelivered,
      messagesRead,
      automationsRun,
      automationsFailed,
      activeConversations,
      totalCustomers,
      templatesApproved,
      deliveryRate,
    };
  } catch (err) {
    logger.error('Dashboard getStats failed:', err);
    throw err;
  }
};

export const getRecentActivity = async (limit = 20): Promise<ActivityItem[]> => {
  try {
    const [outboundMessages, inboundMessages, automationLogs] = await Promise.all([
      prisma.message.findMany({
        where: { direction: 'OUTBOUND' },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          conversation: {
            include: { customer: true },
          },
        },
      }),
      prisma.message.findMany({
        where: { direction: 'INBOUND' },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          conversation: {
            include: { customer: true },
          },
        },
      }),
      prisma.automationLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { automation: true },
      }),
    ]);

    const items: ActivityItem[] = [];

    for (const msg of outboundMessages) {
      const customer = msg.conversation.customer;
      const displayName = customer.name ?? customer.phone;
      items.push({
        id: `msg-out-${msg.id}`,
        type: 'message_sent',
        description: `Sent message to ${displayName}`,
        customerName: customer.name ?? undefined,
        customerPhone: customer.phone,
        timestamp: msg.createdAt.toISOString(),
      });
    }

    for (const msg of inboundMessages) {
      const customer = msg.conversation.customer;
      const displayName = customer.name ?? customer.phone;
      items.push({
        id: `msg-in-${msg.id}`,
        type: 'message_received',
        description: `Received message from ${displayName}`,
        customerName: customer.name ?? undefined,
        customerPhone: customer.phone,
        timestamp: msg.createdAt.toISOString(),
      });
    }

    for (const log of automationLogs) {
      const isFailed = log.status === 'FAILED';
      items.push({
        id: `log-${log.id}`,
        type: isFailed ? 'automation_failed' : 'automation_triggered',
        description: isFailed
          ? `Automation '${log.automation.name}' failed for ${log.customerPhone}`
          : `Automation '${log.automation.name}' triggered for ${log.customerPhone}`,
        customerPhone: log.customerPhone,
        timestamp: log.createdAt.toISOString(),
      });
    }

    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return items.slice(0, limit);
  } catch (err) {
    logger.error('Dashboard getRecentActivity failed:', err);
    throw err;
  }
};
