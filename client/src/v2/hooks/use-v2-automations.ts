/**
 * useV2Automations
 *
 * Fetches the 9 fixed automation flows from the Redux store (backed by the API),
 * groups them into the 3 V2FlowCategory buckets, and exposes stable toggle /
 * updateFlow handlers.
 *
 * Category assignment and display metadata are derived entirely on the client via
 * SHOPIFY_FLOW_CONFIG and BUTTON_FLOW_CONFIG lookup maps — no extra DB columns needed.
 */
import { useEffect, useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  fetchAllFlows,
  fetchV2ApprovedTemplates,
  toggleV2Flow,
  updateV2Flow,
  selectV2Flows,
  selectV2ApprovedTemplates,
  selectV2FlowsStatus,
  selectV2FlowsError,
} from '@/v2/features/automationsSlice';
import { extractBodyText, detectVariables, extractUrlButtonVars } from '@/lib/automation-utils';
import type { Automation, ShopifyEvent, Template } from '@/types';
import type { V2Flow, V2FlowCategory, V2ParameterMapping } from '@/v2/types';

// ─── Config maps ───────────────────────────────────────────────────────────────

interface ShopifyFlowMeta {
  categoryId: string;
  displayName: string;
  timing: string;
}

const SHOPIFY_FLOW_CONFIG: Record<ShopifyEvent, ShopifyFlowMeta> = {
  PREPAID_ORDER_CONFIRMED:  { categoryId: 'order-flow',     displayName: 'Order Confirmed',        timing: 'Immediate'  },
  ORDER_CANCELLED:          { categoryId: 'order-flow',     displayName: 'Order Cancelled',        timing: 'Immediate'  },
  ORDER_FULFILLED:          { categoryId: 'order-flow',     displayName: 'Order Fulfilled',        timing: 'Immediate'  },
  COD_ORDER_CONFIRMED:      { categoryId: 'cod-flow',       displayName: 'COD Order Confirmation', timing: 'Immediate'  },
  COD_ORDER_FOLLOW_UP:      { categoryId: 'cod-flow',       displayName: 'COD Order Follow Up',    timing: '30 minutes' },
  ABANDONED_CART_1: { categoryId: 'abandoned-cart', displayName: 'Abandoned Cart 1', timing: '1 hour'  },
  ABANDONED_CART_2: { categoryId: 'abandoned-cart', displayName: 'Abandoned Cart 2', timing: '6 hours' },
  ABANDONED_CART_3: { categoryId: 'abandoned-cart', displayName: 'Abandoned Cart 3', timing: '24 hours' },
};

interface ButtonFlowMeta {
  categoryId: string;
  displayName: string;
}

const BUTTON_FLOW_CONFIG: Record<string, ButtonFlowMeta> = {
  'Confirm My Order': { categoryId: 'cod-flow', displayName: 'COD Order Confirm' },
  'Cancel My Order':  { categoryId: 'cod-flow', displayName: 'COD Order Cancel'  },
};

// ─── Category skeleton (structure without flows) ───────────────────────────────

const CATEGORY_SHELLS: Omit<V2FlowCategory, 'flows'>[] = [
  {
    id: 'order-flow',
    label: 'Order Flow',
    icon: 'shopping_cart',
    pageTitle: 'Order Flow Management',
    description: 'Configure and monitor your automated messaging flows for prepaid order updates.',
  },
  {
    id: 'cod-flow',
    label: 'COD Flow',
    icon: 'payments',
    pageTitle: 'COD Flow Management',
    description:
      'Configure and monitor your automated messaging flows for cash on delivery order updates.',
  },
  {
    id: 'abandoned-cart',
    label: 'Abandoned Cart',
    icon: 'shopping_basket',
    pageTitle: 'Abandoned Cart Management',
    description: 'Configure and monitor your automated messaging flows for cart recovery.',
  },
];

// ─── Conversion helpers ─────────────────────────────────────────────────────────

function minutesToTimingLabel(minutes: number): string {
  if (minutes === 1)    return '1 minute (test)';
  if (minutes === 30)   return '30 minutes';
  if (minutes === 60)   return '1 hour';
  if (minutes === 180)  return '3 hours';
  if (minutes === 300)  return '5 hours';
  if (minutes === 360)  return '6 hours';
  if (minutes === 720)  return '12 hours';
  if (minutes === 1440) return '24 hours';
  return 'Immediate';
}

