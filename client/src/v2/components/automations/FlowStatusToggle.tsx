import React from 'react';
import { cn } from '@/lib/utils';

interface FlowStatusToggleProps {
  checked: boolean;
  onToggle: (next: boolean) => void;
  disabled?: boolean;
}

/**
 * V2 toggle switch — matches the Stitch design exactly.
 * Uses a hidden checkbox + styled div (same pattern as the Stitch HTML export).
 */
export const FlowStatusToggle = React.memo(function FlowStatusToggle({
  checked,
  onToggle,
  disabled = false,
}: FlowStatusToggleProps): React.ReactElement {
  return (
    <label
      className={cn(
        'relative inline-flex items-center cursor-pointer select-none',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onToggle(e.target.checked)}
      />
      {/* Track */}
      <div
        className={cn(
          'w-11 h-6 rounded-full transition-colors duration-200',
          'after:content-[""] after:absolute after:top-[2px] after:left-[2px]',
          'after:bg-white after:border after:border-gray-300 after:rounded-full',
          'after:h-5 after:w-5 after:transition-transform after:duration-200',
          checked
            ? 'bg-stitch-primary-container after:translate-x-5'
            : 'bg-slate-200 after:translate-x-0',
        )}
      />
    </label>
  );
});
