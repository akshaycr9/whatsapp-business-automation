import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { TemplateStatus } from '@/types';

interface StatusBadgeProps {
  status: TemplateStatus;
}

export const StatusBadge = React.memo(function StatusBadge({ status }: StatusBadgeProps) {
  if (status === 'APPROVED') {
    return (
      <Badge className="border-transparent bg-green-100 text-green-800 hover:bg-green-100">
        APPROVED
      </Badge>
    );
  }
  if (status === 'REJECTED') {
    return <Badge variant="destructive">REJECTED</Badge>;
  }
  return (
    <Badge className="border-transparent bg-amber-100 text-amber-800 hover:bg-amber-100">
      PENDING
    </Badge>
  );
});
