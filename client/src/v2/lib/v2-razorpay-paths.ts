/**
 * Razorpay Magic Checkout path options for the v2 configure-flow modal.
 * Used exclusively for ABANDONED_CART_1 / ABANDONED_CART_2 / ABANDONED_CART_3 flows
 * where the payload comes from the Razorpay webhook (not Shopify).
 */
import type { V2PathOption } from './v2-shopify-paths';

// Re-export the shared grouping helper so callers only need one import.
export { groupPathOptions } from './v2-shopify-paths';

export const RAZORPAY_PATH_OPTIONS: V2PathOption[] = [
  // ── Computed (virtual) ──────────────────────────────────────────────────────
  // __line_items_summary__ is handled server-side in resolvePath() — it loops
  // line_items and returns a formatted string like "Classic T-Shirt (x2), Polo Shirt (x1)".
  {
    value: '__line_items_summary__',
    label: 'Cart Items Summary  (e.g. Classic T-Shirt (x2), Polo Shirt (x1))',
    group: 'Computed',
  },

  // ── Customer ─────────────────────────────────────────────────────────────────
  { value: 'customer.first_name', label: 'Customer First Name', group: 'Customer' },
  { value: 'customer.last_name',  label: 'Customer Last Name',  group: 'Customer' },
  { value: 'email',               label: 'Customer Email',      group: 'Customer' },
  { value: 'phone',               label: 'Customer Phone',      group: 'Customer' },

  // ── Cart ─────────────────────────────────────────────────────────────────────
  { value: 'abandoned_checkout_url', label: 'Checkout Recovery URL', group: 'Cart' },
  { value: 'line_items_total',       label: 'Cart Total',            group: 'Cart' },
  { value: 'currency',               label: 'Currency',              group: 'Cart' },
  { value: 'cart_token',             label: 'Cart Token',            group: 'Cart' },

  // ── Items (first item, for single-product templates) ─────────────────────────
  { value: 'line_items.0.title',    label: 'Item 1 — Name',     group: 'Items' },
  { value: 'line_items.0.price',    label: 'Item 1 — Price',    group: 'Items' },
  { value: 'line_items.0.quantity', label: 'Item 1 — Quantity', group: 'Items' },
  { value: 'line_items.0.sku',      label: 'Item 1 — SKU',      group: 'Items' },
];
