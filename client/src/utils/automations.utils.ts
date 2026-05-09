import React from 'react';
import type { Automation } from '@/types';
import { TemplateComponentType, TemplateComponentFormat } from '@/types';
import type { PhoneButton } from '@/components/templates/PhonePreview';

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

// ── Delay option constants ─────────────────────────────────────────────────────

export interface DelayOption {
  value: number;
  label: string;
}

export const COD_FOLLOW_UP_DELAY_OPTIONS: DelayOption[] = [
  { value: 1,   label: '1 minute (testing)' },
  { value: 60,  label: '1 hour after confirmation' },
  { value: 180, label: '3 hours after confirmation' },
  { value: 300, label: '5 hours after confirmation' },
];

const ABANDONED_CART_DELAY_OPTIONS_BASE: DelayOption[] = [
  { value: 30,   label: '30 minutes' },
  { value: 60,   label: '1 hour' },
  { value: 180,  label: '3 hours' },
  { value: 360,  label: '6 hours' },
  { value: 720,  label: '12 hours' },
  { value: 1440, label: '24 hours' },
];

export const ABANDONED_CART_DELAY_OPTIONS: DelayOption[] = import.meta.env.DEV
  ? [
      { value: 1, label: '1 minute (testing)' },
      { value: 5, label: '5 minutes (testing)' },
      ...ABANDONED_CART_DELAY_OPTIONS_BASE,
    ]
  : ABANDONED_CART_DELAY_OPTIONS_BASE;

// ── Template component helpers ────────────────────────────────────────────────

export function extractHeaderText(components: unknown): string {
  if (!Array.isArray(components)) return '';
  const header = (components as Array<{ type: string; format?: string; text?: string }>).find(
    (c) => c.type === TemplateComponentType.HEADER && c.format === TemplateComponentFormat.TEXT,
  );
  return header?.text ?? '';
}

export function extractFooterText(components: unknown): string {
  if (!Array.isArray(components)) return '';
  const footer = (components as Array<{ type: string; text?: string }>).find(
    (c) => c.type === TemplateComponentType.FOOTER,
  );
  return footer?.text ?? '';
}

export function extractPhoneButtons(components: unknown): PhoneButton[] {
  if (!Array.isArray(components)) return [];
  const buttonsComp = (
    components as Array<{ type: string; buttons?: Array<{ type: string; text: string }> }>
  ).find((c) => c.type === TemplateComponentType.BUTTONS);
  if (!buttonsComp?.buttons) return [];
  return buttonsComp.buttons
    .filter((b) => b.text?.trim())
    .map((b) => ({ type: b.type as PhoneButton['type'], text: b.text }));
}

// ── Preview body builder ──────────────────────────────────────────────────────

export function buildPreviewBodyNodes(
  text: string,
  mapping: Record<string, string>,
  findLabel: (path: string) => string,
): React.ReactNode {
  if (!text) return 'Your message preview will appear here.';
  const parts = text.split(/(\{\{\d+\}\})/);
  return parts.map((part, i) => {
    const m = part.match(/^\{\{(\d+)\}\}$/);
    if (!m) return part;
    const varPos = m[1];
    const path = mapping[varPos];
    if (path) {
      return React.createElement(
        'strong',
        { key: i, className: 'font-bold text-brand-800' },
        `[${findLabel(path)}]`,
      );
    }
    return React.createElement(
      'span',
      { key: i, className: 'text-ink-400 italic' },
      part,
    );
  });
}
