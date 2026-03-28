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

export interface ActivityItem {
  id: string;
  type: ActivityType;
  description: string;
  entityName: string;
  timestamp: string;
}
