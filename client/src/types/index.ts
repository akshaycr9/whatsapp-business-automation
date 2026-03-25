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
export interface Conversation {
  id: string;
  customerId: string;
  customer: Customer;
  lastMessageAt: string | null;
  lastMessageText: string | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

// ── Message ──────────────────────────────────────────────────
export type MessageDirection = 'INBOUND' | 'OUTBOUND';
export type MessageType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'TEMPLATE';
export type MessageStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';

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
  createdAt: string;
}

// ── Template ─────────────────────────────────────────────────
export type TemplateCategory = 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
export type TemplateStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

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
export type ShopifyEvent =
  | 'PREPAID_ORDER_CONFIRMED'
  | 'COD_ORDER_CONFIRMED'
  | 'ORDER_FULFILLED'
  | 'ABANDONED_CART';

export interface Automation {
  id: string;
  name: string;
  shopifyEvent: ShopifyEvent;
  templateId: string;
  template: Template;
  variableMapping: Record<string, string>;
  isActive: boolean;
  delayMinutes: number;
  createdAt: string;
  updatedAt: string;
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
}

export interface ConversationUpdatedEvent {
  conversation: Conversation;
}
