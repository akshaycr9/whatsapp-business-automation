import React from 'react';
import { cn } from '@/lib/utils';

interface TableDataCellProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLTableCellElement>) => void;
  className?: string;
}

// Reusable table data cell with common padding and alignment
const baseClasses = 'px-3.5 py-3 align-middle';

export const TableDataCell = React.memo(function TableDataCell({
  children,
  onClick,
  className,
}: TableDataCellProps) {
  return (
    <td className={cn(baseClasses, className)} onClick={onClick}>
      {children}
    </td>
  );
});
