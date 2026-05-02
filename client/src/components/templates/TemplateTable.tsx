import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CategoryChip } from './CategoryChip';
import { TemplateRow } from './TemplateRow';
import { TEMPLATE_TABLE_COLUMNS } from '@/types/templates';
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
      <div className="py-10 text-center text-[13px] text-ink-400">
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
              {TEMPLATE_TABLE_COLUMNS.map((col) => (
                <th
                  key={col.id}
                  className={`sticky top-0 z-10 bg-card border-b border-border px-3.5 py-2.5 text-xs font-bold uppercase tracking-widest text-ink-400 ${
                    col.isRightAligned ? 'text-right' : 'text-left'
                  }`}
                >
                  {col.label}
                </th>
              ))}
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
