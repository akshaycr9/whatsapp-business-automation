import { TemplateStatus, TemplateCategory, type StatusFilter } from '@/types';

export const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: TemplateStatus.APPROVED, label: 'Approved' },
  { id: TemplateStatus.PENDING, label: 'Pending' },
  { id: TemplateStatus.REJECTED, label: 'Rejected' },
];

export const CATEGORIES = ['all', TemplateCategory.MARKETING, TemplateCategory.UTILITY, TemplateCategory.AUTHENTICATION] as const;
