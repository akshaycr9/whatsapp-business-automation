// ── Customer ─────────────────────────────────────────────────
export interface Customer {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  city: string | null;
  tags: string[];
  source: 'SHOPIFY' | 'MANUAL';
  shopifyId: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Conversation ─────────────────────────────────────────────
export type ConversationCategory = 'requesting' | 'intervened' | 'chats';

export interface Conversation {
  id: string;
  customerId: string;
  customer: Customer;
  lastMessageAt: string | null;
  lastMessageText: string | null;
  lastInboundMessageAt: string | null;
  lastOutboundMessageAt: string | null;
  unreadCount: number;
  category?: ConversationCategory;
  createdAt: string;
  updatedAt: string;
}

// ── Message ──────────────────────────────────────────────────
export type MessageDirection = 'INBOUND' | 'OUTBOUND';
export type MessageType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'TEMPLATE' | 'INTERACTIVE';
export type MessageStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';

export interface Reaction {
  id: string;
  messageId: string;
  senderPhone: string;
  emoji: string;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  waMessageId: string | null;
  direction: MessageDirection;
  type: MessageType;
  body: string | null;
  mediaId: string | null;
  mediaMimeType: string | null;
  caption: string | null;
  status: MessageStatus;
  statusUpdatedAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  reactions: Reaction[];
}

// ── Template ─────────────────────────────────────────────────
export { TemplateStatus, TEMPLATE_TABLE_COLUMNS, type StatusConfig, type TemplateTableColumn } from './templates';
export type TemplateCategory = 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';

export interface Template {
  id: string;
  name: string;
  language: string;
  category: TemplateCategory;
  status: TemplateStatus;
  components: unknown;
  rejectedReason: string | null;
  metaTemplateId: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Automation ───────────────────────────────────────────────
export type AutomationTrigger = 'SHOPIFY_EVENT' | 'BUTTON_REPLY';

export type ShopifyEvent =
  | 'PREPAID_ORDER_CONFIRMED'
  | 'COD_ORDER_CONFIRMATION'
  | 'ORDER_FULFILLED'
  | 'ORDER_CANCELLED'
  | 'COD_ORDER_FOLLOW_UP'
  | 'ABANDONED_CART_1'
  | 'ABANDONED_CART_2'
  | 'ABANDONED_CART_3';

export type AutomationTriggerType = 'SHOPIFY_EVENT' | 'BUTTON_REPLY';

export interface Automation {
  id: string;
  name: string;
  categoryId: string;
  triggerType: AutomationTriggerType;
  shopifyEvent: ShopifyEvent | null;
  buttonTriggerText: string | null;
  templateId: string | null;
  template: Template | null;
  variableMapping: Record<string, string>;
  isActive: boolean;
  delayMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationCategoryGroup {
  categoryId: string;
  categoryName: string;
  automations: Automation[];
}

// ── AutomationLog ────────────────────────────────────────────
export type AutomationLogStatus = 'PENDING' | 'SENT' | 'FAILED';

export interface AutomationLog {
  id: string;
  automationId: string;
  customerPhone: string;
  shopifyData: unknown;
  status: AutomationLogStatus;
  errorMessage: string | null;
  waMessageId: string | null;
  createdAt: string;
}

// ── API Responses ────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ── Socket Events ─────────────────────────────────────────────
export interface NewMessageEvent {
  conversationId: string;
  message: Message;
}

export interface MessageStatusUpdateEvent {
  messageId: string;
  status: MessageStatus;
  /** ISO timestamp strings keyed by 'deliveredAt' or 'readAt' */
  timestamps?: Record<string, string>;
}

export interface ConversationUpdatedEvent {
  conversation: Conversation;
  category: ConversationCategory;
}

export interface MessageReactionEvent {
  messageId: string;
  reactions: Reaction[];
}
