import React from 'react';
import { ShoppingCart, CreditCard, ShoppingBasket } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { V2FlowCategory } from '@/v2/lib/v2-mock-data';

const ICON_MAP: Record<V2FlowCategory['icon'], React.ElementType> = {
  shopping_cart: ShoppingCart,
  payments: CreditCard,
  shopping_basket: ShoppingBasket,
};

interface FlowCategorySidebarProps {
  categories: V2FlowCategory[];
  activeId: string;
  onSelect: (id: string) => void;
}

/**
 * Secondary sidebar showing Flow Categories.
 * Active item has a right green border + primary text color.
 * No explicit borders between items — depth conveyed via background color shifts.
 */
export const FlowCategorySidebar = React.memo(function FlowCategorySidebar({
  categories,
  activeId,
  onSelect,
}: FlowCategorySidebarProps): React.ReactElement {
  return (
    <aside className="bg-stitch-surface-low h-full w-60 flex-shrink-0 flex flex-col py-8 px-4">
      <h2 className="text-lg font-semibold text-stitch-on-surface mb-6 px-2">
        Flow Categories
      </h2>
      <nav className="space-y-0.5">
        {categories.map((cat) => {
          const Icon = ICON_MAP[cat.icon];
          const isActive = cat.id === activeId;
          return (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-4 text-sm transition-all duration-200 ease-in-out text-left',
                isActive
                  ? 'text-stitch-primary font-bold border-r-4 border-stitch-primary hover:bg-stitch-surface-highest'
                  : 'text-stitch-on-surface-variant hover:bg-stitch-surface-highest',
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
});
