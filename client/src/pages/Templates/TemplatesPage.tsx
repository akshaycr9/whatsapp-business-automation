import { useTemplates } from "@/hooks/templates/use-templates";
import { useTemplatesPage } from "@/hooks/templates/use-templates-page";
import { TemplateTable } from "@/components/templates/TemplateTable";
import { TemplateTableSkeleton } from "@/components/templates/TemplateCardSkeleton";
import { TemplatePreviewModal } from "@/components/templates/TemplatePreviewModal";
import { TemplatesTopbar } from "@/components/templates/TemplatesTopbar";
import { TemplateTabs } from "@/components/templates/TemplateTabs";
import { TemplateFilterBar } from "@/components/templates/TemplateFilterBar";
import { TemplateErrorAlert } from "@/components/templates/TemplateErrorAlert";
import { TemplateEmptyState } from "@/components/templates/TemplateEmptyState";

export default function TemplatesPage() {
  const {
    templates,
    meta,
    loading,
    error,
    statusFilter,
    setStatusFilter,
    statusCounts,
    refetch,
  } = useTemplates();

  const {
    setPreviewId,
    syncingAll,
    syncingIds,
    catFilter,
    setCatFilter,
    filtered,
    previewTemplate,
    handleSyncAll,
    handleSync,
    handleDelete,
    openEditor,
    navigateToNew,
  } = useTemplatesPage(templates, statusCounts);

  return (
    <div className="flex flex-col h-full">
      <TemplatesTopbar
        pageName="Templates"
        totalCount={meta.total}
        isLoading={loading}
        isSyncingAll={syncingAll}
        onSync={() => void handleSyncAll()}
        onCreateNew={navigateToNew}
      />

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col px-5 md:px-7 pt-5 pb-8">
        <TemplateTabs
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          statusCounts={statusCounts}
        />

        <TemplateFilterBar
          templateCount={filtered.length}
          categoryFilter={catFilter}
          onCategoryFilterChange={setCatFilter}
        />

        {error && <TemplateErrorAlert error={error} onRetry={refetch} />}

        {/* Table area */}
        <div className="flex-1 overflow-auto bg-card border border-border rounded-lg">
          {loading ? (
            <TemplateTableSkeleton />
          ) : !error && filtered.length === 0 ? (
            <TemplateEmptyState
              statusFilter={statusFilter}
              onCreateNew={navigateToNew}
            />
          ) : (
            <TemplateTable
              templates={filtered}
              syncingIds={syncingIds}
              onPreview={setPreviewId}
              onEdit={openEditor}
              onSync={(id) => void handleSync(id)}
              onDelete={(id) => void handleDelete(id)}
              onDuplicate={() => {}}
            />
          )}
        </div>
      </div>

      {/* Preview modal */}
      {previewTemplate && (
        <TemplatePreviewModal
          template={previewTemplate}
          onClose={() => setPreviewId(null)}
          onEdit={() => openEditor(previewTemplate.id)}
        />
      )}
    </div>
  );
}
