import { ChevronLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EditTopbarProps } from './EditTopbar.types';

export function EditTopbar({ automationName, saving, onCancel, onSave }: EditTopbarProps) {
  return (
    <div className="h-14 border-b border-border bg-card flex items-center px-5 gap-3 flex-shrink-0">
      <button
        onClick={onCancel}
        className="w-8 h-8 grid place-items-center rounded-md text-ink-700 hover:bg-surface-sunken transition-colors"
      >
        <ChevronLeft size={17} strokeWidth={2} />
      </button>
      <span className="text-[16px] font-[650] tracking-[-0.01em] text-ink-900">
        Edit Automation
      </span>
      <span className="text-[12.5px] text-ink-500 pl-3 ml-1 border-l border-border">
        {automationName}
      </span>
      <div className="flex-1" />
      <button
        onClick={onCancel}
        disabled={saving}
        className="inline-flex items-center px-4 py-[7px] rounded-md bg-card border border-border text-ink-900 text-[13px] font-semibold hover:bg-surface-sunken hover:border-ink-300 transition-all disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        onClick={onSave}
        disabled={saving}
        className={cn(
          'inline-flex items-center px-4 py-[7px] rounded-md text-[13px] font-semibold transition-all',
          'bg-brand-700 text-white border border-brand-800 hover:bg-brand-800',
          'disabled:opacity-50 disabled:cursor-not-allowed',
        )}
      >
        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </div>
  );
}
