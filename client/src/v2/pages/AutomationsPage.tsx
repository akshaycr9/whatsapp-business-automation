import { useState, useCallback } from 'react';
import { Bell, HelpCircle, AlertCircle } from 'lucide-react';
import { FlowCategorySidebar } from '@/v2/components/automations/FlowCategorySidebar';
import { FlowTable } from '@/v2/components/automations/FlowTable';
import { ConfigureFlowModal } from '@/v2/components/automations/ConfigureFlowModal';
import { useV2Automations } from '@/v2/hooks/use-v2-automations';
import type { V2Flow } from '@/v2/types';

/**
 * V2 AutomationsPage — desktop dual-sidebar layout.
 *
 * Layout: [FlowCategorySidebar (w-60)] | [Main content: header + FlowTable]
 *
 * Data flows through useV2Automations() → Redux v2Automations slice → API.
 */
export default function V2AutomationsPage(): React.ReactElement {
  const { flowCategories, approvedTemplates, loading, error, toggle, updateFlow } =
    useV2Automations();

  const [activeCategoryId, setActiveCategoryId] = useState<string>('order-flow');
  const [editingFlow, setEditingFlow] = useState<V2Flow | null>(null);

  const activeCategory =
    flowCategories.find((c) => c.id === activeCategoryId) ?? flowCategories[0];

  const handleToggle = useCallback(
    (flowId: string) => {
      toggle(flowId);
    },
    [toggle],
  );

  const handleSave = useCallback(
    async (flowId: string, templateId: string, variableMapping: Record<string, string>, delayMinutes?: number) => {
      await updateFlow(flowId, templateId, variableMapping, delayMinutes);
    },
    [updateFlow],
  );

  const handleEdit = useCallback((flow: V2Flow) => {
    setEditingFlow(flow);
  }, []);

  const handleCloseModal = useCallback(() => {
    setEditingFlow(null);
  }, []);

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* Secondary sidebar — flow categories */}
      <FlowCategorySidebar
        categories={flowCategories}
        activeId={activeCategoryId}
        onSelect={setActiveCategoryId}
      />

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-stitch-surface">
        {/* Top header bar */}
        <header className="h-16 flex justify-between items-center px-8 sticky top-0 bg-stitch-surface/80 backdrop-blur-md z-10 flex-shrink-0">
          <span className="text-sm text-stitch-on-surface-variant font-medium">
            Automations / {activeCategory?.label ?? '…'}
          </span>
          <div className="flex items-center gap-2">
            <button
              className="p-2 text-stitch-on-surface-variant hover:text-stitch-primary-container transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
            </button>
            <button
              className="p-2 text-stitch-on-surface-variant hover:text-stitch-primary-container transition-colors"
              aria-label="Help"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <div className="p-8 flex-1">
          {/* Error state */}
          {error && (
            <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Failed to load automations</p>
                <p className="mt-0.5 text-red-600">{error}</p>
              </div>
            </div>
          )}

          {/* Page title + description */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-stitch-on-surface">
              {activeCategory?.pageTitle ?? 'Automations'}
            </h1>
            <p className="text-stitch-on-surface-variant mt-1 text-sm">
              {activeCategory?.description ?? ''}
            </p>
          </div>

          {/* Flow table — skeleton shown when loading */}
          <FlowTable
            flows={activeCategory?.flows ?? []}
            loading={loading}
            onToggle={handleToggle}
            onEdit={handleEdit}
          />
        </div>
      </main>

      {/* Configure flow modal */}
      {editingFlow && (
        <ConfigureFlowModal
          flow={editingFlow}
          approvedTemplates={approvedTemplates}
          onClose={handleCloseModal}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
