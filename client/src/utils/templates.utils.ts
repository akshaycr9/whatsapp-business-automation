import { TemplateStatus } from '@/types';
import type { Template } from '@/types';

export const filterTemplatesByCategory = (
  templates: Template[],
  categoryFilter: string,
): Template[] =>
  categoryFilter === 'all'
    ? templates
    : templates.filter((t) => t.category === categoryFilter);

export const buildSyncToastDescription = (
  status: TemplateStatus,
  rejectedReason: string | null,
): string =>
  status === TemplateStatus.REJECTED && rejectedReason
    ? `Rejected: ${rejectedReason}`
    : `Status: ${status}`;

export const buildSyncAllToastTitle = (synced: number): string =>
  `Synced ${synced} template${synced !== 1 ? 's' : ''}`;
