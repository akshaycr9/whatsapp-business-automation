import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { useAutomations } from '@/hooks/use-automations';
import { extractBodyText, detectVariables, extractUrlButtonVars } from '@/lib/automation-utils';
import { SHOPIFY_PATH_OPTIONS, groupPathOptions } from '@/lib/shopify-paths';
import { RAZORPAY_PATH_OPTIONS } from '@/lib/razorpay-paths';
import { PhonePreview, type PhoneButton } from '@/components/templates/PhonePreview';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Template } from '@/types';
import { cn } from '@/lib/utils';

// ── Delay options ─────────────────────────────────────────────────────────────

const COD_FOLLOW_UP_DELAY_OPTIONS = [
  { value: 1,   label: '1 minute (testing)' },
  { value: 60,  label: '1 hour after confirmation' },
  { value: 180, label: '3 hours after confirmation' },
  { value: 300, label: '5 hours after confirmation' },
] as const;

const ABANDONED_CART_DELAY_OPTIONS_BASE = [
  { value: 30,   label: '30 minutes' },
  { value: 60,   label: '1 hour' },
  { value: 180,  label: '3 hours' },
  { value: 360,  label: '6 hours' },
  { value: 720,  label: '12 hours' },
  { value: 1440, label: '24 hours' },
];

const ABANDONED_CART_DELAY_OPTIONS = import.meta.env.DEV
  ? [
      { value: 1, label: '1 minute (testing)' },
      { value: 5, label: '5 minutes (testing)' },
      ...ABANDONED_CART_DELAY_OPTIONS_BASE,
    ]
  : ABANDONED_CART_DELAY_OPTIONS_BASE;

// ── Template component helpers ────────────────────────────────────────────────

function extractHeaderText(components: unknown): string {
  if (!Array.isArray(components)) return '';
  const header = (components as Array<{ type: string; format?: string; text?: string }>).find(
    (c) => c.type === 'HEADER' && c.format === 'TEXT',
  );
  return header?.text ?? '';
}

function extractFooterText(components: unknown): string {
  if (!Array.isArray(components)) return '';
  const footer = (components as Array<{ type: string; text?: string }>).find(
    (c) => c.type === 'FOOTER',
  );
  return footer?.text ?? '';
}

function extractPhoneButtons(components: unknown): PhoneButton[] {
  if (!Array.isArray(components)) return [];
  const buttonsComp = (
    components as Array<{ type: string; buttons?: Array<{ type: string; text: string }> }>
  ).find((c) => c.type === 'BUTTONS');
  if (!buttonsComp?.buttons) return [];
  return buttonsComp.buttons
    .filter((b) => b.text?.trim())
    .map((b) => ({ type: b.type as PhoneButton['type'], text: b.text }));
}

// ── Preview body builder ──────────────────────────────────────────────────────

function buildPreviewBodyNodes(
  text: string,
  mapping: Record<string, string>,
  findLabel: (path: string) => string,
): React.ReactNode {
  if (!text) return 'Your message preview will appear here.';
  const parts = text.split(/(\{\{\d+\}\})/);
  return parts.map((part, i) => {
    const m = part.match(/^\{\{(\d+)\}\}$/);
    if (!m) return part;
    const varPos = m[1];
    const path = mapping[varPos];
    if (path) {
      return (
        <strong key={i} style={{ fontWeight: 700, color: '#0b5d54' }}>
          [{findLabel(path)}]
        </strong>
      );
    }
    return (
      <span key={i} style={{ color: '#9aa39e', fontStyle: 'italic' }}>
        {part}
      </span>
    );
  });
}

// ── Section card ──────────────────────────────────────────────────────────────

function SectionCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-5 py-3 border-b border-border bg-surface-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-400">
          {label}
        </span>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

// ── Parameter mapping row ─────────────────────────────────────────────────────

interface MappingRowProps {
  label: string;
  path: string;
  isAbandonedCart: boolean;
  onChange: (path: string) => void;
}

