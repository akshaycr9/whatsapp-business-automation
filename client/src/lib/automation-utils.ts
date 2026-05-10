import {
  CreditCard,
  Banknote,
  Package,
  ShoppingCart,
  XCircle,
  Clock,
  ShoppingBag,
  Gift,
} from "lucide-react";
import React from "react";
import type { ShopifyEvent } from "@/types";
import { TemplateComponentType, TemplateButtonType } from "@/types";

// ── Event config ──────────────────────────────────────────────────────────────

export interface EventConfig {
  label: string;
  icon: React.ReactNode;
  badgeClass: string;
}

export const EVENT_CONFIG: Record<ShopifyEvent, EventConfig> = {
  PREPAID_ORDER_CONFIRMED: {
    label: "Prepaid Order Confirmed",
    icon: React.createElement(CreditCard, { className: "h-4 w-4" }),
    badgeClass:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  COD_ORDER_CONFIRMATION: {
    label: "COD Order Confirmation",
    icon: React.createElement(Banknote, { className: "h-4 w-4" }),
    badgeClass:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  ORDER_FULFILLED: {
    label: "Order Fulfilled",
    icon: React.createElement(Package, { className: "h-4 w-4" }),
    badgeClass:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  },
  ORDER_CANCELLED: {
    label: "Order Cancelled",
    icon: React.createElement(XCircle, { className: "h-4 w-4" }),
    badgeClass: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
  COD_ORDER_FOLLOW_UP: {
    label: "COD Order Follow Up",
    icon: React.createElement(Clock, { className: "h-4 w-4" }),
    badgeClass: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400",
  },
  ABANDONED_CART_1: {
    label: "Abandoned Cart - 1st Reminder",
    icon: React.createElement(ShoppingCart, { className: "h-4 w-4" }),
    badgeClass:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  },
  ABANDONED_CART_2: {
    label: "Abandoned Cart - 2nd Reminder",
    icon: React.createElement(ShoppingBag, { className: "h-4 w-4" }),
    badgeClass:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  },
  ABANDONED_CART_3: {
    label: "Abandoned Cart - 3rd Reminder",
    icon: React.createElement(Gift, { className: "h-4 w-4" }),
    badgeClass:
      "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
  },
};

export const EVENT_ICON_BG: Record<ShopifyEvent, string> = {
  PREPAID_ORDER_CONFIRMED:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  COD_ORDER_CONFIRMATION:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  ORDER_FULFILLED:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  ORDER_CANCELLED:
    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  COD_ORDER_FOLLOW_UP:
    "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  ABANDONED_CART_1:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  ABANDONED_CART_2:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  ABANDONED_CART_3:
    "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
};

// ── Template parsing utilities ────────────────────────────────────────────────

export function extractBodyText(components: unknown): string {
  if (!Array.isArray(components)) return "";
  const body = (components as Array<{ type: string; text?: string }>).find(
    (c) => c.type === TemplateComponentType.BODY,
  );
  return body?.text ?? "";
}

export function detectVariables(text: string): string[] {
  const matches = text.match(/\{\{(\d+)\}\}/g) ?? [];
  const positions = [
    ...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, ""))),
  ];
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
    components as Array<{
      type: string;
      buttons?: Array<{ type: string; text: string; url?: string }>;
    }>
  ).find((c) => c.type === TemplateComponentType.BUTTONS);
  if (!buttonsComp?.buttons) return [];

  const result: UrlButtonVar[] = [];
  buttonsComp.buttons.forEach((btn, buttonIndex) => {
    if (btn.type !== TemplateButtonType.URL || !btn.url) return;
    const matches = btn.url.match(/\{\{(\d+)\}\}/g) ?? [];
    const positions = [
      ...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, ""))),
    ];
    positions
      .sort((a, b) => Number(a) - Number(b))
      .forEach((varPos) => {
        result.push({
          key: `btn_${buttonIndex}_${varPos}`,
          buttonIndex,
          varPos,
          buttonLabel: btn.text,
        });
      });
  });
  return result;
}
