import { useState, useCallback, useMemo } from 'react';
import { X } from 'lucide-react';
import { ParameterMappingRow } from './ParameterMappingRow';
import { MessagePreviewBubble } from './MessagePreviewBubble';
import { extractBodyText, detectVariables, extractUrlButtonVars } from '@/lib/automation-utils';
import type { Template } from '@/types';
import type { V2Flow } from '@/v2/types';

const DELAY_OPTIONS = [
  { value: 1,   label: '1 minute (testing)' },
  { value: 60,  label: '1 hour after confirmation' },
  { value: 180, label: '3 hours after confirmation' },
  { value: 300, label: '5 hours after confirmation' },
] as const;

interface ConfigureFlowModalProps {
  flow: V2Flow | null;
  approvedTemplates: Template[];
  onClose: () => void;
  onSave: (
    flowId: string,
    templateId: string,
    variableMapping: Record<string, string>,
    delayMinutes?: number,
  ) => Promise<void>;
}

export function ConfigureFlowModal({
  flow,
  approvedTemplates,
  onClose,
  onSave,
}: ConfigureFlowModalProps): React.ReactElement | null {
  const [selectedTemplateId, setSelectedTemplateId] = useState(flow?.templateId ?? '');
  const [varMapping, setVarMapping] = useState<Record<string, string>>(
    flow?.variableMapping ?? {},
  );
  const [selectedDelay, setSelectedDelay] = useState<number>(flow?.delayMinutes ?? 60);
  const [saving, setSaving] = useState(false);

  const isFollowUp = flow?.shopifyEvent === 'COD_ORDER_FOLLOW_UP';

  const selectedTemplate = useMemo(
    () => approvedTemplates.find((t) => t.id === selectedTemplateId) ?? null,
    [approvedTemplates, selectedTemplateId],
  );

  const bodyText = useMemo(
    () => (selectedTemplate ? extractBodyText(selectedTemplate.components) : flow?.messagePreview ?? ''),
    [selectedTemplate, flow?.messagePreview],
  );

  const bodyVars = useMemo(
    () => (selectedTemplate ? detectVariables(bodyText) : []),
    [selectedTemplate, bodyText],
  );

  const urlVars = useMemo(
    () => (selectedTemplate ? extractUrlButtonVars(selectedTemplate.components) : []),
    [selectedTemplate],
  );

  const handleTemplateChange = useCallback((newTemplateId: string) => {
    setSelectedTemplateId(newTemplateId);
  }, []);

  const handlePathChange = useCallback((key: string, path: string) => {
    setVarMapping((prev) => ({ ...prev, [key]: path }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!flow || !selectedTemplateId) return;
    setSaving(true);
    try {
      await onSave(
        flow.id,
        selectedTemplateId,
        varMapping,
        isFollowUp ? selectedDelay : undefined,
      );
      onClose();
    } finally {
      setSaving(false);
    }
  }, [flow, selectedTemplateId, varMapping, isFollowUp, selectedDelay, onSave, onClose]);

  if (!flow) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white w-full max-w-[440px] rounded-xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 border-b border-stitch-surface-low flex justify-between items-center">
          <h3 className="text-lg font-bold text-stitch-on-surface">
            Configure: {flow.name}
          </h3>
          <button
            onClick={onClose}
            className="text-stitch-on-surface-variant hover:text-stitch-on-surface transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">

          {/* Template selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-stitch-on-surface-variant">
              Template
            </label>
            {approvedTemplates.length === 0 ? (
              <p className="text-sm text-stitch-on-surface-variant italic">
                No approved templates yet. Create and get a template approved first.
              </p>
            ) : (
              <select
                value={selectedTemplateId}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full h-11 px-3 bg-stitch-surface-low border-none rounded-lg text-sm text-stitch-on-surface focus:outline-none focus:ring-2 focus:ring-stitch-primary-container"
              >
                <option value="">— choose a template —</option>
                {approvedTemplates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Timing — editable select for COD_ORDER_FOLLOW_UP, read-only for all others */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-stitch-on-surface-variant">
              Timing
            </label>
            {isFollowUp ? (
              <>
                <select
                  value={selectedDelay}
                  onChange={(e) => setSelectedDelay(Number(e.target.value))}
                  className="w-full h-11 px-3 bg-stitch-surface-low border-none rounded-lg text-sm text-stitch-on-surface focus:outline-none focus:ring-2 focus:ring-stitch-primary-container"
                >
                  {DELAY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <p className="text-xs text-stitch-on-surface-variant">
                  Follow-up is only sent if the customer has not replied to the COD confirmation.
                </p>
              </>
            ) : (
              <div className="h-11 px-3 flex items-center bg-stitch-surface-container rounded-lg text-sm text-stitch-on-surface-variant">
                {flow.timing}
              </div>
            )}
          </div>

          {/* Parameter Mapping */}
          {(bodyVars.length > 0 || urlVars.length > 0) && (
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-stitch-on-surface-variant">
                Parameter Mapping
              </label>
              <div className="space-y-3">
                {bodyVars.map((v) => (
                  <ParameterMappingRow
                    key={v}
                    label={`{{${v}}}`}
                    shopifyPath={varMapping[v] ?? ''}
                    onPathChange={(path) => handlePathChange(v, path)}
                  />
                ))}
                {urlVars.map((uv) => (
                  <ParameterMappingRow
                    key={uv.key}
                    label={`{{${uv.varPos}}} (${uv.buttonLabel})`}
                    shopifyPath={varMapping[uv.key] ?? ''}
                    onPathChange={(path) => handlePathChange(uv.key, path)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Message Preview */}
          {bodyText && (
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-stitch-on-surface-variant">
                Message Preview
              </label>
              <MessagePreviewBubble message={bodyText} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-stitch-surface-lowest border-t border-stitch-surface-low flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-stitch-outline text-stitch-on-surface hover:bg-stitch-surface-low transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !selectedTemplateId}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-stitch-primary-container text-white hover:opacity-90 shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
