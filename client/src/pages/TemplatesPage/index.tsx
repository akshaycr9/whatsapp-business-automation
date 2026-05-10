import { useTemplatesPage } from "@/hooks/useTemplatesPage";
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
    meta,
    loading,
    error,
    statusFilter,
    setStatusFilter,
    statusCounts,
    catFilter,
    setCatFilter,
    filtered,
    previewTemplate,
    syncingAll,
    syncingIds,
    setPreviewId,
    handleSyncAll,
    handleSync,
    handleDelete,
    handleDuplicate,
    handleClosePreview,
    handleEditPreview,
    openEditor,
    navigateToNew,
    refetch,
  } = useTemplatesPage();

  return (
    <div className="flex flex-col h-full">
      <TemplatesTopbar
        pageName="Templates"
        totalCount={meta.total}
        isLoading={loading}
        isSyncingAll={syncingAll}
        onSync={handleSyncAll}
        onCreateNew={navigateToNew}
      />

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
              onSync={handleSync}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
            />
          )}
        </div>
      </div>

      {previewTemplate && (
        <TemplatePreviewModal
          template={previewTemplate}
          onClose={handleClosePreview}
          onEdit={handleEditPreview}
        />
      )}
    </div>
  );
}
