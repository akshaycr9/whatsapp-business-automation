import { useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Template } from '@/types';
import { extractBodyText, detectVariables, extractUrlButtonVars } from '@/lib/automation-utils';

// ── Shopify path options ──────────────────────────────────────────────────────

interface ShopifyPathOption {
  value: string;
  label: string;
  category: string;
}

const ORDER_PATHS: ShopifyPathOption[] = [
  { value: 'name',                            label: 'Order Number',             category: 'Order' },
  { value: 'order_number',                    label: 'Order Number (numeric)',   category: 'Order' },
  { value: 'total_price',                     label: 'Order Total',              category: 'Order' },
  { value: 'subtotal_price',                  label: 'Subtotal',                 category: 'Order' },
  { value: 'total_discounts',                 label: 'Total Discounts',          category: 'Order' },
  { value: 'discount_codes.0.code',           label: 'Discount Code',            category: 'Order' },
  { value: 'currency',                        label: 'Currency',                 category: 'Order' },
  { value: 'financial_status',                label: 'Payment Status',           category: 'Order' },
  { value: 'fulfillment_status',              label: 'Fulfillment Status',       category: 'Order' },
  { value: 'created_at',                      label: 'Order Date',               category: 'Order' },
  { value: 'payment_gateway',                 label: 'Payment Method',           category: 'Order' },
  { value: 'note',                            label: 'Order Note',               category: 'Order' },
  { value: 'tags',                            label: 'Order Tags',               category: 'Order' },
  { value: 'fulfillments.0.tracking_number',  label: 'Tracking Number',          category: 'Fulfillment' },
  { value: 'fulfillments.0.tracking_url',     label: 'Tracking URL',             category: 'Fulfillment' },
  { value: 'fulfillments.0.tracking_company', label: 'Courier / Carrier',        category: 'Fulfillment' },
  { value: 'fulfillments.0.shipment_status',  label: 'Shipment Status',          category: 'Fulfillment' },
  { value: 'customer.first_name',             label: 'Customer First Name',      category: 'Customer' },
  { value: 'customer.last_name',              label: 'Customer Last Name',       category: 'Customer' },
  { value: 'customer.email',                  label: 'Customer Email',           category: 'Customer' },
  { value: 'customer.phone',                  label: 'Customer Phone',           category: 'Customer' },
  { value: 'customer.orders_count',           label: 'Customer Total Orders',    category: 'Customer' },
  { value: 'shipping_address.name',           label: 'Shipping Full Name',       category: 'Shipping' },
  { value: 'shipping_address.address1',       label: 'Shipping Street',          category: 'Shipping' },
  { value: 'shipping_address.address2',       label: 'Shipping Address 2',       category: 'Shipping' },
  { value: 'shipping_address.city',           label: 'Shipping City',            category: 'Shipping' },
  { value: 'shipping_address.province',       label: 'Shipping State',           category: 'Shipping' },
  { value: 'shipping_address.zip',            label: 'Shipping Postcode',        category: 'Shipping' },
  { value: 'shipping_address.country',        label: 'Shipping Country',         category: 'Shipping' },
  { value: 'shipping_address.phone',          label: 'Shipping Phone',           category: 'Shipping' },
  { value: 'line_items.0.name',               label: 'First Item Name',          category: 'Items' },
  { value: 'line_items.0.title',              label: 'First Item Product Title', category: 'Items' },
  { value: 'line_items.0.variant_title',      label: 'First Item Variant',       category: 'Items' },
  { value: 'line_items.0.sku',                label: 'First Item SKU',           category: 'Items' },
  { value: 'line_items.0.quantity',           label: 'First Item Quantity',      category: 'Items' },
  { value: 'line_items.0.price',              label: 'First Item Price',         category: 'Items' },
  { value: 'line_items.0.vendor',             label: 'First Item Vendor',        category: 'Items' },
];

const CART_PATHS: ShopifyPathOption[] = [
  { value: 'abandoned_checkout_url',          label: 'Abandoned Cart URL',       category: 'Cart' },
  { value: 'total_price',                     label: 'Cart Total',               category: 'Cart' },
  { value: 'subtotal_price',                  label: 'Cart Subtotal',            category: 'Cart' },
  { value: 'currency',                        label: 'Currency',                 category: 'Cart' },
  { value: 'email',                           label: 'Customer Email',           category: 'Customer' },
  { value: 'phone',                           label: 'Customer Phone',           category: 'Customer' },
  { value: 'customer.first_name',             label: 'Customer First Name',      category: 'Customer' },
  { value: 'customer.last_name',              label: 'Customer Last Name',       category: 'Customer' },
  { value: 'shipping_address.name',           label: 'Shipping Full Name',       category: 'Shipping' },
  { value: 'shipping_address.address1',       label: 'Shipping Street',          category: 'Shipping' },
  { value: 'shipping_address.city',           label: 'Shipping City',            category: 'Shipping' },
  { value: 'shipping_address.province',       label: 'Shipping State',           category: 'Shipping' },
  { value: 'shipping_address.zip',            label: 'Shipping Postcode',        category: 'Shipping' },
  { value: 'shipping_address.country',        label: 'Shipping Country',         category: 'Shipping' },
  { value: 'line_items.0.title',              label: 'First Item Name',          category: 'Items' },
  { value: 'line_items.0.variant_title',      label: 'First Item Variant',       category: 'Items' },
  { value: 'line_items.0.quantity',           label: 'First Item Quantity',      category: 'Items' },
  { value: 'line_items.0.price',              label: 'First Item Price',         category: 'Items' },
];

