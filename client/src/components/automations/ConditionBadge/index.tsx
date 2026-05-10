import { cn } from '@/lib/utils';
import type { ConditionBadgeProps } from './ConditionBadge.types';

export function ConditionBadge({ label, labelClassName, contentClassName, children }: ConditionBadgeProps) {
  return (
    <div className="inline-flex items-center gap-2 pl-1.5 pr-3 py-1.5 bg-surface-2 border border-border rounded-[9px] text-[12.5px] font-medium text-ink-700">
      <span className={cn('px-[5px] h-[22px] rounded-sm inline-flex items-center text-[10.5px] font-bold tracking-[0.02em] uppercase shrink-0', labelClassName)}>
        {label}
      </span>
      <span className={cn('inline-flex items-center gap-[5px]', contentClassName)}>
        {children}
      </span>
    </div>
  );
}
