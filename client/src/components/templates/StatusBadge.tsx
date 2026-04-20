import React from 'react';
import type { TemplateStatus } from '@/types';

interface StatusBadgeProps {
  status: TemplateStatus;
}

export const StatusBadge = React.memo(function StatusBadge({ status }: StatusBadgeProps) {
  if (status === 'APPROVED') {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-semibold leading-relaxed"
        style={{ background: '#e7f5f1', color: '#0b5d54' }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
        APPROVED
      </span>
    );
  }
  if (status === 'REJECTED') {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-semibold leading-relaxed"
        style={{ background: '#fbe5e8', color: '#a9384d' }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
        REJECTED
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-semibold leading-relaxed"
      style={{ background: '#fcf3dd', color: '#b5790a' }}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
      PENDING
    </span>
  );
});
