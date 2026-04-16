import { useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { ParameterMappingRow } from './ParameterMappingRow';
import { MessagePreviewBubble } from './MessagePreviewBubble';
import { TEMPLATE_OPTIONS, TIMING_OPTIONS } from '@/v2/lib/v2-mock-data';
import type { V2Flow, V2ParameterMapping } from '@/v2/lib/v2-mock-data';

interface ConfigureFlowModalProps {
  flow: V2Flow | null;
  onClose: () => void;
  onSave: (updated: V2Flow) => void;
}

/**
 * Desktop configure/edit modal.
 * Matches the Stitch "Edit Order Confirmed" dialog design exactly:
 * - Template picker
 * - Timing selector
 * - Parameter mapping rows
 * - WhatsApp message preview
 * - Cancel + Save footer
 */
export function ConfigureFlowModal({
  flow,
  onClose,
  onSave,
}: ConfigureFlowModalProps): React.ReactElement | null {
  const [templateName, setTemplateName] = useState(flow?.templateName ?? TEMPLATE_OPTIONS[0]);
  const [timing, setTiming] = useState(flow?.timing ?? 'Immediate');
  const [mapping, setMapping] = useState<V2ParameterMapping[]>(
    flow?.parameterMapping ?? [],
  );

  const handleMappingChange = useCallback((index: number, path: string) => {
    setMapping((prev) => prev.map((m, i) => (i === index ? { ...m, shopifyPath: path } : m)));
  }, []);

  const handleSave = useCallback(() => {
    if (!flow) return;
    onSave({ ...flow, templateName, timing, parameterMapping: mapping });
    onClose();
  }, [flow, templateName, timing, mapping, onSave, onClose]);

  if (!flow) return null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal panel */}
      <div className="bg-white w-full max-w-[420px] rounded-xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 border-b border-stitch-surface-low flex justify-between items-center">
          <h3 className="text-lg font-bold text-stitch-on-surface">
            Edit {flow.name}
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
              Choose a Template
            </label>
            <select
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="w-full h-11 px-3 bg-stitch-surface-low border-none rounded-lg text-sm text-stitch-on-surface focus:outline-none focus:ring-2 focus:ring-stitch-primary-container"
            >
              {TEMPLATE_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Timing selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-stitch-on-surface-variant">
              Timing
            </label>
            <select
              value={timing}
              onChange={(e) => setTiming(e.target.value)}
              className="w-full h-11 px-3 bg-stitch-surface-low border-none rounded-lg text-sm text-stitch-on-surface focus:outline-none focus:ring-2 focus:ring-stitch-primary-container"
            >
              {TIMING_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Parameter Mapping */}
          {mapping.length > 0 && (
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-stitch-on-surface-variant">
                Parameter Mapping
              </label>
              <div className="space-y-3">
                {mapping.map((row, i) => (
                  <ParameterMappingRow
                    key={row.label}
                    label={row.label}
                    shopifyPath={row.shopifyPath}
                    onPathChange={(path) => handleMappingChange(i, path)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Message Preview */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-stitch-on-surface-variant">
              Message Preview
            </label>
            <MessagePreviewBubble message={flow.messagePreview} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-stitch-surface-lowest border-t border-stitch-surface-low flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-stitch-outline text-stitch-on-surface hover:bg-stitch-surface-low transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-stitch-primary-container text-white hover:opacity-90 shadow-sm transition-all active:scale-95"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
