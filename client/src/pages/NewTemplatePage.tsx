import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Check, X, ExternalLink, Phone, Copy } from 'lucide-react';
import { useTemplates, type CreateTemplateInput, type TemplateComponentInput, type TemplateButtonInput } from '@/hooks/use-templates';
import { toast } from '@/hooks/use-toast';
import { PhonePreview } from '@/components/templates/PhonePreview';
import { extractVariables } from '@/lib/template-utils';

interface DialogButton {
  type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | 'COPY_CODE';
  text: string;
  url: string;
  phone_number: string;
  example: string;
}

function makeButton(type: DialogButton['type']): DialogButton {
  return { type, text: '', url: '', phone_number: '', example: '' };
}

function substituteWithSamples(text: string, samples: string[]): string {
  return text.replace(/\{\{(\d+)\}\}/g, (_match, numStr: string) => {
    const idx = parseInt(numStr, 10) - 1;
    return samples[idx]?.trim() || _match;
  });
}

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
      style={{ background: enabled ? '#107a6d' : '#e3e6e0' }}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-4' : 'translate-x-0.5'}`}
      />
    </button>
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
        style={{
          fontSize: 11.5,
          fontWeight: 650,
          color: '#3a4641',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
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

export default function NewTemplatePage() {
  const navigate = useNavigate();
  const { createTemplate } = useTemplates();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [language, setLanguage] = useState('en');
  const [category, setCategory] = useState<'MARKETING' | 'UTILITY' | 'AUTHENTICATION'>('MARKETING');

  const [headerEnabled, setHeaderEnabled] = useState(false);
  const [headerText, setHeaderText] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [bodySamples, setBodySamples] = useState<string[]>([]);
  const [footerEnabled, setFooterEnabled] = useState(false);
  const [footerText, setFooterText] = useState('');

  const [buttonsEnabled, setButtonsEnabled] = useState(false);
  const [buttonGroup, setButtonGroup] = useState<'QUICK_REPLY' | 'CTA'>('QUICK_REPLY');
  const [buttons, setButtons] = useState<DialogButton[]>([]);

  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const detectedVars = extractVariables(bodyText);

  const syncSamples = (newBodyText: string) => {
    const vars = extractVariables(newBodyText);
    setBodySamples((prev) => {
      const next = [...prev];
      while (next.length < vars.length) next.push('');
      return next.slice(0, vars.length);
    });
  };

  const handleBodyChange = (val: string) => {
    setBodyText(val);
    syncSamples(val);
  };

  const insertVariable = () => {
    const nextNum = extractVariables(bodyText).length + 1;
    const variable = `{{${nextNum}}}`;
    if (bodyRef.current) {
      const start = bodyRef.current.selectionStart ?? bodyText.length;
      const end = bodyRef.current.selectionEnd ?? bodyText.length;
      const newText = bodyText.slice(0, start) + variable + bodyText.slice(end);
      handleBodyChange(newText);
      setTimeout(() => {
        if (bodyRef.current) {
          const pos = start + variable.length;
          bodyRef.current.setSelectionRange(pos, pos);
          bodyRef.current.focus();
        }
      }, 0);
    } else {
      handleBodyChange(bodyText + variable);
    }
  };

  const addButton = (type: DialogButton['type']) => setButtons((prev) => [...prev, makeButton(type)]);
  const updateButton = (index: number, patch: Partial<DialogButton>) =>
    setButtons((prev) => prev.map((b, i) => (i === index ? { ...b, ...patch } : b)));
  const removeButton = (index: number) => setButtons((prev) => prev.filter((_, i) => i !== index));
  const handleButtonGroupChange = (group: 'QUICK_REPLY' | 'CTA') => {
    setButtonGroup(group);
    setButtons([]);
  };

  const nameValid = name.trim() !== '' && /^[a-z0-9_]+$/.test(name);
  const samplesValid = detectedVars.length === 0 || bodySamples.every((s) => s.trim() !== '');
  const buttonsValid = (() => {
    if (!buttonsEnabled) return true;
    if (buttons.length === 0) return false;
    return buttons.every((btn) => {
      if (!btn.text.trim()) return false;
      if (btn.type === 'URL' && !btn.url.trim()) return false;
      if (btn.type === 'PHONE_NUMBER' && !btn.phone_number.trim()) return false;
      if (btn.type === 'COPY_CODE' && !btn.example.trim()) return false;
      return true;
    });
  })();
  const isValid = nameValid && bodyText.trim() !== '' && samplesValid && buttonsValid;

  const handleSubmit = async () => {
    const components: TemplateComponentInput[] = [];
    if (headerEnabled && headerText.trim()) {
      components.push({ type: 'HEADER', format: 'TEXT', text: headerText.trim() });
    }
    const bodyComp: TemplateComponentInput = { type: 'BODY', text: bodyText.trim() };
    if (bodySamples.length > 0) bodyComp.example = bodySamples.map((s) => s.trim());
    components.push(bodyComp);
    if (footerEnabled && footerText.trim()) {
      components.push({ type: 'FOOTER', text: footerText.trim() });
    }
    if (buttonsEnabled && buttons.length > 0) {
      const btnInputs: TemplateButtonInput[] = buttons.map((btn) => {
        const base: TemplateButtonInput = { type: btn.type, text: btn.text.trim() };
        if (btn.type === 'URL') {
          base.url = btn.url.trim();
          if (btn.example.trim()) base.example = btn.example.trim();
        }
        if (btn.type === 'PHONE_NUMBER') base.phone_number = btn.phone_number.trim();
        if (btn.type === 'COPY_CODE') base.example = btn.example.trim();
        return base;
      });
      components.push({ type: 'BUTTONS', buttons: btnInputs });
    }

    const input: CreateTemplateInput = {
      name: name.trim(),
      language,
      category,
      components,
    };

    setSubmitError(null);
    setSubmitting(true);
    try {
      await createTemplate(input);
      toast({ title: 'Template submitted', description: 'Awaiting Meta approval.' });
      navigate('/templates');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create template');
    } finally {
      setSubmitting(false);
    }
  };

  const urlBtn = buttons.find((b) => b.type === 'URL');
  const phoneBtn = buttons.find((b) => b.type === 'PHONE_NUMBER');
  const copyBtn = buttons.find((b) => b.type === 'COPY_CODE');
  const urlBtnIndex = buttons.findIndex((b) => b.type === 'URL');
  const phoneBtnIndex = buttons.findIndex((b) => b.type === 'PHONE_NUMBER');
  const copyBtnIndex = buttons.findIndex((b) => b.type === 'COPY_CODE');
  const isDynamicUrl = urlBtn ? /\{\{1\}\}/.test(urlBtn.url) : false;
  const quickReplies = buttons.filter((b) => b.type === 'QUICK_REPLY');

  const previewHeader = substituteWithSamples(headerEnabled ? headerText : '', bodySamples) || undefined;
  const previewBody = substituteWithSamples(bodyText, bodySamples) || 'Your template body appears here.';
  const previewButtons: { type: 'URL' | 'PHONE_NUMBER' | 'QUICK_REPLY' | 'COPY_CODE'; text: string }[] =
    buttonsEnabled
      ? buttons.filter((b) => b.text.trim()).map((b) => ({ type: b.type, text: b.text }))
      : [];

  return (
    <div className="flex flex-col h-full">
      {/* Topbar */}
      <div
        className="flex items-center gap-3 px-5 border-b border-border bg-card flex-shrink-0"
        style={{ height: 56 }}
      >
        <button
          className="inline-flex items-center gap-1 text-[13px] font-semibold border-none bg-transparent p-0 cursor-pointer"
          style={{ color: '#107a6d' }}
          onClick={() => navigate('/templates')}
        >
          <ChevronLeft size={16} />
          Templates
        </button>
        <span style={{ color: '#b4bcb7', fontSize: 16 }}>/</span>
        <span className="text-[16px] font-[650] tracking-tight" style={{ color: '#1b2420' }}>
          New Template
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden px-5 md:px-7 pt-5 pb-8">
        <div className="grid gap-5 h-full" style={{ gridTemplateColumns: 'minmax(0, 1fr) 340px' }}>
          {/* Left: form */}
          <div className="bg-card border border-border rounded-[14px] px-6 py-5 overflow-y-auto">
            {/* Template Name */}
            <FieldGroup label="Template Name">
              <input
                className="w-full px-[11px] py-2 border border-border rounded-[8px] bg-[#fbfcfa] font-mono text-[13px] outline-none transition-[border-color,box-shadow] focus:border-[#17a398] focus:shadow-[0_0_0_3px_#e7f5f1]"
                style={{ color: '#1b2420' }}
                placeholder="e.g. order_confirmed"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {name && !/^[a-z0-9_]+$/.test(name) ? (
                <p className="mt-1 text-[11.5px]" style={{ color: '#a9384d' }}>
                  Only lowercase letters, numbers, and underscores
                </p>
              ) : (
                <p className="mt-1 text-[11.5px]" style={{ color: '#6b7671' }}>
                  Lowercase letters and underscores only, e.g.{' '}
                  <span className="font-mono">order_confirmed</span>
                </p>
              )}
            </FieldGroup>

            {/* Category */}
            <FieldGroup label="Category">
              <div className="flex gap-1.5 flex-wrap">
                {(['MARKETING', 'UTILITY', 'AUTHENTICATION'] as const).map((cat) => (
                  <span
                    key={cat}
                    className="px-2.5 py-1 border rounded-full text-[12px] font-semibold cursor-pointer transition-colors"
                    style={
                      category === cat
                        ? { borderColor: '#128c7e', background: '#e7f5f1', color: '#0b5d54' }
                        : { borderColor: '#e3e6e0', background: '#fff', color: '#6b7671' }
                    }
                    onClick={() => setCategory(cat)}
                  >
                    {cat.charAt(0) + cat.slice(1).toLowerCase()}
                  </span>
                ))}
              </div>
            </FieldGroup>

            {/* Language */}
            <FieldGroup label="Language">
              <div className="flex gap-1.5 flex-wrap">
                {([['en', 'English (en)'], ['en_US', 'English US (en_US)'], ['hi', 'Hindi (hi)']] as const).map(([val, label]) => (
                  <span
                    key={val}
                    className="px-2.5 py-1 border rounded-full text-[12px] font-semibold cursor-pointer transition-colors"
                    style={
                      language === val
                        ? { borderColor: '#128c7e', background: '#e7f5f1', color: '#0b5d54' }
                        : { borderColor: '#e3e6e0', background: '#fff', color: '#6b7671' }
                    }
                    onClick={() => setLanguage(val)}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </FieldGroup>

            {/* Header */}
            <FieldGroup label="Header" hint="Optional · Text · 60 char max">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px]" style={{ color: '#6b7671' }}>
                  Enable header
                </span>
                <Toggle enabled={headerEnabled} onToggle={() => setHeaderEnabled((v) => !v)} />
              </div>
              {headerEnabled && (
                <input
                  className="w-full px-[11px] py-2 border border-border rounded-[8px] bg-[#fbfcfa] text-[13px] outline-none transition-[border-color,box-shadow] focus:border-[#17a398] focus:shadow-[0_0_0_3px_#e7f5f1]"
                  style={{ color: '#1b2420' }}
                  placeholder="Header text"
                  value={headerText}
                  onChange={(e) => setHeaderText(e.target.value)}
                  maxLength={60}
                />
              )}
            </FieldGroup>

            {/* Body */}
            <FieldGroup label="Body" hint="Required · 1,024 char max">
              <textarea
                ref={bodyRef}
                className="w-full px-[11px] py-2 border border-border rounded-[8px] bg-[#fbfcfa] text-[13px] outline-none resize-y transition-[border-color,box-shadow] focus:border-[#17a398] focus:shadow-[0_0_0_3px_#e7f5f1]"
                style={{ color: '#1b2420', minHeight: 110, lineHeight: 1.55 }}
                placeholder="Hello {{1}}, your order {{2}} has been confirmed."
                value={bodyText}
                onChange={(e) => handleBodyChange(e.target.value)}
                maxLength={1024}
              />
              <div
                className="mt-2 flex items-center gap-2 flex-wrap text-[11.5px]"
                style={{ color: '#6b7671' }}
              >
                <span>Variables:</span>
                {detectedVars.map((v, i) => (
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
                  onClick={insertVariable}
                  type="button"
                >
                  <Plus size={11} strokeWidth={2.5} />
                  Variable
                </button>
              </div>
            </FieldGroup>

            {/* Sample values */}
            {detectedVars.length > 0 && (
              <FieldGroup label="Sample Values" hint="Required by Meta for review">
                <div
                  className="rounded-[10px] p-3 space-y-2"
                  style={{ background: '#f2faf7', border: '1px solid #c6ebe2' }}
                >
                  <p className="text-[12px] mb-2" style={{ color: '#3a4641' }}>
                    Provide a realistic example for each variable. These are shown to Meta reviewers.
                  </p>
                  {detectedVars.map((v, i) => (
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
              </FieldGroup>
            )}

            {/* Footer */}
            <FieldGroup label="Footer" hint="Optional · 60 char max">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px]" style={{ color: '#6b7671' }}>
                  Enable footer
                </span>
                <Toggle enabled={footerEnabled} onToggle={() => setFooterEnabled((v) => !v)} />
              </div>
              {footerEnabled && (
                <input
                  className="w-full px-[11px] py-2 border border-border rounded-[8px] bg-[#fbfcfa] text-[13px] outline-none transition-[border-color,box-shadow] focus:border-[#17a398] focus:shadow-[0_0_0_3px_#e7f5f1]"
                  style={{ color: '#1b2420' }}
                  placeholder="e.g. Reply STOP to unsubscribe"
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  maxLength={60}
                />
              )}
            </FieldGroup>

            {/* Buttons */}
            <FieldGroup label="Buttons" hint="Optional">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px]" style={{ color: '#6b7671' }}>
                  Add interactive buttons
                </span>
                <Toggle enabled={buttonsEnabled} onToggle={() => setButtonsEnabled((v) => !v)} />
              </div>
              {buttonsEnabled && (
                <div
                  className="rounded-[10px] p-3 space-y-3"
                  style={{ background: '#fbfcfa', border: '1px solid #e3e6e0' }}
                >
                  <div className="flex rounded-[8px] border border-border overflow-hidden">
                    {(['QUICK_REPLY', 'CTA'] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => handleButtonGroupChange(g)}
                        className="flex-1 py-1.5 text-[12px] font-semibold transition-colors"
                        style={
                          buttonGroup === g
                            ? { background: '#107a6d', color: '#fff' }
                            : { background: 'transparent', color: '#6b7671' }
                        }
                      >
                        {g === 'QUICK_REPLY' ? 'Quick Replies' : 'Call to Action'}
                      </button>
                    ))}
                  </div>

                  {buttonGroup === 'QUICK_REPLY' && (
                    <div className="space-y-2">
                      <p className="text-[11.5px]" style={{ color: '#6b7671' }}>
                        Up to 3 quick reply buttons. Text max 25 characters.
                      </p>
                      {quickReplies.map((btn, qIdx) => {
                        const globalIdx = buttons.findIndex(
                          (b, bi) =>
                            b.type === 'QUICK_REPLY' &&
                            buttons.slice(0, bi).filter((x) => x.type === 'QUICK_REPLY').length ===
                              qIdx,
                        );
                        return (
                          <div key={qIdx} className="flex items-center gap-2">
                            <input
                              className="flex-1 px-[11px] py-1.5 border border-border rounded-[8px] bg-card text-[12px] outline-none"
                              style={{ color: '#1b2420' }}
                              placeholder="Quick reply text"
                              value={btn.text}
                              onChange={(e) => updateButton(globalIdx, { text: e.target.value })}
                              maxLength={25}
                            />
                            <span className="text-[11px] shrink-0" style={{ color: '#8a948f' }}>
                              {btn.text.length}/25
                            </span>
                            <button
                              type="button"
                              className="w-7 h-7 grid place-items-center rounded-[6px] transition-colors hover:bg-[#fbe5e8]"
                              style={{ color: '#a9384d' }}
                              onClick={() => removeButton(globalIdx)}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        );
                      })}
                      {quickReplies.length < 3 && (
                        <button
                          type="button"
                          className="w-full py-1.5 border border-dashed border-border rounded-[8px] text-[12px] font-semibold flex items-center justify-center gap-1 transition-colors hover:bg-[#eff1ed]"
                          style={{ color: '#6b7671' }}
                          onClick={() => addButton('QUICK_REPLY')}
                        >
                          <Plus size={12} /> Add Quick Reply
                        </button>
                      )}
                    </div>
                  )}

                  {buttonGroup === 'CTA' && (
                    <div className="space-y-3">
                      <p className="text-[11.5px]" style={{ color: '#6b7671' }}>
                        Add URL and/or phone number buttons.
                      </p>

                      {/* URL */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label
                            className="text-[12px] font-semibold flex items-center gap-1"
                            style={{ color: '#3a4641' }}
                          >
                            <ExternalLink size={12} /> Visit Website
                          </label>
                          <Toggle
                            enabled={!!urlBtn}
                            onToggle={() => {
                              if (urlBtn) removeButton(urlBtnIndex);
                              else addButton('URL');
                            }}
                          />
                        </div>
                        {urlBtn && (
                          <div className="space-y-1.5 pl-2 border-l-2" style={{ borderColor: '#e3e6e0' }}>
                            <input
                              className="w-full px-[11px] py-1.5 border border-border rounded-[8px] bg-card text-[12px] outline-none"
                              style={{ color: '#1b2420' }}
                              placeholder="Button text (max 25 chars)"
                              value={urlBtn.text}
                              onChange={(e) => updateButton(urlBtnIndex, { text: e.target.value })}
                              maxLength={25}
                            />
                            <input
                              className="w-full px-[11px] py-1.5 border border-border rounded-[8px] bg-card text-[12px] font-mono outline-none"
                              style={{ color: '#1b2420' }}
                              placeholder="https://example.com/order/{{1}}"
                              value={urlBtn.url}
                              onChange={(e) => updateButton(urlBtnIndex, { url: e.target.value })}
                            />
                            {isDynamicUrl && (
                              <input
                                className="w-full px-[11px] py-1.5 border border-border rounded-[8px] bg-card text-[12px] outline-none"
                                style={{ color: '#1b2420' }}
                                placeholder="Example URL (e.g. https://example.com/order/12345)"
                                value={urlBtn.example}
                                onChange={(e) => updateButton(urlBtnIndex, { example: e.target.value })}
                              />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Phone */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label
                            className="text-[12px] font-semibold flex items-center gap-1"
                            style={{ color: '#3a4641' }}
                          >
                            <Phone size={12} /> Call Phone Number
                          </label>
                          <Toggle
                            enabled={!!phoneBtn}
                            onToggle={() => {
                              if (phoneBtn) removeButton(phoneBtnIndex);
                              else addButton('PHONE_NUMBER');
                            }}
                          />
                        </div>
                        {phoneBtn && (
                          <div className="space-y-1.5 pl-2 border-l-2" style={{ borderColor: '#e3e6e0' }}>
                            <input
                              className="w-full px-[11px] py-1.5 border border-border rounded-[8px] bg-card text-[12px] outline-none"
                              style={{ color: '#1b2420' }}
                              placeholder="Button text (max 25 chars)"
                              value={phoneBtn.text}
                              onChange={(e) => updateButton(phoneBtnIndex, { text: e.target.value })}
                              maxLength={25}
                            />
                            <input
                              className="w-full px-[11px] py-1.5 border border-border rounded-[8px] bg-card text-[12px] font-mono outline-none"
                              style={{ color: '#1b2420' }}
                              placeholder="+919876543210"
                              value={phoneBtn.phone_number}
                              onChange={(e) =>
                                updateButton(phoneBtnIndex, { phone_number: e.target.value })
                              }
                            />
                          </div>
                        )}
                      </div>

                      {/* Copy Code (AUTHENTICATION only) */}
                      {category === 'AUTHENTICATION' && (
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label
                              className="text-[12px] font-semibold flex items-center gap-1"
                              style={{ color: '#3a4641' }}
                            >
                              <Copy size={12} /> Copy Code
                            </label>
                            <Toggle
                              enabled={!!copyBtn}
                              onToggle={() => {
                                if (copyBtn) removeButton(copyBtnIndex);
                                else addButton('COPY_CODE');
                              }}
                            />
                          </div>
                          {copyBtn && (
                            <div className="space-y-1.5 pl-2 border-l-2" style={{ borderColor: '#e3e6e0' }}>
                              <input
                                className="w-full px-[11px] py-1.5 border border-border rounded-[8px] bg-card text-[12px] font-mono outline-none"
                                style={{ color: '#1b2420' }}
                                placeholder="Example code (e.g. 123456)"
                                value={copyBtn.example}
                                onChange={(e) =>
                                  updateButton(copyBtnIndex, { example: e.target.value })
                                }
                              />
                              <p className="text-[11.5px]" style={{ color: '#6b7671' }}>
                                Used as a sample code during Meta review. Actual code sent dynamically.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </FieldGroup>

            {/* Submit */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-border mt-4">
              {submitError && (
                <p className="text-[12px] flex-1" style={{ color: '#a9384d' }}>{submitError}</p>
              )}
              <button
                className="inline-flex items-center gap-1.5 px-4 py-[8px] rounded-[8px] text-[13px] font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none"
                style={{ background: '#107a6d', color: '#fff', border: '1px solid #0b5d54' }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#0b5d54')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#107a6d')}
                onClick={() => void handleSubmit()}
                disabled={!isValid || submitting}
              >
                <Check size={13} strokeWidth={2.5} />
                {submitting ? 'Submitting…' : 'Submit Template'}
              </button>
            </div>
          </div>

          {/* Right: live preview */}
          <div className="sticky top-0 self-start pt-1">
            <div
              className="text-center mb-2.5 font-bold uppercase tracking-[0.06em]"
              style={{ fontSize: 11.5, color: '#6b7671' }}
            >
              Live Preview
            </div>
            <PhonePreview
              header={previewHeader}
              body={previewBody}
              footer={footerEnabled ? footerText : undefined}
              buttons={previewButtons.length > 0 ? previewButtons : undefined}
            />
            <div className="text-center mt-3" style={{ fontSize: 11, color: '#8a948f' }}>
              {detectedVars.length > 0 ? 'Preview with entered sample values' : 'Preview with sample data'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
