import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw, FileText, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTemplates, type StatusFilter } from '@/hooks/use-templates';
import { toast } from '@/hooks/use-toast';
import { TemplateTable } from '@/components/templates/TemplateTable';
import { TemplateTableSkeleton } from '@/components/templates/TemplateCardSkeleton';
import { TemplatePreviewModal } from '@/components/templates/TemplatePreviewModal';

const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'PENDING', label: 'Pending' },
  { id: 'REJECTED', label: 'Rejected' },
];

const CATEGORIES = ['all', 'MARKETING', 'UTILITY', 'AUTHENTICATION'] as const;

export default function TemplatesPage() {
  const navigate = useNavigate();
  const {
    templates,
    meta,
    loading,
    error,
    statusFilter,
    setStatusFilter,
    statusCounts,
    removeTemplate,
    syncOne,
    syncAll,
    refetch,
  } = useTemplates();

  const [previewId, setPreviewId] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());
  const [catFilter, setCatFilter] = useState<string>('all');

  const tabCounts = useMemo(
    () => ({
      all: statusCounts.all,
      APPROVED: statusCounts.APPROVED,
      PENDING: statusCounts.PENDING,
      REJECTED: statusCounts.REJECTED,
    }),
    [statusCounts],
  );

  const filtered = useMemo(
    () =>
      catFilter === 'all' ? templates : templates.filter((t) => t.category === catFilter),
    [templates, catFilter],
  );

  const previewTemplate = useMemo(
    () => (previewId ? templates.find((t) => t.id === previewId) ?? null : null),
    [previewId, templates],
  );

  const handleSyncAll = useCallback(async () => {
    setSyncingAll(true);
    try {
      const result = await syncAll();
      toast({ title: `Synced ${result.synced} template${result.synced !== 1 ? 's' : ''}` });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Sync failed',
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setSyncingAll(false);
    }
  }, [syncAll]);

  const handleSync = useCallback(
    async (id: string) => {
      setSyncingIds((prev) => new Set(prev).add(id));
      try {
        const updated = await syncOne(id);
        toast({
          title: 'Template synced',
          description:
            updated.status === 'REJECTED' && updated.rejectedReason
              ? `Rejected: ${updated.rejectedReason}`
              : `Status: ${updated.status}`,
        });
      } catch (err) {
        toast({
          variant: 'destructive',
          title: 'Sync failed',
          description: err instanceof Error ? err.message : 'Unknown error',
        });
      } finally {
        setSyncingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [syncOne],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await removeTemplate(id);
        toast({ title: 'Template deleted' });
      } catch (err) {
        toast({
          variant: 'destructive',
          title: 'Failed to delete template',
          description: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    },
    [removeTemplate],
  );

  const openEditor = useCallback((id: string) => {
    setPreviewId(null);
    navigate(`/templates/${id}/edit`);
  }, [navigate]);


  return (
    <div className="flex flex-col h-full">
      {/* Topbar */}
      <div
        className="flex items-center gap-4 px-5 border-b border-border bg-card flex-shrink-0"
        style={{ height: 56 }}
      >
        <div className="flex items-center">
          <span className="text-[16px] font-[650] tracking-tight" style={{ color: '#1b2420' }}>
            Templates
          </span>
          {!loading && (
            <span
              className="ml-3 pl-3 border-l border-border text-[12.5px]"
              style={{ color: '#6b7671' }}
            >
              {meta.total} template{meta.total !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex-1" />
        <button
          className="inline-flex items-center gap-1.5 px-3 py-[7px] rounded-[8px] border border-border bg-card text-[13px] font-semibold transition-colors hover:bg-[#eff1ed] disabled:opacity-60 disabled:pointer-events-none"
          style={{ color: '#1b2420' }}
          onClick={() => void handleSyncAll()}
          disabled={syncingAll}
        >
          <RefreshCw className={`h-[14px] w-[14px] ${syncingAll ? 'animate-spin' : ''}`} />
          Sync All
        </button>
        <button
          className="inline-flex items-center gap-1.5 px-3 py-[7px] rounded-[8px] text-[13px] font-semibold transition-colors"
          style={{ background: '#107a6d', color: '#fff', border: '1px solid #0b5d54' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#0b5d54')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#107a6d')}
          onClick={() => navigate('/templates/new')}
        >
          <Plus className="h-[14px] w-[14px]" />
          New Template
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col px-5 md:px-7 pt-5 pb-8">
        {/* Status tabs */}
        <div className="flex items-center justify-between pb-3 border-b border-border flex-shrink-0">
          <div className="flex gap-0.5">
            {STATUS_TABS.map((tab) => {
              const count = tab.id === 'all' ? tabCounts.all : tabCounts[tab.id];
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  className="inline-flex items-center gap-1.5 px-3.5 py-[7px] rounded-[8px] border-none text-[13px] font-semibold transition-all cursor-pointer"
                  style={
                    active
                      ? { background: '#e7f5f1', color: '#0b5d54' }
                      : { background: 'transparent', color: '#6b7671' }
                  }
                  onMouseEnter={(e) => {
                    if (!active) (e.currentTarget as HTMLButtonElement).style.background = '#eff1ed';
                  }}
                  onMouseLeave={(e) => {
                    if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  }}
                  onClick={() => setStatusFilter(tab.id)}
                >
                  {tab.label}
                  <span
                    className="text-[11px] font-bold px-[7px] py-0.5 rounded-full min-w-[18px] text-center"
                    style={
                      active
                        ? { background: '#c6ebe2', color: '#0b5d54' }
                        : { background: '#eff1ed', color: '#6b7671' }
                    }
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center justify-between py-2.5 flex-shrink-0">
          <div className="text-[13px]" style={{ color: '#6b7671' }}>
            {filtered.length} template{filtered.length !== 1 ? 's' : ''}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[12px] font-semibold" style={{ color: '#6b7671' }}>
              Category:
            </label>
            <select
              className="px-2.5 py-1 border border-border rounded-[8px] bg-card text-[12px] outline-none"
              style={{ color: '#1b2420' }}
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c === 'all' ? 'All' : c.charAt(0) + c.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <button className="ml-4 text-[12px] underline underline-offset-2" onClick={refetch}>
                Try again
              </button>
            </AlertDescription>
          </Alert>
        )}

        {/* Table area */}
        <div className="flex-1 overflow-auto bg-card border border-border rounded-[14px]">
          {loading ? (
            <TemplateTableSkeleton />
          ) : !error && filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ background: '#eff1ed' }}
              >
                <FileText className="h-8 w-8" style={{ color: '#8a948f' }} />
              </div>
              <p className="text-[14px] font-semibold" style={{ color: '#1b2420' }}>
                {statusFilter !== 'all' ? `No ${statusFilter.toLowerCase()} templates` : 'No templates yet'}
              </p>
              <p className="text-[13px] mt-1 max-w-sm" style={{ color: '#6b7671' }}>
                {statusFilter === 'all'
                  ? 'Create your first WhatsApp template to get started.'
                  : 'Try a different filter or create a new template.'}
              </p>
              {statusFilter === 'all' && (
                <button
                  className="inline-flex items-center gap-1.5 mt-4 px-3 py-[7px] rounded-[8px] text-[13px] font-semibold"
                  style={{ background: '#107a6d', color: '#fff', border: '1px solid #0b5d54' }}
                  onClick={() => navigate('/templates/new')}
                >
                  <Plus className="h-[14px] w-[14px]" />
                  New Template
                </button>
              )}
            </div>
          ) : (
            <TemplateTable
              templates={filtered}
              syncingIds={syncingIds}
              onPreview={setPreviewId}
              onEdit={openEditor}
              onSync={(id) => void handleSync(id)}
              onDelete={(id) => void handleDelete(id)}
              onDuplicate={() => toast({ title: 'Duplicate coming soon' })}
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
