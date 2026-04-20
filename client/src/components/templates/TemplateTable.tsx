import React from 'react';
import { RefreshCw, Copy, Pencil, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StatusBadge } from './StatusBadge';
import { getBodyText, getHeaderText } from '@/lib/template-utils';
import type { Template } from '@/types';

interface TemplateTableProps {
  templates: Template[];
  syncingIds: Set<string>;
  onPreview: (id: string) => void;
  onEdit: (id: string) => void;
  onSync: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

function CategoryChip({ category }: { category: string }) {
  const cat = category.toLowerCase();
  if (cat === 'marketing') {
    return (
      <span
        className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold border"
        style={{ background: '#fdf0e6', color: '#b35a1f', borderColor: '#f5d5b5' }}
      >
        {category}
      </span>
    );
  }
  if (cat === 'utility') {
    return (
      <span
        className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold border"
        style={{ background: '#e8f0fe', color: '#2a5db0', borderColor: '#bdd0f5' }}
      >
        {category}
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold border"
      style={{ background: '#eff1ed', color: '#6b7671', borderColor: '#c9cec4' }}
    >
      {category}
    </span>
  );
}

const TemplateRow = React.memo(function TemplateRow({
  template,
  syncing,
  onPreview,
  onEdit,
  onSync,
  onDelete,
  onDuplicate,
}: {
  template: Template;
  syncing: boolean;
  onPreview: () => void;
  onEdit: () => void;
  onSync: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
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
        <div className="font-mono text-[13px] font-semibold text-[#1b2420]">{template.name}</div>
        {preview && (
          <div
            className="text-[11.5px] mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap"
            style={{ color: '#6b7671', maxWidth: 280 }}
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
        <span className="text-[12.5px]" style={{ color: '#6b7671' }}>
          {template.language.toUpperCase()}
        </span>
      </td>

      {/* Status */}
      <td className="px-3.5 py-3 align-middle">
        <StatusBadge status={template.status} />
      </td>

      {/* Sync */}
      <td className="px-3.5 py-3 align-middle" onClick={(e) => e.stopPropagation()}>
        <button
          className="inline-flex items-center gap-1.5 rounded-[8px] border border-border bg-card px-2.5 py-1 text-[12px] font-semibold text-[#3a4641] transition-colors hover:border-[#17a398] hover:text-[#107a6d] disabled:opacity-60 disabled:pointer-events-none"
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
        <span className="text-[12.5px]" style={{ color: '#6b7671' }}>{createdDate}</span>
      </td>

      {/* Updated */}
      <td className="px-3.5 py-3 align-middle">
        <span className="text-[12.5px]" style={{ color: '#6b7671' }}>{updatedDate}</span>
      </td>

      {/* Actions */}
      <td className="px-3.5 py-3 align-middle text-right" onClick={(e) => e.stopPropagation()}>
        <div className="inline-flex items-center gap-1">
          <button
            className="w-[30px] h-[30px] inline-grid place-items-center rounded-[8px] border-none bg-transparent transition-colors hover:bg-[#eff1ed]"
            style={{ color: '#8a948f' }}
            title="Duplicate"
            onClick={onDuplicate}
          >
            <Copy size={14} />
          </button>
          <button
            className="w-[30px] h-[30px] inline-grid place-items-center rounded-[8px] border-none bg-transparent transition-colors hover:bg-[#eff1ed]"
            style={{ color: '#8a948f' }}
            title="Edit"
            onClick={onEdit}
          >
            <Pencil size={14} />
          </button>
          <button
            className="w-[30px] h-[30px] inline-grid place-items-center rounded-[8px] border-none bg-transparent transition-colors"
            style={{ color: '#8a948f' }}
            title="Delete"
            onClick={onDelete}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(169,56,77,0.1)';
              e.currentTarget.style.color = '#a9384d';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#8a948f';
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
});

export const TemplateTable = React.memo(function TemplateTable({
  templates,
  syncingIds,
  onPreview,
  onEdit,
  onSync,
  onDelete,
  onDuplicate,
}: TemplateTableProps) {
  if (templates.length === 0) {
    return (
      <div
        className="py-10 text-center text-[13px]"
        style={{ color: '#8a948f' }}
      >
        No templates in this category.
      </div>
    );
  }

  return (
    <ScrollArea className="w-full">
      <div className="overflow-x-auto">
        <table
          className="w-full border-collapse text-[13px]"
          style={{ minWidth: 780, borderSpacing: 0 }}
        >
          <thead>
            <tr>
              {['Template Name', 'Category', 'Language', 'Status', 'Sync', 'Created', 'Updated', 'Actions'].map(
                (col, i) => (
                  <th
                    key={col}
                    className="sticky top-0 z-10 bg-card border-b border-border px-3.5 py-2.5 text-left"
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: '#8a948f',
                      textAlign: i === 7 ? 'right' : 'left',
                    }}
                  >
                    {col}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {templates.map((t) => (
              <TemplateRow
                key={t.id}
                template={t}
                syncing={syncingIds.has(t.id)}
                onPreview={() => onPreview(t.id)}
                onEdit={() => onEdit(t.id)}
                onSync={() => onSync(t.id)}
                onDelete={() => onDelete(t.id)}
                onDuplicate={() => onDuplicate(t.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </ScrollArea>
  );
});