function MappingRow({ label, path, isAbandonedCart, onChange }: MappingRowProps) {
  const options = isAbandonedCart ? RAZORPAY_PATH_OPTIONS : SHOPIFY_PATH_OPTIONS;
  const grouped = useMemo(() => groupPathOptions(options), [options]);

  return (
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0 w-32 px-3 py-2 bg-surface-2 border border-border rounded-md text-[12.5px] text-ink-700 font-mono truncate">
        {label}
      </div>
      <ArrowRight className="w-4 h-4 text-ink-300 flex-shrink-0" />
      <div className="flex-1">
        <select
          value={path}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-9 px-3 bg-surface-2 border border-border rounded-md text-[12.5px] text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
        >
          <option value="">— select a field —</option>
          {Array.from(grouped.entries()).map(([group, opts]) => (
            <optgroup key={group} label={group}>
              {opts.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </optgroup>
          ))}
          {path && !options.some((o) => o.value === path) && (
            <optgroup label="Custom">
              <option value={path}>{path}</option>
            </optgroup>
          )}
        </select>
      </div>
    </div>
  );
}

// ── Template selector ─────────────────────────────────────────────────────────

interface TemplateSelectorProps {
  value: string;
  templates: Template[];
  onChange: (id: string) => void;
}

function TemplateSelector({ value, templates, onChange }: TemplateSelectorProps) {
  if (templates.length === 0) {
    return (
      <p className="text-sm text-ink-400 italic">
        No approved templates available. Create and approve a template to send messages. You can still configure the automation and select a template later.
      </p>
    );
  }
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-10 px-3 bg-surface-2 border border-border rounded-md text-[13px] text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
    >
      <option value="">— choose a template —</option>
      {templates.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name}
        </option>
      ))}
    </select>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function EditPageSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <div className="h-14 border-b border-border bg-card flex items-center px-5 gap-4 flex-shrink-0 animate-pulse">
        <div className="w-8 h-8 bg-surface-sunken rounded-md" />
        <div className="h-4 w-40 bg-surface-sunken rounded" />
        <div className="flex-1" />
        <div className="h-8 w-20 bg-surface-sunken rounded-md" />
        <div className="h-8 w-28 bg-surface-sunken rounded-md" />
      </div>
      <div className="flex-1 overflow-hidden px-5 md:px-7 pt-5 pb-8">
        <div
          className="grid gap-5 h-full animate-pulse"
          style={{ gridTemplateColumns: 'minmax(0, 1fr) 340px' }}
        >
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-lg h-24" />
            <div className="bg-card border border-border rounded-lg h-24" />
            <div className="bg-card border border-border rounded-lg h-32" />
          </div>
          <div className="bg-card border border-border rounded-lg h-[510px]" />
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EditAutomationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { categories, approvedTemplates, loading, updateAutomation } = useAutomations();

  const automation = useMemo(
    () => categories.flatMap((c) => c.automations).find((a) => a.id === id) ?? null,
    [categories, id],
  );

  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [varMapping, setVarMapping] = useState<Record<string, string>>({});
  const [selectedDelay, setSelectedDelay] = useState<number>(60);
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (automation && !initialized) {
      setSelectedTemplateId(automation.templateId ?? '');
      setVarMapping(automation.variableMapping);
      setSelectedDelay(automation.delayMinutes ?? 60);
      setInitialized(true);
    }
  }, [automation, initialized]);

  useEffect(() => {
    if (!loading && !automation && initialized === false) {
      const t = setTimeout(() => {
        if (!automation) navigate('/automations', { replace: true });
      }, 500);
      return () => clearTimeout(t);
    }
  }, [loading, automation, initialized, navigate]);

  const isAbandonedCart = automation?.shopifyEvent
    ? ['ABANDONED_CART_1', 'ABANDONED_CART_2', 'ABANDONED_CART_3'].includes(automation.shopifyEvent)
    : false;
  const isCODFollowUp = automation?.shopifyEvent === 'COD_ORDER_FOLLOW_UP';
  const showTimingSelect = isAbandonedCart || isCODFollowUp;
  const delayOptions = isAbandonedCart ? ABANDONED_CART_DELAY_OPTIONS : COD_FOLLOW_UP_DELAY_OPTIONS;

  const selectedTemplate = useMemo(
    () => approvedTemplates.find((t) => t.id === selectedTemplateId) ?? null,
    [approvedTemplates, selectedTemplateId],
  );

  const bodyText = useMemo(
    () =>
      selectedTemplate
        ? extractBodyText(selectedTemplate.components)
        : '',
    [selectedTemplate],
  );

  const bodyVars = useMemo(
    () => (selectedTemplate ? detectVariables(bodyText) : []),
    [selectedTemplate, bodyText],
  );

  const urlVars = useMemo(
    () => (selectedTemplate ? extractUrlButtonVars(selectedTemplate.components) : []),
    [selectedTemplate],
  );

  // ── Preview derivations ──────────────────────────────────────────────────────

  const previewHeader = useMemo(
    () => (selectedTemplate ? extractHeaderText(selectedTemplate.components) : ''),
    [selectedTemplate],
  );

  const previewFooter = useMemo(
    () => (selectedTemplate ? extractFooterText(selectedTemplate.components) : ''),
    [selectedTemplate],
  );

  const previewButtons = useMemo(
    () => (selectedTemplate ? extractPhoneButtons(selectedTemplate.components) : []),
    [selectedTemplate],
  );

  const pathOptions = useMemo(
    () => (isAbandonedCart ? RAZORPAY_PATH_OPTIONS : SHOPIFY_PATH_OPTIONS),
    [isAbandonedCart],
  );

  const findLabel = useCallback(
    (path: string) => pathOptions.find((o) => o.value === path)?.label ?? path,
    [pathOptions],
  );

  const previewBodyContent = useMemo(
    () => buildPreviewBodyNodes(bodyText, varMapping, findLabel),
    [bodyText, varMapping, findLabel],
  );

  // ── Handlers ──────────────────────────────────────────────────────────────────

  const handleTemplateChange = useCallback((newId: string) => {
    setSelectedTemplateId(newId);
  }, []);

  const handlePathChange = useCallback((key: string, path: string) => {
    setVarMapping((prev) => ({ ...prev, [key]: path }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!id || !automation) {
      setError('Automation not found');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updateData: Record<string, unknown> = {
        variableMapping: varMapping,
      };
      if (selectedTemplateId) {
        updateData.templateId = selectedTemplateId;
      }
      if (showTimingSelect) {
        updateData.delayMinutes = selectedDelay;
      }
      await updateAutomation(id, updateData as Partial<Record<string, unknown>>);
      navigate('/automations');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save automation');
    } finally {
      setSaving(false);
    }
  }, [id, automation, selectedTemplateId, varMapping, showTimingSelect, selectedDelay, updateAutomation, navigate]);

  if (loading || !automation) {
    return <EditPageSkeleton />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Topbar ── */}
      <div className="h-14 border-b border-border bg-card flex items-center px-5 gap-3 flex-shrink-0">
        <button
          onClick={() => navigate('/automations')}
          className="w-8 h-8 grid place-items-center rounded-md text-ink-700 hover:bg-surface-sunken transition-colors"
        >
          <ChevronLeft size={17} strokeWidth={2} />
        </button>
        <span className="text-[16px] font-[650] tracking-[-0.01em] text-ink-900">
          Edit Automation
        </span>
        <span className="text-[12.5px] text-ink-500 pl-3 ml-1 border-l border-border">
          {automation.name}
        </span>
        <div className="flex-1" />
        <button
          onClick={() => navigate('/automations')}
          disabled={saving}
          className="inline-flex items-center px-4 py-[7px] rounded-md bg-card border border-border text-ink-900 text-[13px] font-semibold hover:bg-surface-sunken hover:border-ink-300 transition-all disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
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

      {/* ── Two-column layout ── */}
      <div className="flex-1 overflow-hidden px-5 md:px-7 pt-5 pb-8">
        {/* Error alert */}
        {error && (
          <div className="mb-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}
        <div
          className="grid gap-5 h-full"
          style={{ gridTemplateColumns: 'minmax(0, 1fr) 340px' }}
        >
          {/* ── Left: form ── */}
          <div className="overflow-y-auto space-y-4 pr-1 pb-4">

            {/* Template */}
            <SectionCard label="Template (optional)">
              <TemplateSelector
                value={selectedTemplateId}
                templates={approvedTemplates}
                onChange={handleTemplateChange}
              />
            </SectionCard>

            {/* Timing */}
            <SectionCard label="Timing">
              {showTimingSelect ? (
                <div className="space-y-2">
                  <select
                    value={selectedDelay}
                    onChange={(e) => setSelectedDelay(Number(e.target.value))}
                    className="w-full h-10 px-3 bg-surface-2 border border-border rounded-md text-[13px] text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
                  >
                    {delayOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[12px] text-ink-400">
                    {isCODFollowUp
                      ? 'Follow-up is only sent if the customer has not replied to the COD confirmation.'
                      : 'Sent after the customer abandons their cart, relative to when they left.'}
                  </p>
                </div>
              ) : (
                <div className="h-10 px-3 flex items-center bg-surface-2 border border-border rounded-md text-[13px] text-ink-500">
                  Immediate
                </div>
              )}
            </SectionCard>

            {/* Parameter mapping */}
            {selectedTemplate && (bodyVars.length > 0 || urlVars.length > 0) && (
              <SectionCard label="Parameter Mapping">
                <div className="space-y-3">
                  <p className="text-[12px] text-ink-400 mb-1">
                    Map each variable to a field from Shopify. Mapped fields appear highlighted in the live preview.
                  </p>
                  {bodyVars.map((v) => (
                    <MappingRow
                      key={v}
                      label={`{{${v}}}`}
                      path={varMapping[v] ?? ''}
                      isAbandonedCart={isAbandonedCart}
                      onChange={(path) => handlePathChange(v, path)}
                    />
                  ))}
                  {urlVars.map((uv) => (
                    <MappingRow
                      key={uv.key}
                      label={`{{${uv.varPos}}} (${uv.buttonLabel})`}
                      path={varMapping[uv.key] ?? ''}
                      isAbandonedCart={isAbandonedCart}
                      onChange={(path) => handlePathChange(uv.key, path)}
                    />
                  ))}
                </div>
              </SectionCard>
            )}

          </div>

          {/* ── Right: live preview ── */}
          <div className="sticky top-0 self-start pt-1">
            <div
              className="text-center mb-2.5 font-bold uppercase tracking-[0.06em]"
              style={{ fontSize: 11.5, color: '#6b7671' }}
            >
              Live Preview
            </div>
            <PhonePreview
              header={previewHeader || undefined}
              body={bodyText}
              bodyContent={previewBodyContent}
              footer={previewFooter || undefined}
              buttons={previewButtons.length > 0 ? previewButtons : undefined}
            />
            <div className="text-center mt-3" style={{ fontSize: 11, color: '#8a948f' }}>
              {bodyVars.length > 0
                ? 'Mapped fields shown in [brackets]'
                : selectedTemplate
                  ? 'No variables in this template'
                  : 'Select a template to preview'}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
