import { STATUS_TABS } from '@/lib/template-constants';
import type { StatusFilter, StatusCounts } from '@/hooks/use-templates';

interface TemplateTabsProps {
  statusFilter: StatusFilter;
  onStatusFilterChange: (filter: StatusFilter) => void;
  statusCounts: StatusCounts;
}

export function TemplateTabs({
  statusFilter,
  onStatusFilterChange,
  statusCounts,
}: TemplateTabsProps) {
  return (
    <div className="flex items-center justify-between pb-3 border-b border-border flex-shrink-0">
      <div className="flex gap-0.5">
        {STATUS_TABS.map((tab) => {
          const count = tab.id === 'all' ? statusCounts.all : statusCounts[tab.id];
          const active = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm border-none text-xs font-semibold transition-all cursor-pointer ${
                active
                  ? 'bg-brand-100 text-brand-800'
                  : 'bg-transparent text-ink-500 hover:bg-surface-sunken'
              }`}
              onClick={() => onStatusFilterChange(tab.id)}
            >
              {tab.label}
              <span
                className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                  active ? 'bg-brand-200 text-brand-800' : 'bg-surface-sunken text-ink-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
