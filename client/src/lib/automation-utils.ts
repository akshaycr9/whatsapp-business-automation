import { CreditCard, Banknote, Package, ShoppingCart, MessageSquare } from 'lucide-react';
import React from 'react';
import type { ShopifyEvent } from '@/types';

// ── Event config ──────────────────────────────────────────────────────────────

export interface EventConfig {
  label: string;
  icon: React.ReactNode;
  badgeClass: string;
}

export const EVENT_CONFIG: Record<ShopifyEvent, EventConfig> = {
  PREPAID_ORDER_CONFIRMED: {
    label: 'Prepaid Order Confirmed',
    icon: React.createElement(CreditCard, { className: 'h-4 w-4' }),
    badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  COD_ORDER_CONFIRMED: {
    label: 'COD Order Confirmed',
    icon: React.createElement(Banknote, { className: 'h-4 w-4' }),
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
  ORDER_FULFILLED: {
    label: 'Order Fulfilled',
    icon: React.createElement(Package, { className: 'h-4 w-4' }),
    badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  },
  ABANDONED_CART: {
    label: 'Abandoned Cart',
    icon: React.createElement(ShoppingCart, { className: 'h-4 w-4' }),
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  },
};

export const EVENT_ICON_BG: Record<ShopifyEvent, string> = {
  PREPAID_ORDER_CONFIRMED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  COD_ORDER_CONFIRMED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ORDER_FULFILLED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  ABANDONED_CART: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

const BUTTON_REPLY_CONFIG: EventConfig = {
  label: 'Button Reply',
  icon: React.createElement(MessageSquare, { className: 'h-4 w-4' }),
  badgeClass: 'bg-slate-100 text-slate-800 dark:bg-slate-800/40 dark:text-slate-300',
};

export function getEventConfig(triggerType: string, shopifyEvent: ShopifyEvent | null): EventConfig {
  if (triggerType === 'BUTTON_REPLY' || !shopifyEvent) {
    return BUTTON_REPLY_CONFIG;
  }
  return EVENT_CONFIG[shopifyEvent] ?? BUTTON_REPLY_CONFIG;
}

// ── Template parsing utilities ────────────────────────────────────────────────

export function extractBodyText(components: unknown): string {
  if (!Array.isArray(components)) return '';
  const body = (components as Array<{ type: string; text?: string }>).find(
    (c) => c.type === 'BODY',
  );
  return body?.text ?? '';
}

export function detectVariables(text: string): string[] {
  const matches = text.match(/\{\{(\d+)\}\}/g) ?? [];
  const positions = [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, '')))];
  return positions.sort((a, b) => Number(a) - Number(b));
}

export interface UrlButtonVar {
  key: string;
  buttonIndex: number;
  varPos: string;
  buttonLabel: string;
}

export function extractUrlButtonVars(components: unknown): UrlButtonVar[] {
  if (!Array.isArray(components)) return [];
  const buttonsComp = (
    components as Array<{ type: string; buttons?: Array<{ type: string; text: string; url?: string }> }>
  ).find((c) => c.type === 'BUTTONS');
  if (!buttonsComp?.buttons) return [];

  const result: UrlButtonVar[] = [];
  buttonsComp.buttons.forEach((btn, buttonIndex) => {
    if (btn.type !== 'URL' || !btn.url) return;
    const matches = btn.url.match(/\{\{(\d+)\}\}/g) ?? [];
    const positions = [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, '')))];
    positions.sort((a, b) => Number(a) - Number(b)).forEach((varPos) => {
      result.push({ key: `btn_${buttonIndex}_${varPos}`, buttonIndex, varPos, buttonLabel: btn.text });
    });
  });
  return result;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
