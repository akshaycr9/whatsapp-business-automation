import React from 'react';
import { X, Settings } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { PhonePreview } from './PhonePreview';
import { getBodyText, getHeaderText, getFooterText, getTemplateButtons, substituteVars, getBodyExamples } from '@/lib/template-utils';
import type { Template } from '@/types';

interface TemplatePreviewModalProps {
  template: Template;
  onClose: () => void;
  onEdit: () => void;
}

export const TemplatePreviewModal = React.memo(function TemplatePreviewModal({
  template,
  onClose,
  onEdit,
}: TemplatePreviewModalProps) {
  const examples = getBodyExamples(template.components);
  const substituteWithExamples = (text: string): string => {
    if (examples.length > 0) {
      return text.replace(/\{\{(\d+)\}\}/g, (_m, n: string) => examples[parseInt(n, 10) - 1] ?? _m);
    }
    return substituteVars(text);
  };
  const header = substituteWithExamples(getHeaderText(template.components));
  const body = substituteWithExamples(getBodyText(template.components));
  const footer = getFooterText(template.components);
  const buttons = getTemplateButtons(template.components);

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center p-6 animate-fade-in"
      style={{ background: 'rgba(8,14,12,0.45)' }}
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-[16px] max-w-[380px] w-full flex flex-col overflow-hidden animate-scale-in"
        style={{
          maxHeight: 'calc(100vh - 80px)',
          boxShadow: '0 24px 64px rgba(16,32,28,0.18)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-[18px] pb-3.5 border-b border-border">
          <div>
            <div
              className="font-mono text-[15px] font-bold"
              style={{ color: '#1b2420' }}
            >
              {template.name}
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-[12px]" style={{ color: '#6b7671' }}>
              <StatusBadge status={template.status} />
              <span>{template.category} · {template.language.toUpperCase()}</span>
            </div>
          </div>
          <button
            className="w-8 h-8 grid place-items-center rounded-[8px] transition-colors hover:bg-[#eff1ed]"
            style={{ color: '#3a4641' }}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 flex justify-center">
          <PhonePreview
            header={header || undefined}
            body={body || 'Your template body appears here.'}
            footer={footer || undefined}
            buttons={buttons.length > 0 ? buttons : undefined}
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-border">
          <button
            className="inline-flex items-center gap-1.5 px-3 py-[7px] rounded-[8px] border border-border bg-card text-[13px] font-semibold transition-colors hover:bg-[#eff1ed]"
            style={{ color: '#1b2420' }}
            onClick={onClose}
          >
            Close
          </button>
          <button
            className="inline-flex items-center gap-1.5 px-3 py-[7px] rounded-[8px] text-[13px] font-semibold transition-colors"
            style={{ background: '#107a6d', color: '#fff', border: '1px solid #0b5d54' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#0b5d54')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#107a6d')}
            onClick={onEdit}
          >
            <Settings size={13} />
            Edit Template
          </button>
        </div>
      </div>
    </div>
  );
});
