import type { StatusFilter } from '@/hooks/use-templates';

export const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'PENDING', label: 'Pending' },
  { id: 'REJECTED', label: 'Rejected' },
];

export const CATEGORIES = ['all', 'MARKETING', 'UTILITY', 'AUTHENTICATION'] as const;
