import type { Template, StatusFilter, StatusCounts } from '@/types';

export interface TemplatesTopbarProps {
  totalCount: number;
  isLoading: boolean;
  isSyncingAll: boolean;
  onSync: () => void;
  onCreateNew: () => void;
}

export interface TemplatesTabsProps {
  statusFilter: StatusFilter;
  statusCounts: StatusCounts;
  onStatusFilterChange: (filter: StatusFilter) => void;
}

export interface TemplatesFilterBarProps {
  templateCount: number;
  categoryFilter: string;
  onCategoryFilterChange: (category: string) => void;
}

export interface TemplatesTableAreaProps {
  loading: boolean;
  error: string | null;
  filtered: Template[];
  statusFilter: StatusFilter;
  syncingIds: Set<string>;
  onPreview: (id: string) => void;
  onEdit: (id: string) => void;
  onSync: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onCreateNew: () => void;
  onRetry: () => void;
}
