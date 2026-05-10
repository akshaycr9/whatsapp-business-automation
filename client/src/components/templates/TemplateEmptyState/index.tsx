import { Plus, FileText } from 'lucide-react';
import type { StatusFilter } from '@/hooks/templates/use-templates';

interface TemplateEmptyStateProps {
  statusFilter: StatusFilter;
  onCreateNew: () => void;
}

export function TemplateEmptyState({ statusFilter, onCreateNew }: TemplateEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-surface-sunken">
        <FileText className="h-8 w-8 text-ink-400" />
      </div>
      <p className="text-sm font-semibold text-ink-900">
        {statusFilter !== 'all' ? `No ${statusFilter.toLowerCase()} templates` : 'No templates yet'}
      </p>
      <p className="text-xs mt-1 max-w-sm text-ink-500">
        {statusFilter === 'all'
          ? 'Create your first WhatsApp template to get started.'
          : 'Try a different filter or create a new template.'}
      </p>
      {statusFilter === 'all' && (
        <button
          className="inline-flex items-center gap-1.5 mt-4 px-3 py-1.5 rounded-sm border border-brand-800 bg-brand-700 text-xs font-semibold text-white transition-colors hover:bg-brand-800"
          onClick={onCreateNew}
        >
          <Plus className="h-3.5 w-3.5" />
          New Template
        </button>
      )}
    </div>
  );
}
