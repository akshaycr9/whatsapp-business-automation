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
  type:
    | 'template_created'
    | 'template_updated'
    | 'template_approved'
    | 'template_rejected'
    | 'template_deleted'
    | 'automation_created'
    | 'automation_updated'
    | 'automation_enabled'
    | 'automation_disabled'
    | 'automation_deleted';
  description: string;
  entityName: string;
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
    const logs = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return logs.map((log) => ({
      id: log.id,
      type: log.type.toLowerCase() as ActivityItem['type'],
      description: log.description,
      entityName: log.entityName,
      timestamp: log.createdAt.toISOString(),
    }));
  } catch (err) {
    logger.error('Dashboard getRecentActivity failed:', err);
    throw err;
  }
};
