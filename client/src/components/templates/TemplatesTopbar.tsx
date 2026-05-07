import { Plus, RefreshCw } from 'lucide-react';

interface TemplatesTopbarProps {
  pageName: string;
  totalCount: number;
  isLoading: boolean;
  isSyncingAll: boolean;
  onSync: () => void;
  onCreateNew: () => void;
}

export function TemplatesTopbar({
  pageName,
  totalCount,
  isLoading,
  isSyncingAll,
  onSync,
  onCreateNew,
}: TemplatesTopbarProps) {
  return (
    <div className="flex items-center gap-4 px-5 border-b border-border bg-card flex-shrink-0 h-14">
      <div className="flex items-center">
        <span className="text-base font-semibold tracking-tight text-ink-900">
          {pageName}
        </span>
        {!isLoading && (
          <span className="ml-3 pl-3 border-l border-border text-xs text-ink-500">
            {totalCount} template{totalCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div className="flex-1" />
      <button
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-border bg-card text-xs font-semibold text-ink-900 transition-colors hover:bg-surface-sunken disabled:opacity-60 disabled:pointer-events-none"
        onClick={onSync}
        disabled={isSyncingAll}
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
        Sync All
      </button>
      <button
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-brand-800 bg-brand-700 text-xs font-semibold text-white transition-colors hover:bg-brand-800"
        onClick={onCreateNew}
      >
        <Plus className="h-3.5 w-3.5" />
        New Template
      </button>
    </div>
  );
}
