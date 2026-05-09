import { api } from '@/lib/api';
import { TemplateStatus } from '@/types/templates';
import type {
  Automation,
  AutomationLog,
  AutomationCategoryGroup,
  Template,
} from '@/types';

interface ApiResponse<T> {
  data: T;
}

interface PaginatedResponse<T> {
  data: T[];
  meta?: { total: number };
}

export interface CreateAutomationInput {
  name: string;
  categoryId: string;
  triggerType: 'SHOPIFY_EVENT' | 'BUTTON_REPLY';
  shopifyEvent?:
    | 'PREPAID_ORDER_CONFIRMED'
    | 'COD_ORDER_CONFIRMATION'
    | 'ORDER_FULFILLED'
    | 'ORDER_CANCELLED'
    | 'COD_ORDER_FOLLOW_UP'
    | 'ABANDONED_CART_1'
    | 'ABANDONED_CART_2'
    | 'ABANDONED_CART_3';
  buttonTriggerText?: string;
  templateId?: string;
  variableMapping: Record<string, string>;
  isActive: boolean;
  delayMinutes: number;
}

export async function fetchAutomationsApi(): Promise<AutomationCategoryGroup[]> {
  const res = await api.get<{ data: AutomationCategoryGroup[] }>('/automations');
  return res.data.data;
}

export async function fetchApprovedTemplatesApi(): Promise<Template[]> {
  const res = await api.get<PaginatedResponse<Template>>('/templates', {
    params: { status: TemplateStatus.APPROVED, limit: 100 },
  });
  return res.data.data;
}

export async function createAutomationApi(input: CreateAutomationInput): Promise<Automation> {
  const res = await api.post<ApiResponse<Automation>>('/automations', input);
  return res.data.data;
}

export async function updateAutomationApi(
  id: string,
  input: Partial<CreateAutomationInput>,
): Promise<Automation> {
  const res = await api.put<ApiResponse<Automation>>(`/automations/${id}`, input);
  return res.data.data;
}

export async function deleteAutomationApi(id: string): Promise<string> {
  await api.delete(`/automations/${id}`);
  return id;
}

export async function toggleAutomationApi(id: string): Promise<Automation> {
  const res = await api.patch<ApiResponse<Automation>>(`/automations/${id}/toggle`);
  return res.data.data;
}

export async function fetchAutomationLogsApi(
  automationId: string,
  page = 1,
): Promise<{ items: AutomationLog[]; meta: Record<string, unknown> }> {
  const res = await api.get<{
    data: AutomationLog[];
    meta: Record<string, unknown>;
  }>(`/automations/${automationId}/logs`, { params: { page, limit: 20 } });
  return { items: res.data.data, meta: res.data.meta };
}
