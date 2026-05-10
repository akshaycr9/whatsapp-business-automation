import { useCallback } from 'react';
import { CategoryButton } from './CategoryButton';
import type { CategorySidebarProps } from './CategorySidebar.types';

export function CategorySidebar({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: CategorySidebarProps) {
  const handleClick = useCallback(
    (categoryId: string) => () => onSelectCategory(categoryId),
    [onSelectCategory],
  );

  return (
    <div className="w-64 flex-shrink-0 border-r border-border bg-card flex flex-col py-3 px-3 overflow-y-auto">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-400 px-2.5 pt-1 pb-2">
        Categories
      </p>
      <div className="flex flex-col gap-0.5">
        {categories.map((category) => (
          <CategoryButton
            key={category.categoryId}
            categoryName={category.categoryName}
            activeCount={category.automations.filter((a) => a.isActive).length}
            isSelected={selectedCategoryId === category.categoryId}
            onClick={handleClick(category.categoryId)}
          />
        ))}
      </div>
    </div>
  );
}
