import React from 'react';
import { RefreshCw, Copy, Pencil, Trash2 } from 'lucide-react';
import { CategoryChip } from './CategoryChip';
import { StatusBadge } from './StatusBadge';
import { getBodyText, getHeaderText } from '@/lib/template-utils';
import type { Template } from '@/types';

interface TemplateRowProps {
  template: Template;
  syncing: boolean;
  onPreview: () => void;
  onEdit: () => void;
  onSync: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export const TemplateRow = React.memo(function TemplateRow({
  template,
  syncing,
  onPreview,
  onEdit,
  onSync,
  onDelete,
  onDuplicate,
}: TemplateRowProps) {
  const bodyText = getBodyText(template.components);
  const headerText = getHeaderText(template.components);
  const preview = headerText || bodyText;
  const createdDate = new Date(template.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
  const updatedDate = new Date(template.updatedAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });

  return (
    <tr
      className="border-b border-border cursor-pointer transition-colors hover:bg-[#eff1ed]"
      onClick={onPreview}
    >
      {/* Template name */}
      <td className="px-3.5 py-3 align-middle">
        <div className="font-mono text-[13px] font-semibold text-ink-900">{template.name}</div>
        {preview && (
          <div
            className="text-[11.5px] mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap text-ink-500"
            style={{ maxWidth: 280 }}
          >
            {preview}
          </div>
        )}
      </td>

      {/* Category */}
      <td className="px-3.5 py-3 align-middle">
        <CategoryChip category={template.category} />
      </td>

      {/* Language */}
      <td className="px-3.5 py-3 align-middle">
        <span className="text-[12.5px] text-ink-500">{template.language.toUpperCase()}</span>
      </td>

      {/* Status */}
      <td className="px-3.5 py-3 align-middle">
        <StatusBadge status={template.status} />
      </td>

      {/* Sync */}
      <td className="px-3.5 py-3 align-middle" onClick={(e) => e.stopPropagation()}>
        <button
          className="inline-flex items-center gap-1.5 rounded-[8px] border border-border bg-card px-2.5 py-1 text-[12px] font-semibold text-ink-700 transition-colors hover:border-brand-500 hover:text-brand-500 disabled:opacity-60 disabled:pointer-events-none"
          onClick={onSync}
          disabled={syncing}
          title="Fetch status from Meta"
        >
          <RefreshCw className={`h-[13px] w-[13px] ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing…' : 'Sync'}
        </button>
      </td>

      {/* Created */}
      <td className="px-3.5 py-3 align-middle">
        <span className="text-[12.5px] text-ink-500">{createdDate}</span>
      </td>

      {/* Updated */}
      <td className="px-3.5 py-3 align-middle">
        <span className="text-[12.5px] text-ink-500">{updatedDate}</span>
      </td>

      {/* Actions */}
      <td className="px-3.5 py-3 align-middle text-right" onClick={(e) => e.stopPropagation()}>
        <div className="inline-flex items-center gap-1">
          <button
            className="w-[30px] h-[30px] inline-grid place-items-center rounded-[8px] border-none bg-transparent transition-colors hover:bg-[#eff1ed] text-ink-400"
            title="Duplicate"
            onClick={onDuplicate}
          >
            <Copy size={14} />
          </button>
          <button
            className="w-[30px] h-[30px] inline-grid place-items-center rounded-[8px] border-none bg-transparent transition-colors hover:bg-[#eff1ed] text-ink-400"
            title="Edit"
            onClick={onEdit}
          >
            <Pencil size={14} />
          </button>
          <button
            className="w-[30px] h-[30px] inline-grid place-items-center rounded-[8px] border-none bg-transparent transition-colors text-ink-400 hover:bg-destructive/10 hover:text-accent-rose"
            title="Delete"
            onClick={onDelete}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
});
