import React, { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { SHOPIFY_PATH_OPTIONS, groupPathOptions } from '@/v2/lib/v2-shopify-paths';

interface ParameterMappingRowProps {
  label: string;
  shopifyPath: string;
  onPathChange: (path: string) => void;
}

/**
 * A single parameter mapping row: [Variable label pill] → [Shopify path select]
 * Matches the Stitch modal design. Path options are grouped by category.
 */
export const ParameterMappingRow = React.memo(function ParameterMappingRow({
  label,
  shopifyPath,
  onPathChange,
}: ParameterMappingRowProps): React.ReactElement {
  const grouped = useMemo(() => groupPathOptions(SHOPIFY_PATH_OPTIONS), []);

  return (
    <div className="flex items-center gap-3">
      {/* Left: variable label (read-only pill) */}
      <div className="flex-shrink-0 w-28 px-3 py-2 bg-stitch-surface-lowest border border-stitch-outline-variant rounded-lg text-[13px] text-stitch-on-surface font-mono">
        {label}
      </div>

      {/* Arrow */}
      <ArrowRight className="w-4 h-4 text-stitch-on-surface-variant flex-shrink-0" />

      {/* Right: Shopify path selector */}
      <div className="flex-1">
        <select
          value={shopifyPath}
          onChange={(e) => onPathChange(e.target.value)}
          className="w-full h-9 px-2 bg-stitch-surface-low border-none rounded-lg text-[13px] text-stitch-on-surface focus:outline-none focus:ring-2 focus:ring-stitch-primary-container"
        >
          <option value="">— select a Shopify field —</option>
          {Array.from(grouped.entries()).map(([group, options]) => (
            <optgroup key={group} label={group}>
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </optgroup>
          ))}
          {/* Keep existing custom value selectable if it's not in the standard list */}
          {shopifyPath && !SHOPIFY_PATH_OPTIONS.some((o) => o.value === shopifyPath) && (
            <optgroup label="Custom">
              <option value={shopifyPath}>{shopifyPath}</option>
            </optgroup>
          )}
        </select>
      </div>
    </div>
  );
});
