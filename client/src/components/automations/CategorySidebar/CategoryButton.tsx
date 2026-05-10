import React from 'react';
import { cn } from '@/lib/utils';
import type { CategoryButtonProps } from './CategoryButton.types';

export const CategoryButton = React.memo(function CategoryButton({
  categoryName,
  activeCount,
  isSelected,
  onClick,
}: CategoryButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13.5px] font-medium transition-colors text-left w-full',
        isSelected ? 'bg-brand-100 text-brand-800' : 'text-ink-700 hover:bg-surface-sunken',
      )}
    >
      <span className="flex-1 text-left">{categoryName}</span>
      <span
        className={cn(
          'text-[11px] font-semibold px-[7px] py-0.5 rounded-full min-w-[18px] text-center',
          isSelected ? 'bg-brand-600 text-white' : 'bg-surface-sunken text-ink-500',
        )}
      >
        {activeCount}
      </span>
    </button>
  );
});
