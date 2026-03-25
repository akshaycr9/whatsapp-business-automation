import { useState, useRef } from 'react';
import {
  Plus,
  RefreshCw,
  Trash2,
  RotateCcw,
  FileText,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTemplates, type StatusFilter, type CreateTemplateInput, type TemplateComponentInput } from '@/hooks/use-templates';
import { toast } from '@/hooks/use-toast';
import type { Template, TemplateStatus } from '@/types';

// ── Status badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: TemplateStatus }) {
  if (status === 'APPROVED') {
    return (
      <Badge className="border-transparent bg-green-100 text-green-800 hover:bg-green-100">
        APPROVED
      </Badge>
    );
  }
  if (status === 'REJECTED') {
    return (
      <Badge variant="destructive">REJECTED</Badge>
    );
  }
  return (
    <Badge className="border-transparent bg-amber-100 text-amber-800 hover:bg-amber-100">
      PENDING
    </Badge>
  );
}

// ── Variable detection ───────────────────────────────────────────────────────

function extractVariables(text: string): string[] {
  const matches = text.match(/\{\{\d+\}\}/g);
  if (!matches) return [];
  return [...new Set(matches)].sort();
}

// ── Component preview text ───────────────────────────────────────────────────

function getBodyText(components: unknown): string {
  if (!Array.isArray(components)) return '';
  for (const c of components as Array<{ type?: string; text?: string }>) {
    if (c.type === 'BODY' && c.text) return c.text;
  }
  // fallback: first text from any component
  for (const c of components as Array<{ type?: string; text?: string }>) {
    if (c.text) return c.text;
  }
  return '';
}

// ── Template card ────────────────────────────────────────────────────────────

interface TemplateCardProps {
  template: Template;
  onSync: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function TemplateCard({ template, onSync, onDelete }: TemplateCardProps) {
  const [syncing, setSyncing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const bodyText = getBodyText(template.components);
  const variables = extractVariables(bodyText);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await onSync(template.id);
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(template.id);
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm flex flex-col">
      {/* Card header */}
      <div className="p-4 pb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-sm font-semibold text-foreground truncate">{template.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{template.language}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <StatusBadge status={template.status} />
          <Badge variant="outline" className="text-xs">{template.category}</Badge>
        </div>
      </div>

      {/* Body preview */}
      <div className="px-4 flex-1">
        {bodyText ? (
          <p className="text-sm text-muted-foreground line-clamp-3">{bodyText}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">No body text</p>
        )}
        {variables.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {variables.map((v) => (
              <span
                key={v}
                className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground"
              >
                {v}
              </span>
            ))}
          </div>
        )}
        {template.status === 'REJECTED' && template.rejectedReason && (
          <p className="mt-2 text-xs text-destructive">{template.rejectedReason}</p>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 pt-3 flex items-center justify-between mt-auto">
        <p className="text-xs text-muted-foreground">
          {new Date(template.createdAt).toLocaleDateString()}
        </p>
        <div className="flex items-center gap-1">
          {!confirmDelete ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void handleSync()}
                disabled={syncing}
                title="Sync status from Meta"
              >
                <RotateCcw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDelete(true)}
                title="Delete template"
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-1 text-xs">
              <span className="text-muted-foreground">Also deletes from Meta.</span>
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => void handleDelete()}
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : 'Confirm Delete'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Skeleton cards ───────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-4 w-36" />
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-14" />
        </div>
      </div>
      <Skeleton className="h-3 w-12" />
      <Skeleton className="h-12 w-full" />
      <div className="flex justify-between">
        <Skeleton className="h-3 w-20" />
        <div className="flex gap-1">
          <Skeleton className="h-7 w-7" />
          <Skeleton className="h-7 w-7" />
        </div>
      </div>
    </div>
  );
}

// ── WhatsApp preview bubble ──────────────────────────────────────────────────

interface PreviewBubbleProps {
  header?: string;
  body: string;
  footer?: string;
}

function PreviewBubble({ header, body, footer }: PreviewBubbleProps) {
  if (!body && !header) return null;
  return (
    <div className="mt-4 p-3 bg-muted rounded-lg">
      <p className="text-xs text-muted-foreground mb-2 font-medium">Preview</p>
      <div className="bg-green-100 rounded-lg p-3 max-w-xs shadow-sm">
        {header && <p className="text-xs font-semibold text-foreground mb-1">{header}</p>}
        {body && <p className="text-sm text-foreground whitespace-pre-wrap">{body}</p>}
        {footer && <p className="text-xs text-muted-foreground mt-1">{footer}</p>}
      </div>
    </div>
  );
}

// ── New Template Dialog ──────────────────────────────────────────────────────

interface NewTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateTemplateInput) => Promise<void>;
}

