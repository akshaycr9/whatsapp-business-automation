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

export type ActivityType =
  | 'message_sent'
  | 'message_received'
  | 'automation_triggered'
  | 'automation_failed';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  description: string;
  customerName?: string;
  customerPhone?: string;
  timestamp: string;
}
