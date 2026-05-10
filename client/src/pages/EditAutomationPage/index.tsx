import { AlertCircle } from 'lucide-react';
import { useEditAutomationPage } from '@/hooks/useEditAutomationPage';
import { EditTopbar } from '@/components/automations/EditTopbar';
import { EditPageSkeleton } from '@/components/automations/EditPageSkeleton';
import { SectionCard } from '@/components/automations/SectionCard';
import { TemplateSelector } from '@/components/automations/TemplateSelector';
import { MappingRow } from '@/components/automations/MappingRow';
import { PhonePreview } from '@/components/templates/PhonePreview';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function EditAutomationPage() {
  const {
    loading,
    automationNotFound,
    automationName,
    selectedTemplateId,
    varMapping,
    selectedDelay,
    saving,
    error,
    showTimingSelect,
    isCODFollowUp,
    delayOptions,
    approvedTemplates,
    selectedTemplate,
    bodyVars,
    urlVars,
    isAbandonedCart,
    previewHeader,
    previewFooter,
    previewButtons,
    bodyText,
    previewBodyContent,
    handleTemplateChange,
    handlePathChange,
    handleDelayChange,
    handleSave,
    handleCancel,
  } = useEditAutomationPage();

  if (loading || automationNotFound) {
    return <EditPageSkeleton />;
  }

  return (
    <div className="flex flex-col h-full">
      <EditTopbar
        automationName={automationName}
        saving={saving}
        onCancel={handleCancel}
        onSave={handleSave}
      />

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
          {/* Left: form */}
          <div className="overflow-y-auto space-y-4 pr-1 pb-4">
            <SectionCard label="Template (optional)">
              <TemplateSelector
                value={selectedTemplateId}
                templates={approvedTemplates}
                onChange={handleTemplateChange}
              />
            </SectionCard>

            <SectionCard label="Timing">
              {showTimingSelect ? (
                <div className="space-y-2">
                  <select
                    value={selectedDelay}
                    onChange={(e) => handleDelayChange(Number(e.target.value))}
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

            {selectedTemplate && (bodyVars.length > 0 || urlVars.length > 0) && (
              <SectionCard label="Parameter Mapping">
                <div className="space-y-3">
                  <p className="text-[12px] text-ink-400 mb-1">
                    Map each variable to a field from Shopify. Mapped fields appear highlighted in
                    the live preview.
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

          {/* Right: live preview */}
          <div className="sticky top-0 self-start pt-1">
            <p className="text-center mb-2.5 text-[11.5px] font-bold uppercase tracking-[0.06em] text-ink-500">
              Live Preview
            </p>
            <PhonePreview
              header={previewHeader || undefined}
              body={bodyText}
              bodyContent={previewBodyContent}
              footer={previewFooter || undefined}
              buttons={previewButtons.length > 0 ? previewButtons : undefined}
            />
            <p className="text-center mt-3 text-[11px] text-ink-400">
              {bodyVars.length > 0
                ? 'Mapped fields shown in [brackets]'
                : selectedTemplate
                  ? 'No variables in this template'
                  : 'Select a template to preview'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

