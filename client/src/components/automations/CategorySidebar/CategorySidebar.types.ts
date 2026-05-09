import type { AutomationCategoryGroup } from '@/types';

export interface CategorySidebarProps {
  categories: AutomationCategoryGroup[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string) => void;
}
