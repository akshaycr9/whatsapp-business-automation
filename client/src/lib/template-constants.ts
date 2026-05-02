import { TemplateStatus } from '@/types/templates';
import type { StatusFilter } from '@/hooks/templates/use-templates';

export const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: TemplateStatus.APPROVED, label: 'Approved' },
  { id: TemplateStatus.PENDING, label: 'Pending' },
  { id: TemplateStatus.REJECTED, label: 'Rejected' },
];

export const CATEGORIES = ['all', 'MARKETING', 'UTILITY', 'AUTHENTICATION'] as const;
