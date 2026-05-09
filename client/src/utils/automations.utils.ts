import type { Automation } from '@/types';

export type TriggerIconKey = 'cart' | 'package' | 'truck' | 'cash';

export interface TriggerInfo {
  label: string;
  icon: TriggerIconKey;
}

const EVENT_TRIGGER_MAP: Record<string, TriggerInfo> = {
  PREPAID_ORDER_CONFIRMED: { label: 'Order placed',     icon: 'package' },
  ORDER_CANCELLED:         { label: 'Order cancelled',  icon: 'package' },
  ORDER_FULFILLED:         { label: 'Order shipped',    icon: 'truck'   },
  COD_ORDER_CONFIRMATION:  { label: 'COD order placed', icon: 'cash'    },
  COD_ORDER_FOLLOW_UP:     { label: 'COD unconfirmed',  icon: 'cash'    },
  ABANDONED_CART_1:        { label: 'Abandoned cart',   icon: 'cart'    },
  ABANDONED_CART_2:        { label: 'Abandoned cart',   icon: 'cart'    },
  ABANDONED_CART_3:        { label: 'Abandoned cart',   icon: 'cart'    },
};

export function getTriggerInfo(automation: Automation): TriggerInfo {
  if (automation.triggerType === 'SHOPIFY_EVENT') {
    return (
      EVENT_TRIGGER_MAP[automation.shopifyEvent ?? ''] ?? {
        label: automation.name,
        icon: 'package',
      }
    );
  }
  return { label: automation.buttonTriggerText ?? 'Button reply', icon: 'cash' };
}

export function getDelayDisplay(delayMinutes: number): string {
  if (delayMinutes === 0) return 'Immediate';
  if (delayMinutes < 60) return `${delayMinutes}m`;
  if (delayMinutes === 60) return '1h';
  if (delayMinutes < 1440) return `${Math.floor(delayMinutes / 60)}h`;
  return `${Math.floor(delayMinutes / 1440)}d`;
}
