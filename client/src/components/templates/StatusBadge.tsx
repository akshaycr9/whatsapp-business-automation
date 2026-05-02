import React from 'react';
import { TemplateStatus, type StatusConfig } from '@/types/templates';

interface StatusBadgeProps {
  status: TemplateStatus;
}

// Configuration map for status styles
const STATUS_CONFIG: Record<TemplateStatus, StatusConfig> = {
  [TemplateStatus.APPROVED]: {
    bgClass: 'bg-brand-100',
    textClass: 'text-brand-800',
    label: 'APPROVED',
  },
  [TemplateStatus.REJECTED]: {
    bgClass: 'bg-accent-rose-bg',
    textClass: 'text-accent-rose',
    label: 'REJECTED',
  },
  [TemplateStatus.PENDING]: {
    bgClass: 'bg-accent-amber-bg',
    textClass: 'text-accent-amber',
    label: 'PENDING',
  },
};

const baseClasses = 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-semibold leading-relaxed';
const dotClasses = 'w-1.5 h-1.5 rounded-full bg-current flex-shrink-0';

export const StatusBadge = React.memo(function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span className={`${baseClasses} ${config.bgClass} ${config.textClass}`}>
      <span className={dotClasses} />
      {config.label}
    </span>
  );
});
