import React from 'react';
import { ArrowRight } from 'lucide-react';
import { TEMPLATE_OPTIONS } from '@/v2/lib/v2-mock-data';

interface ParameterMappingRowProps {
  label: string;
  shopifyPath: string;
  onPathChange: (path: string) => void;
}

/**
 * A single parameter mapping row: [Label pill] → [Shopify path select]
 * Matches the Stitch modal design exactly.
 */
export const ParameterMappingRow = React.memo(function ParameterMappingRow({
  label,
  shopifyPath,
  onPathChange,
}: ParameterMappingRowProps): React.ReactElement {
  return (
    <div className="flex items-center gap-3">
      {/* Left: variable label (read-only pill) */}
      <div className="flex-1 px-3 py-2 bg-stitch-surface-lowest border border-stitch-outline-variant rounded-lg text-[13px] text-stitch-on-surface">
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
          {/* Render current value as first option, then the rest */}
          <option value={shopifyPath}>{shopifyPath}</option>
          {TEMPLATE_OPTIONS.filter((o) => o !== shopifyPath).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
});
