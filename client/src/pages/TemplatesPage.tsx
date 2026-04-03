import { useState } from 'react';
import { Plus, RefreshCw, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTemplates, type StatusFilter, type CreateTemplateInput } from '@/hooks/use-templates';
import { toast } from '@/hooks/use-toast';
import { TemplateCard } from '@/components/templates/TemplateCard';
import { TemplateCardSkeleton } from '@/components/templates/TemplateCardSkeleton';
import { NewTemplateDialog } from '@/components/templates/NewTemplateDialog';

// ── Tab count badge ──────────────────────────────────────────────────────────

function CountBadge({ count }: { count: number }) {
  return (
    <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-muted-foreground/20 px-1.5 py-0.5 text-xs font-medium tabular-nums">
      {count}
    </span>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function TemplatesPage() {
  const {
    templates,
    meta,
    loading,
    error,
    statusFilter,
    setStatusFilter,
    search,
    setSearch,
    createTemplate,
    removeTemplate,
    syncOne,
    syncAll,
    refetch,
  } = useTemplates();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);

  const counts = {
    all: meta.total,
    APPROVED: templates.filter((t) => t.status === 'APPROVED').length,
    PENDING: templates.filter((t) => t.status === 'PENDING').length,
    REJECTED: templates.filter((t) => t.status === 'REJECTED').length,
  };

  const handleSyncAll = async () => {
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
  };

  const handleCreate = async (input: CreateTemplateInput) => {
    try {
      await createTemplate(input);
      toast({ title: 'Template created', description: 'Awaiting Meta approval.' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Failed to create template' });
      throw err; // re-throw so the dialog's catch can set createError
    }
  };

  const handleSync = async (id: string) => {
    try {
      const updated = await syncOne(id);
      let description = `Status: ${updated.status}`;
      if (updated.status === 'REJECTED' && updated.rejectedReason) {
        description = `Rejected: ${updated.rejectedReason}`;
      }
      toast({ title: 'Template synced', description });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Sync failed',
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  };

  const handleDelete = async (id: string) => {
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
  };

  const tabValues: StatusFilter[] = ['all', 'APPROVED', 'PENDING', 'REJECTED'];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Templates</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your WhatsApp message templates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => void handleSyncAll()} disabled={syncingAll}>
            <RefreshCw className={`h-4 w-4 mr-2 ${syncingAll ? 'animate-spin' : ''}`} />
            Sync All
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <TabsList>
            {tabValues.map((tab) => (
              <TabsTrigger key={tab} value={tab}>
                {tab === 'all' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
                <CountBadge count={tab === 'all' ? meta.total : counts[tab]} />
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex-1 w-full sm:max-w-xs">
          <Input
            placeholder="Search templates…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={refetch}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <TemplateCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && templates.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          {search.trim() ? (
            <>
              <p className="text-base font-medium text-foreground">
                No templates match &ldquo;{search}&rdquo;
              </p>
              <p className="text-sm text-muted-foreground mt-1">Try a different search term.</p>
            </>
          ) : statusFilter === 'APPROVED' ? (
            <>
              <p className="text-base font-medium text-foreground">No approved templates</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Create a template and wait for Meta&apos;s approval.
              </p>
            </>
          ) : (
            <>
              <p className="text-base font-medium text-foreground">No templates yet</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Create your first WhatsApp template to get started.
              </p>
              <Button className="mt-4" onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </>
          )}
        </div>
      )}

      {/* Template grid */}
      {!loading && !error && templates.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              id={template.id}
              name={template.name}
              category={template.category}
              language={template.language}
              status={template.status}
              components={template.components}
              rejectedReason={template.rejectedReason}
              createdAt={template.createdAt}
              onSync={handleSync}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* New Template Dialog */}
      <NewTemplateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreate}
      />
    </div>
  );
}
