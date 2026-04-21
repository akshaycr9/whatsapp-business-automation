import type { ShopifyEvent } from '@/types';

export interface V2ParameterMapping {
  label: string;
  shopifyPath: string;
}

export interface V2Flow {
  id: string;
  name: string;
  active: boolean;
  templateId: string | null;
  templateName: string;
  timing: string;
  parameterMapping: V2ParameterMapping[];
  variableMapping: Record<string, string>;
  messagePreview: string;
  shopifyEvent?: ShopifyEvent;
  delayMinutes?: number;
}

export interface V2FlowCategory {
  id: string;
  label: string;
  icon: 'shopping_cart' | 'payments' | 'shopping_basket';
  pageTitle: string;
  description: string;
  flows: V2Flow[];
}