function NewTemplateDialog({ open, onOpenChange, onSubmit }: NewTemplateDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('');
  const [category, setCategory] = useState('');

  // Step 2
  const [headerEnabled, setHeaderEnabled] = useState(false);
  const [headerText, setHeaderText] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [footerEnabled, setFooterEnabled] = useState(false);
  const [footerText, setFooterText] = useState('');

  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const resetForm = () => {
    setStep(1);
    setName('');
    setLanguage('');
    setCategory('');
    setHeaderEnabled(false);
    setHeaderText('');
    setBodyText('');
    setFooterEnabled(false);
    setFooterText('');
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) resetForm();
    onOpenChange(val);
  };

  const insertVariable = () => {
    const existing = extractVariables(bodyText);
    const nextNum = existing.length + 1;
    const variable = `{{${nextNum}}}`;
    if (bodyRef.current) {
      const start = bodyRef.current.selectionStart ?? bodyText.length;
      const end = bodyRef.current.selectionEnd ?? bodyText.length;
      const newText = bodyText.slice(0, start) + variable + bodyText.slice(end);
      setBodyText(newText);
      setTimeout(() => {
        if (bodyRef.current) {
          const pos = start + variable.length;
          bodyRef.current.setSelectionRange(pos, pos);
          bodyRef.current.focus();
        }
      }, 0);
    } else {
      setBodyText((prev) => prev + variable);
    }
  };

  const step1Valid =
    name.trim() !== '' &&
    /^[a-z_]+$/.test(name) &&
    language !== '' &&
    category !== '';

  const step2Valid = bodyText.trim() !== '';

  const handleSubmit = async () => {
    const components: TemplateComponentInput[] = [];

    if (headerEnabled && headerText.trim()) {
      components.push({ type: 'HEADER', format: 'TEXT', text: headerText.trim() });
    }
    components.push({ type: 'BODY', text: bodyText.trim() });
    if (footerEnabled && footerText.trim()) {
      components.push({ type: 'FOOTER', text: footerText.trim() });
    }

    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        language,
        category: category as 'MARKETING' | 'UTILITY' | 'AUTHENTICATION',
        components,
      });
      handleOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? 'New Template — Basic Info' : 'New Template — Components'}
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="tpl-name">Template Name</Label>
              <Input
                id="tpl-name"
                placeholder="e.g. order_confirmed"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Lowercase letters and underscores only, e.g. <span className="font-mono">order_confirmed</span>
              </p>
              {name && !/^[a-z_]+$/.test(name) && (
                <p className="text-xs text-destructive">Only lowercase letters and underscores allowed</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tpl-language">Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger id="tpl-language">
                  <SelectValue placeholder="Select language…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English (en)</SelectItem>
                  <SelectItem value="en_US">English US (en_US)</SelectItem>
                  <SelectItem value="hi">Hindi (hi)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tpl-category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="tpl-category">
                  <SelectValue placeholder="Select category…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTILITY">Utility</SelectItem>
                  <SelectItem value="MARKETING">Marketing</SelectItem>
                  <SelectItem value="AUTHENTICATION">Authentication</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            {/* Header toggle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Header (optional)</Label>
                <button
                  type="button"
                  onClick={() => setHeaderEnabled((v) => !v)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${headerEnabled ? 'bg-primary' : 'bg-muted'}`}
                  role="switch"
                  aria-checked={headerEnabled}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-background shadow transition-transform ${headerEnabled ? 'translate-x-4' : 'translate-x-0.5'}`}
                  />
                </button>
              </div>
              {headerEnabled && (
                <Input
                  placeholder="Header text"
                  value={headerText}
                  onChange={(e) => setHeaderText(e.target.value)}
                />
              )}
            </div>

            {/* Body */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="tpl-body">
                  Body <span className="text-destructive">*</span>
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={insertVariable}
                  className="h-7 text-xs gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Insert Variable
                </Button>
              </div>
              <Textarea
                id="tpl-body"
                ref={bodyRef}
                placeholder="Hello {{1}}, your order {{2}} has been confirmed."
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                className="min-h-[100px]"
              />
              <div className="flex items-start gap-1.5 rounded-md border border-dashed p-2 text-xs text-muted-foreground">
                <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                <span>
                  Use <span className="font-mono">{'{{1}}'}</span>, <span className="font-mono">{'{{2}}'}</span> for positional variables mapped to Shopify data in automations.
                </span>
              </div>
            </div>

            {/* Footer toggle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Footer (optional)</Label>
                <button
                  type="button"
                  onClick={() => setFooterEnabled((v) => !v)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${footerEnabled ? 'bg-primary' : 'bg-muted'}`}
                  role="switch"
                  aria-checked={footerEnabled}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-background shadow transition-transform ${footerEnabled ? 'translate-x-4' : 'translate-x-0.5'}`}
                  />
                </button>
              </div>
              {footerEnabled && (
                <Input
                  placeholder="Footer text"
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                />
              )}
            </div>

            {/* Preview */}
            <PreviewBubble
              header={headerEnabled ? headerText : undefined}
              body={bodyText}
              footer={footerEnabled ? footerText : undefined}
            />
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === 1 ? (
            <Button onClick={() => setStep(2)} disabled={!step1Valid}>
              Next →
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep(1)}>
                ← Back
              </Button>
              <Button onClick={() => void handleSubmit()} disabled={!step2Valid || submitting}>
                {submitting ? 'Creating…' : 'Create Template'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Tab counts ───────────────────────────────────────────────────────────────

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
      toast({
        variant: 'destructive',
        title: 'Failed to create template',
        description: err instanceof Error ? err.message : 'Unknown error',
      });
      throw err;
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
        <Tabs
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        >
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
            <SkeletonCard key={i} />
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
              <p className="text-base font-medium text-foreground">No templates match &ldquo;{search}&rdquo;</p>
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
              template={template}
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
