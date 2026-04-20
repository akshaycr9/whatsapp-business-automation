import React, { useState } from 'react';
import { ChevronLeft, Copy, Check, Plus } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { PhonePreview } from './PhonePreview';
import { getBodyText, getHeaderText, getFooterText, getCtaText, getTemplateButtons, substituteVars, extractVariables } from '@/lib/template-utils';
import type { Template } from '@/types';

interface TemplateEditorViewProps {
  template: Template;
  onBack: () => void;
}

export function TemplateEditorView({ template, onBack }: TemplateEditorViewProps) {
  const initialHeader = getHeaderText(template.components);
  const initialBody = getBodyText(template.components);
  const initialFooter = getFooterText(template.components);
  const initialCta = getCtaText(template.components);

  const [header, setHeader] = useState(initialHeader);
  const [body, setBody] = useState(initialBody);
  const [footer, setFooter] = useState(initialFooter);
  const [cta, setCta] = useState(initialCta);
  const [bodySamples, setBodySamples] = useState<string[]>([]);

  const variables = extractVariables(body);

  const syncSamples = (newBody: string) => {
    const vars = extractVariables(newBody);
    setBodySamples((prev) => {
      const next = [...prev];
      while (next.length < vars.length) next.push('');
      return next.slice(0, vars.length);
    });
  };

  const handleBodyChange = (val: string) => {
    setBody(val);
    syncSamples(val);
  };
  const updatedDate = new Date(template.updatedAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const addVariable = () => {
    const nextNum = variables.length + 1;
    const newBody = body + `{{${nextNum}}}`;
    handleBodyChange(newBody);
  };

  const substituteWithSamples = (text: string) =>
    text.replace(/\{\{(\d+)\}\}/g, (_m, n: string) => bodySamples[parseInt(n, 10) - 1]?.trim() || _m);

  const hasSamples = bodySamples.some((s) => s.trim() !== '');
  const previewHeader = hasSamples ? substituteWithSamples(header) : substituteVars(header);
  const previewBody = hasSamples ? substituteWithSamples(body) : substituteVars(body);
  const previewButtons = getTemplateButtons(template.components);

  return (
    <div className="grid gap-5 h-full" style={{ gridTemplateColumns: 'minmax(0, 1fr) 340px' }}>
      {/* Left: form */}
      <div
        className="bg-card border border-border rounded-[14px] px-6 py-5 overflow-y-auto"
      >
        {/* Back button */}
        <button
          className="inline-flex items-center gap-1.5 mb-4 text-[13px] font-semibold border-none bg-transparent p-0 cursor-pointer"
          style={{ color: '#107a6d' }}
          onClick={onBack}
        >
          <ChevronLeft size={16} />
          Back to templates
        </button>

        {/* Title row */}
        <div className="flex items-start justify-between gap-2 mb-5 flex-wrap">
          <div className="min-w-0">
            <div
              className="font-mono text-[17px] font-bold tracking-tight break-all"
              style={{ color: '#1b2420' }}
            >
              {template.name}
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap" style={{ fontSize: 12.5, color: '#6b7671' }}>
              <StatusBadge status={template.status} />
              <span>Last edited {updatedDate}</span>
            </div>
          </div>
          <div className="flex gap-1.5 flex-shrink-0">
            <button
              className="inline-flex items-center gap-1.5 px-3 py-[7px] rounded-[8px] border border-border bg-card text-[13px] font-semibold transition-colors hover:bg-[#eff1ed]"
              style={{ color: '#1b2420' }}
            >
              <Copy size={13} />
              Duplicate
            </button>
            <button
              className="inline-flex items-center gap-1.5 px-3 py-[7px] rounded-[8px] text-[13px] font-semibold transition-colors"
              style={{ background: '#107a6d', color: '#fff', border: '1px solid #0b5d54' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#0b5d54')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#107a6d')}
            >
              <Check size={13} strokeWidth={2.5} />
              Save
            </button>
          </div>
        </div>

        {/* Category */}
        <FieldGroup label="Category">
          <div className="flex gap-1.5 flex-wrap">
            {(['MARKETING', 'UTILITY', 'AUTHENTICATION'] as const).map((cat) => (
              <span
                key={cat}
                className="px-2.5 py-1 border rounded-full text-[12px] font-semibold cursor-pointer transition-colors"
                style={
                  template.category === cat
                    ? { borderColor: '#128c7e', background: '#e7f5f1', color: '#0b5d54' }
                    : { borderColor: '#e3e6e0', background: '#fff', color: '#6b7671' }
                }
              >
                {cat.charAt(0) + cat.slice(1).toLowerCase()}
              </span>
            ))}
          </div>
        </FieldGroup>

        {/* Language */}
        <FieldGroup label="Language">
          <div className="flex gap-1.5">
            <span
              className="px-2.5 py-1 border rounded-full text-[12px] font-semibold"
              style={{ borderColor: '#128c7e', background: '#e7f5f1', color: '#0b5d54' }}
            >
              English (IN)
            </span>
          </div>
        </FieldGroup>

        {/* Header */}
        <FieldGroup label="Header" hint="Text · 60 char max">
          <input
            className="w-full px-[11px] py-2 border border-border rounded-[8px] bg-[#fbfcfa] text-[13px] outline-none transition-[border-color,box-shadow] focus:border-[#17a398] focus:shadow-[0_0_0_3px_#e7f5f1]"
            style={{ color: '#1b2420' }}
            value={header}
            onChange={(e) => setHeader(e.target.value)}
            maxLength={60}
          />
        </FieldGroup>

        {/* Body */}
        <FieldGroup label="Body" hint="1,024 char max">
          <textarea
            className="w-full px-[11px] py-2 border border-border rounded-[8px] bg-[#fbfcfa] text-[13px] outline-none resize-y transition-[border-color,box-shadow] focus:border-[#17a398] focus:shadow-[0_0_0_3px_#e7f5f1]"
            style={{ color: '#1b2420', minHeight: 110, lineHeight: 1.55 }}
            value={body}
            onChange={(e) => handleBodyChange(e.target.value)}
            maxLength={1024}
          />
          <div className="mt-2 flex items-center gap-2 flex-wrap text-[11.5px]" style={{ color: '#6b7671' }}>
            <span>Variables:</span>
            {variables.map((v, i) => (
              <span key={v} className="inline-flex items-center gap-1">
                <span
                  className="font-mono text-[12px] font-semibold px-1.5 py-0.5 rounded"
                  style={{ background: '#eae6fb', color: '#5b4bb5' }}
                >
                  {v}
                </span>
                <span style={{ color: '#8a948f', fontSize: 11.5 }}>var_{i + 1}</span>
              </span>
            ))}
            <button
              className="inline-flex items-center gap-1 px-2 py-0.5 border border-border rounded-[6px] bg-card text-[11.5px] font-semibold transition-colors hover:bg-[#eff1ed]"
              style={{ color: '#1b2420' }}
              onClick={addVariable}
              type="button"
            >
              <Plus size={11} strokeWidth={2.5} />
              Variable
            </button>
          </div>
          {variables.length > 0 && (
            <div
              className="mt-3 rounded-[10px] p-3 space-y-2"
              style={{ background: '#f2faf7', border: '1px solid #c6ebe2' }}
            >
              <p className="text-[12px] mb-2" style={{ color: '#3a4641' }}>
                <strong>Sample values</strong> — shown to Meta reviewers and used in the live preview.
              </p>
              {variables.map((v, i) => (
                <div key={v} className="flex items-center gap-2">
                  <span
                    className="font-mono text-[12px] font-semibold px-1.5 py-0.5 rounded shrink-0"
                    style={{ background: '#eae6fb', color: '#5b4bb5' }}
                  >
                    {v}
                  </span>
                  <input
                    className="flex-1 px-[11px] py-1.5 border border-border rounded-[8px] bg-card text-[12px] outline-none transition-[border-color,box-shadow] focus:border-[#17a398] focus:shadow-[0_0_0_3px_#e7f5f1]"
                    style={{ color: '#1b2420' }}
                    placeholder={`Sample for ${v}`}
                    value={bodySamples[i] ?? ''}
                    onChange={(e) => {
                      const next = [...bodySamples];
                      next[i] = e.target.value;
                      setBodySamples(next);
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </FieldGroup>

        {/* Footer */}
        <FieldGroup label="Footer" hint="Optional · 60 char max">
          <input
            className="w-full px-[11px] py-2 border border-border rounded-[8px] bg-[#fbfcfa] text-[13px] outline-none transition-[border-color,box-shadow] focus:border-[#17a398] focus:shadow-[0_0_0_3px_#e7f5f1]"
            style={{ color: '#1b2420' }}
            value={footer}
            onChange={(e) => setFooter(e.target.value)}
            maxLength={60}
          />
        </FieldGroup>

        {/* CTA */}
        <FieldGroup label="Call-to-action button">
          <div className="grid gap-2" style={{ gridTemplateColumns: '1fr 2fr' }}>
            <select
              className="w-full px-[11px] py-2 border border-border rounded-[8px] bg-[#fbfcfa] text-[13px] outline-none"
              style={{ color: '#1b2420' }}
            >
              <option>URL</option>
              <option>Quick reply</option>
              <option>None</option>
            </select>
            <input
              className="w-full px-[11px] py-2 border border-border rounded-[8px] bg-[#fbfcfa] text-[13px] outline-none transition-[border-color,box-shadow] focus:border-[#17a398] focus:shadow-[0_0_0_3px_#e7f5f1]"
              style={{ color: '#1b2420' }}
              value={cta}
              onChange={(e) => setCta(e.target.value)}
              placeholder="Button label"
            />
          </div>
        </FieldGroup>

        {/* Meta compliance banner */}
        <div
          className="mt-4 p-3.5 rounded-[10px] flex gap-2.5 items-start"
          style={{ background: '#f2faf7', border: '1px solid #c6ebe2' }}
        >
          <Check size={16} strokeWidth={2.5} style={{ color: '#107a6d', marginTop: 1, flexShrink: 0 }} />
          <div className="text-[12.5px] leading-[1.55]" style={{ color: '#3a4641' }}>
            <strong>Meta compliance check passed.</strong>{' '}
            {template.category.charAt(0) + template.category.slice(1).toLowerCase()} category · no
            prohibited content detected. Submit for review when ready — approval typically takes
            1–24 hours.
          </div>
        </div>
      </div>

      {/* Right: live preview */}
      <div className="sticky top-0 self-start pt-1">
        <div
          className="text-center mb-2.5 font-bold uppercase tracking-[0.06em]"
          style={{ fontSize: 11.5, color: '#6b7671' }}
        >
          Live preview
        </div>
        <PhonePreview
          header={previewHeader || undefined}
          body={previewBody || 'Your template body appears here.'}
          footer={footer || undefined}
          buttons={previewButtons.length > 0 ? previewButtons : cta ? [{ type: 'URL', text: cta }] : undefined}
        />
        <div className="text-center mt-3" style={{ fontSize: 11, color: '#8a948f' }}>
          {variables.length > 0 ? 'Preview with entered sample values' : 'Preview with sample data'}
        </div>
      </div>
    </div>
  );
}

function FieldGroup({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-[18px]">
      <div
        className="flex items-center justify-between mb-1.5"
        style={{ fontSize: 11.5, fontWeight: 650, color: '#3a4641', textTransform: 'uppercase', letterSpacing: '0.05em' }}
      >
        <span>{label}</span>
        {hint && (
          <span style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 0, color: '#6b7671' }}>
            {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
