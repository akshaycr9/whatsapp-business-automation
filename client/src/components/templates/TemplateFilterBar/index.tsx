import { CATEGORIES } from '@/lib/template-constants';

interface TemplateFilterBarProps {
  templateCount: number;
  categoryFilter: string;
  onCategoryFilterChange: (category: string) => void;
}

export function TemplateFilterBar({
  templateCount,
  categoryFilter,
  onCategoryFilterChange,
}: TemplateFilterBarProps) {
  return (
    <div className="flex items-center justify-between py-2.5 flex-shrink-0">
      <div className="text-xs text-ink-500">
        {templateCount} template{templateCount !== 1 ? 's' : ''}
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold text-ink-500">
          Category:
        </label>
        <select
          className="px-2.5 py-1 border border-border rounded-sm bg-card text-xs text-ink-900 outline-none"
          value={categoryFilter}
          onChange={(e) => onCategoryFilterChange(e.target.value)}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c === 'all' ? 'All' : c.charAt(0) + c.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