function automationToV2Flow(automation: Automation): V2Flow | null {
  let categoryId: string;
  let displayName: string;
  let timing: string;

  if (automation.triggerType === 'SHOPIFY_EVENT' && automation.shopifyEvent) {
    const meta = SHOPIFY_FLOW_CONFIG[automation.shopifyEvent];
    if (!meta) return null; // unknown event — skip
    categoryId = meta.categoryId;
    displayName = meta.displayName;
    const useDynamicTiming =
      automation.shopifyEvent === 'COD_ORDER_FOLLOW_UP' ||
      automation.shopifyEvent === 'ABANDONED_CART_1' ||
      automation.shopifyEvent === 'ABANDONED_CART_2' ||
      automation.shopifyEvent === 'ABANDONED_CART_3';
    timing = useDynamicTiming ? minutesToTimingLabel(automation.delayMinutes) : meta.timing;
  } else if (automation.triggerType === 'BUTTON_REPLY' && automation.buttonTriggerText) {
    const meta = BUTTON_FLOW_CONFIG[automation.buttonTriggerText];
    if (!meta) return null; // unknown button text — skip
    categoryId = meta.categoryId;
    displayName = meta.displayName;
    timing = 'Immediate';
  } else {
    return null;
  }

  // Derive parameter mapping from template variables + existing variableMapping
  const bodyText = extractBodyText(automation.template.components);
  const bodyVars = detectVariables(bodyText);
  const urlVars = extractUrlButtonVars(automation.template.components);

  const parameterMapping: V2ParameterMapping[] = [
    ...bodyVars.map((v) => ({
      label: `{{${v}}}`,
      shopifyPath: automation.variableMapping[v] ?? '',
    })),
    ...urlVars.map((uv) => ({
      label: `{{${uv.varPos}}} (${uv.buttonLabel})`,
      shopifyPath: automation.variableMapping[uv.key] ?? '',
    })),
  ];

  return {
    id: automation.id,
    name: displayName,
    active: automation.isActive,
    templateId: automation.templateId,
    templateName: automation.template.name,
    timing,
    parameterMapping,
    variableMapping: automation.variableMapping,
    messagePreview: bodyText,
    shopifyEvent: automation.triggerType === 'SHOPIFY_EVENT' ? automation.shopifyEvent ?? undefined : undefined,
    delayMinutes: automation.delayMinutes,
  };
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export interface UseV2AutomationsReturn {
  flowCategories: V2FlowCategory[];
  approvedTemplates: Template[];
  loading: boolean;
  error: string | null;
  toggle: (flowId: string) => void;
  updateFlow: (
    flowId: string,
    templateId: string,
    variableMapping: Record<string, string>,
    delayMinutes?: number,
  ) => Promise<void>;
}

export function useV2Automations(): UseV2AutomationsReturn {
  const dispatch = useAppDispatch();
  const flows = useAppSelector(selectV2Flows);
  const approvedTemplates = useAppSelector(selectV2ApprovedTemplates);
  const status = useAppSelector(selectV2FlowsStatus);
  const error = useAppSelector(selectV2FlowsError);

  // Initial fetch — runs once per mount, idempotent if already succeeded
  useEffect(() => {
    if (status === 'idle') {
      void dispatch(fetchAllFlows());
      void dispatch(fetchV2ApprovedTemplates());
    }
  }, [dispatch, status]);

  // Group real Automation records into V2FlowCategory[]
  const flowCategories = useMemo<V2FlowCategory[]>(() => {
    const buckets = new Map<string, V2Flow[]>(
      CATEGORY_SHELLS.map((c) => [c.id, []]),
    );

    for (const automation of flows) {
      const v2Flow = automationToV2Flow(automation);
      if (!v2Flow) continue;
      const categoryId =
        automation.triggerType === 'SHOPIFY_EVENT' && automation.shopifyEvent
          ? SHOPIFY_FLOW_CONFIG[automation.shopifyEvent]?.categoryId
          : automation.buttonTriggerText
            ? BUTTON_FLOW_CONFIG[automation.buttonTriggerText]?.categoryId
            : undefined;
      if (!categoryId) continue;
      buckets.get(categoryId)?.push(v2Flow);
    }

    return CATEGORY_SHELLS.map((shell) => ({
      ...shell,
      flows: buckets.get(shell.id) ?? [],
    }));
  }, [flows]);

  const toggle = useCallback(
    (flowId: string) => {
      void dispatch(toggleV2Flow(flowId));
    },
    [dispatch],
  );

  const updateFlow = useCallback(
    async (flowId: string, templateId: string, variableMapping: Record<string, string>, delayMinutes?: number) => {
      await dispatch(updateV2Flow({ id: flowId, templateId, variableMapping, delayMinutes })).unwrap();
    },
    [dispatch],
  );

  return {
    flowCategories,
    approvedTemplates,
    loading: status === 'loading',
    error,
    toggle,
    updateFlow,
  };
}
