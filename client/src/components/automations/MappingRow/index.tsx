import { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { SHOPIFY_PATH_OPTIONS, groupPathOptions } from '@/lib/shopify-paths';
import { RAZORPAY_PATH_OPTIONS } from '@/lib/razorpay-paths';
import type { MappingRowProps } from './MappingRow.types';

export function MappingRow({ label, path, isAbandonedCart, onChange }: MappingRowProps) {
  const options = isAbandonedCart ? RAZORPAY_PATH_OPTIONS : SHOPIFY_PATH_OPTIONS;
  const grouped = useMemo(() => groupPathOptions(options), [options]);

  return (
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0 w-32 px-3 py-2 bg-surface-2 border border-border rounded-md text-[12.5px] text-ink-700 font-mono truncate">
        {label}
      </div>
      <ArrowRight className="w-4 h-4 text-ink-300 flex-shrink-0" />
      <div className="flex-1">
        <select
          value={path}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-9 px-3 bg-surface-2 border border-border rounded-md text-[12.5px] text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
        >
          <option value="">— select a field —</option>
          {Array.from(grouped.entries()).map(([group, opts]) => (
            <optgroup key={group} label={group}>
              {opts.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </optgroup>
          ))}
          {path && !options.some((o) => o.value === path) && (
            <optgroup label="Custom">
              <option value={path}>{path}</option>
            </optgroup>
          )}
        </select>
      </div>
    </div>
  );
}
