import { useState, useCallback } from 'react';
import { Bell, HelpCircle } from 'lucide-react';
import { FlowCategorySidebar } from '@/v2/components/automations/FlowCategorySidebar';
import { FlowTable } from '@/v2/components/automations/FlowTable';
import { ConfigureFlowModal } from '@/v2/components/automations/ConfigureFlowModal';
import { FLOW_CATEGORIES } from '@/v2/lib/v2-mock-data';
import type { V2Flow, V2FlowCategory } from '@/v2/lib/v2-mock-data';

/**
 * V2 AutomationsPage — desktop dual-sidebar layout.
 *
 * Layout: [FlowCategorySidebar (w-60)] | [Main content: header + FlowTable]
 *
 * Hard-coded data phase: all state is local, no Redux/API calls.
 * Functionality wiring will be added in a future iteration.
 */
export default function V2AutomationsPage(): React.ReactElement {
  const [categories, setCategories] = useState<V2FlowCategory[]>(FLOW_CATEGORIES);
  const [activeCategoryId, setActiveCategoryId] = useState<string>(FLOW_CATEGORIES[0].id);
  const [editingFlow, setEditingFlow] = useState<V2Flow | null>(null);

  const activeCategory = categories.find((c) => c.id === activeCategoryId) ?? categories[0];

  const handleToggle = useCallback((flowId: string, next: boolean) => {
    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        flows: cat.flows.map((f) => (f.id === flowId ? { ...f, active: next } : f)),
      })),
    );
  }, []);

  const handleSave = useCallback((updated: V2Flow) => {
    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        flows: cat.flows.map((f) => (f.id === updated.id ? updated : f)),
      })),
    );
  }, []);

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
        categories={categories}
        activeId={activeCategoryId}
        onSelect={setActiveCategoryId}
      />

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-stitch-surface">
        {/* Top header bar */}
        <header className="h-16 flex justify-between items-center px-8 sticky top-0 bg-stitch-surface/80 backdrop-blur-md z-10 flex-shrink-0">
          <span className="text-sm text-stitch-on-surface-variant font-medium">
            Automations / {activeCategory.label}
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
          {/* Page title + description */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-stitch-on-surface">
              {activeCategory.pageTitle}
            </h1>
            <p className="text-stitch-on-surface-variant mt-1 text-sm">
              {activeCategory.description}
            </p>
          </div>

          {/* Flow table */}
          <FlowTable
            flows={activeCategory.flows}
            onToggle={handleToggle}
            onEdit={handleEdit}
          />
        </div>
      </main>

      {/* Configure flow modal (portal-like, rendered at page level) */}
      {editingFlow && (
        <ConfigureFlowModal
          flow={editingFlow}
          onClose={handleCloseModal}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
