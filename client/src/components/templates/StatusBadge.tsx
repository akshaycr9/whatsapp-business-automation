import React from 'react';
import type { TemplateStatus } from '@/types';

interface StatusBadgeProps {
  status: TemplateStatus;
}

export const StatusBadge = React.memo(function StatusBadge({ status }: StatusBadgeProps) {
  if (status === 'APPROVED') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-semibold leading-relaxed bg-brand-100 text-brand-800">
        <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
        APPROVED
      </span>
    );
  }
  if (status === 'REJECTED') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-semibold leading-relaxed bg-accent-rose-bg text-accent-rose">
        <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
        REJECTED
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-semibold leading-relaxed bg-accent-amber-bg text-accent-amber">
      <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
      PENDING
    </span>
  );
});
