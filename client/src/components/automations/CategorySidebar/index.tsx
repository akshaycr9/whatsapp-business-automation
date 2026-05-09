import { cn } from '@/lib/utils';
import type { CategorySidebarProps } from './CategorySidebar.types';

export function CategorySidebar({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: CategorySidebarProps) {
  return (
    <div className="w-64 flex-shrink-0 border-r border-border bg-card flex flex-col py-3 px-3 overflow-y-auto">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-400 px-2.5 pt-1 pb-2">
        Categories
      </p>
      <div className="flex flex-col gap-0.5">
        {categories.map((category) => {
          const activeCount = category.automations.filter((a) => a.isActive).length;
          const isSelected = selectedCategoryId === category.categoryId;
          return (
            <button
              key={category.categoryId}
              onClick={() => onSelectCategory(category.categoryId)}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13.5px] font-medium transition-colors text-left w-full',
                isSelected
                  ? 'bg-brand-100 text-brand-800'
                  : 'text-ink-700 hover:bg-surface-sunken',
              )}
            >
              <span className="flex-1 text-left">{category.categoryName}</span>
              <span
                className={cn(
                  'text-[11px] font-semibold px-[7px] py-0.5 rounded-full min-w-[18px] text-center',
                  isSelected
                    ? 'bg-brand-600 text-white'
                    : 'bg-surface-sunken text-ink-500',
                )}
              >
                {activeCount}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