const CUSTOM_SENTINEL = '__custom__';

function getPathOptions(event: string): ShopifyPathOption[] {
  return event === 'ABANDONED_CART' ? CART_PATHS : ORDER_PATHS;
}

function groupByCategory(options: ShopifyPathOption[]): Map<string, ShopifyPathOption[]> {
  const map = new Map<string, ShopifyPathOption[]>();
  for (const opt of options) {
    const group = map.get(opt.category) ?? [];
    group.push(opt);
    map.set(opt.category, group);
  }
  return map;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface VariableMappingSectionProps {
  template: Template | null;
  mapping: Record<string, string>;
  onChange: (mapping: Record<string, string>) => void;
  shopifyEvent: string;
}

export function VariableMappingSection({ template, mapping, onChange, shopifyEvent }: VariableMappingSectionProps) {
  const [customKeys, setCustomKeys] = useState<Set<string>>(new Set());

  if (!template) return null;

  const bodyText = extractBodyText(template.components);
  const bodyVars = detectVariables(bodyText);
  const urlButtonVars = extractUrlButtonVars(template.components);

  if (bodyVars.length === 0 && urlButtonVars.length === 0) return null;

  const pathOptions = getPathOptions(shopifyEvent);
  const grouped = groupByCategory(pathOptions);
  const knownValues = new Set(pathOptions.map((o) => o.value));

  const handleSelectChange = (key: string, selected: string) => {
    if (selected === CUSTOM_SENTINEL) {
      setCustomKeys((prev) => new Set(prev).add(key));
      onChange({ ...mapping, [key]: '' });
    } else {
      setCustomKeys((prev) => { const next = new Set(prev); next.delete(key); return next; });
      onChange({ ...mapping, [key]: selected });
    }
  };

  const isCustom = (key: string): boolean =>
    customKeys.has(key) || (!!mapping[key] && !knownValues.has(mapping[key]));

  const selectValue = (key: string): string =>
    isCustom(key) ? CUSTOM_SENTINEL : (mapping[key] ?? '');

  const renderRow = (key: string, label: React.ReactNode) => (
    <div key={key} className="space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="text-sm font-mono text-muted-foreground w-10 shrink-0">{label}</span>
        <Select value={selectValue(key)} onValueChange={(val) => handleSelectChange(key, val)}>
          <SelectTrigger className="text-sm">
            <SelectValue placeholder="Select a Shopify field…" />
          </SelectTrigger>
          <SelectContent>
            {Array.from(grouped.entries()).map(([category, options]) => (
              <SelectGroup key={category}>
                <SelectLabel>{category}</SelectLabel>
                {options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span>{opt.label}</span>
                    <span className="ml-2 font-mono text-xs text-muted-foreground">{opt.value}</span>
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
            <SelectGroup>
              <SelectLabel>Advanced</SelectLabel>
              <SelectItem value={CUSTOM_SENTINEL}>Custom path…</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      {isCustom(key) && (
        <div className="ml-12">
          <Input
            placeholder="e.g. line_items.0.sku"
            value={mapping[key] ?? ''}
            onChange={(e) => onChange({ ...mapping, [key]: e.target.value })}
            className="text-sm font-mono"
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-foreground">Variable Mapping</p>
        <p className="text-xs text-muted-foreground mt-1">
          Select the Shopify field to use for each template variable.
        </p>
      </div>

      {bodyVars.length > 0 && (
        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Message Body</p>
            <p className="text-xs text-muted-foreground mt-1 font-mono bg-muted rounded px-2 py-1.5 leading-relaxed">
              {bodyText}
            </p>
          </div>
          {bodyVars.map((pos) => renderRow(pos, `{{${pos}}}`))}
        </div>
      )}

      {urlButtonVars.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">URL Button Variables</p>
          {urlButtonVars.map((v) =>
            renderRow(
              v.key,
              <span title={`Button: ${v.buttonLabel}`}>
                {`{{${v.varPos}}}`}
                <span className="block text-[10px] leading-tight truncate max-w-[2.5rem]" title={v.buttonLabel}>
                  {v.buttonLabel}
                </span>
              </span>,
            )
          )}
        </div>
      )}
    </div>
  );
}
