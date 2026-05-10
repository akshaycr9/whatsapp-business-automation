import type { Automation, AutomationCategoryGroup, AutomationLog } from '@/types';

export const makeAutomation = (overrides: Partial<Automation> = {}): Automation => ({
  id: 'auto-001',
  name: 'Order Confirmed',
  categoryId: 'order-flow',
  triggerType: 'SHOPIFY_EVENT',
  shopifyEvent: 'PREPAID_ORDER_CONFIRMED',
  buttonTriggerText: null,
  templateId: 'temp-001',
  template: null,
  variableMapping: { '1': 'customer.first_name', '2': 'name' },
  isActive: true,
  delayMinutes: 0,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

export const makeAutomationCategory = (
  overrides: Partial<AutomationCategoryGroup> = {},
): AutomationCategoryGroup => ({
  categoryId: 'order-flow',
  categoryName: 'Order Flow',
  automations: [makeAutomation()],
  ...overrides,
});

export const makeAutomationLog = (overrides: Partial<AutomationLog> = {}): AutomationLog => ({
  id: 'log-001',
  automationId: 'auto-001',
  customerPhone: '919876543210',
  shopifyData: { orderId: 'order-123' },
  status: 'SENT',
  errorMessage: null,
  waMessageId: 'wa-msg-001',
  createdAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});
