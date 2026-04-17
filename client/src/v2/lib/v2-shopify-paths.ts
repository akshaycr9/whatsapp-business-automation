/** Shopify data path options used in the v2 configure-flow modal parameter mapping rows. */
export interface V2PathOption {
  value: string;
  label: string;
  group: string;
}

/** Full list covering both order and cart event types. */
export const SHOPIFY_PATH_OPTIONS: V2PathOption[] = [
  // ── Order ────────────────────────────────────────────────────────────────────
  { value: 'name',                             label: 'Order Number',             group: 'Order' },
  { value: 'order_number',                     label: 'Order Number (numeric)',   group: 'Order' },
  { value: 'total_price',                      label: 'Order Total',              group: 'Order' },
  { value: 'subtotal_price',                   label: 'Subtotal',                 group: 'Order' },
  { value: 'discount_codes.0.code',            label: 'Discount Code',            group: 'Order' },
  { value: 'currency',                         label: 'Currency',                 group: 'Order' },
  { value: 'financial_status',                 label: 'Payment Status',           group: 'Order' },
  { value: 'fulfillment_status',               label: 'Fulfillment Status',       group: 'Order' },
  { value: 'created_at',                       label: 'Order Date',               group: 'Order' },
  { value: 'payment_gateway',                  label: 'Payment Method',           group: 'Order' },
  // ── Fulfillment ──────────────────────────────────────────────────────────────
  { value: 'fulfillments.0.tracking_number',   label: 'Tracking Number',          group: 'Fulfillment' },
  { value: 'fulfillments.0.tracking_url',      label: 'Tracking URL',             group: 'Fulfillment' },
  { value: 'fulfillments.0.tracking_company',  label: 'Courier / Carrier',        group: 'Fulfillment' },
  { value: 'fulfillments.0.shipment_status',   label: 'Shipment Status',          group: 'Fulfillment' },
  // ── Customer ─────────────────────────────────────────────────────────────────
  { value: 'customer.first_name',              label: 'Customer First Name',      group: 'Customer' },
  { value: 'customer.last_name',               label: 'Customer Last Name',       group: 'Customer' },
  { value: 'customer.email',                   label: 'Customer Email',           group: 'Customer' },
  { value: 'customer.phone',                   label: 'Customer Phone',           group: 'Customer' },
  // ── Shipping ─────────────────────────────────────────────────────────────────
  { value: 'shipping_address.name',            label: 'Shipping Full Name',       group: 'Shipping' },
  { value: 'shipping_address.address1',        label: 'Shipping Street',          group: 'Shipping' },
  { value: 'shipping_address.city',            label: 'Shipping City',            group: 'Shipping' },
  { value: 'shipping_address.province',        label: 'Shipping State',           group: 'Shipping' },
  { value: 'shipping_address.zip',             label: 'Shipping Postcode',        group: 'Shipping' },
  { value: 'shipping_address.country',         label: 'Shipping Country',         group: 'Shipping' },
  // ── Line Items ───────────────────────────────────────────────────────────────
  { value: 'line_items.0.name',                label: 'First Item Name',          group: 'Items' },
  { value: 'line_items.0.title',               label: 'First Item Product Title', group: 'Items' },
  { value: 'line_items.0.variant_title',       label: 'First Item Variant',       group: 'Items' },
  { value: 'line_items.0.sku',                 label: 'First Item SKU',           group: 'Items' },
  { value: 'line_items.0.quantity',            label: 'First Item Quantity',      group: 'Items' },
  { value: 'line_items.0.price',               label: 'First Item Price',         group: 'Items' },
  // ── Cart (Abandoned Checkout) ─────────────────────────────────────────────────
  { value: 'abandoned_checkout_url',           label: 'Abandoned Cart URL',       group: 'Cart' },
];

/** Groups options by their `group` field for rendering `<optgroup>` elements. */
export function groupPathOptions(options: V2PathOption[]): Map<string, V2PathOption[]> {
  const map = new Map<string, V2PathOption[]>();
  for (const opt of options) {
    const group = map.get(opt.group) ?? [];
    group.push(opt);
    map.set(opt.group, group);
  }
  return map;
}
