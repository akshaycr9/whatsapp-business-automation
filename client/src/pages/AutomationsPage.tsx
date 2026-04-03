import { useState, useCallback } from 'react';
import {
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  ScrollText,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAutomations, type CreateAutomationInput } from '@/hooks/use-automations';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getEventConfig } from '@/lib/automation-utils';
import { EventCards } from '@/components/automations/EventCards';
import { AutomationFormDialog } from '@/components/automations/AutomationFormDialog';
import { LogsDialog } from '@/components/automations/LogsDialog';
import { DeleteDialog } from '@/components/automations/DeleteDialog';
import { ToggleSwitch } from '@/components/automations/ToggleSwitch';
import type { Automation } from '@/types';

// ── Main page ──────────────────────────────────────────────────────────────────

export default function AutomationsPage() {
  const {
    automations,
    approvedTemplates,
    loading,
    error,
    createAutomation,
    updateAutomation,
    removeAutomation,
    toggleAutomation,
    fetchLogs,
    refetch,
  } = useAutomations();

  const { toast } = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Automation | null>(null);
  const [logsTarget, setLogsTarget] = useState<Automation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Automation | null>(null);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  const handleCreate = useCallback(async (input: CreateAutomationInput): Promise<void> => {
    await createAutomation(input);
    toast({ title: 'Automation created', description: input.name });
  }, [createAutomation, toast]);

  const handleUpdate = useCallback(async (input: CreateAutomationInput): Promise<void> => {
    if (!editTarget) throw new Error('No automation selected');
    await updateAutomation(editTarget.id, input);
    toast({ title: 'Automation updated', description: input.name });
  }, [editTarget, updateAutomation, toast]);

  const handleDelete = useCallback(async (): Promise<void> => {
    if (!deleteTarget) return;
    await removeAutomation(deleteTarget.id);
    setDeleteTarget(null);
    toast({ title: 'Automation deleted' });
  }, [deleteTarget, removeAutomation, toast]);

  const handleToggle = useCallback(async (automation: Automation) => {
    if (togglingIds.has(automation.id)) return;
    setTogglingIds((prev) => new Set(prev).add(automation.id));
    try {
      await toggleAutomation(automation.id);
    } catch {
      toast({
        variant: 'destructive',
        title: 'Toggle failed',
        description: 'Could not update automation status.',
      });
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(automation.id);
        return next;
      });
    }
  }, [togglingIds, toggleAutomation, toast]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Automations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Automate WhatsApp messages for Shopify events
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Automation
        </Button>
      </div>

      {/* Event Overview Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <EventCards automations={automations} />
      )}

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

      {/* Automations table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-base font-medium text-foreground">All Automations</h2>
        </div>

        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded" />
            ))}
          </div>
        ) : automations.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <ScrollText className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">No automations yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first automation to start sending WhatsApp messages on Shopify events.
            </p>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Automation
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Delay</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {automations.map((automation) => {
                const cfg = getEventConfig(automation.triggerType, automation.shopifyEvent ?? null);
                return (
                  <TableRow key={automation.id}>
                    <TableCell className="font-medium text-sm">{automation.name}</TableCell>
                    <TableCell>
                      <Badge className={cn('text-xs font-medium border-0', cfg.badgeClass)}>
                        {cfg.label}
                      </Badge>
                      {automation.triggerType === 'BUTTON_REPLY' && automation.buttonTriggerText && (
                        <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                          &ldquo;{automation.buttonTriggerText}&rdquo;
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {automation.template.name}
                    </TableCell>
                    <TableCell>
                      <ToggleSwitch
                        checked={automation.isActive}
                        onToggle={() => void handleToggle(automation)}
                        disabled={togglingIds.has(automation.id)}
                      />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {automation.delayMinutes === 0
                        ? 'Immediately'
                        : `${automation.delayMinutes} min delay`}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditTarget(automation)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setLogsTarget(automation)}>
                            <ScrollText className="h-4 w-4 mr-2" />
                            View Logs
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteTarget(automation)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Create Dialog */}
      <AutomationFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        approvedTemplates={approvedTemplates}
        mode="create"
      />

      {/* Edit Dialog */}
      <AutomationFormDialog
        open={editTarget !== null}
        onOpenChange={(open) => { if (!open) setEditTarget(null); }}
        onSubmit={handleUpdate}
        initialValues={editTarget ? {
          name: editTarget.name,
          triggerType: editTarget.triggerType,
          shopifyEvent: editTarget.shopifyEvent ?? undefined,
          buttonTriggerText: editTarget.buttonTriggerText ?? undefined,
          templateId: editTarget.templateId,
          delayMinutes: editTarget.delayMinutes,
          isActive: editTarget.isActive,
          variableMapping: editTarget.variableMapping as Record<string, string>,
        } : undefined}
        approvedTemplates={approvedTemplates}
        mode="edit"
      />

      {/* Logs Dialog */}
      <LogsDialog
        open={logsTarget !== null}
        onOpenChange={(open) => { if (!open) setLogsTarget(null); }}
        automationId={logsTarget?.id ?? null}
        automationName={logsTarget?.name ?? ''}
        fetchLogs={fetchLogs}
      />

      {/* Delete Dialog */}
      <DeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete Automation"
        description={`Are you sure you want to delete "${deleteTarget?.name ?? ''}"? This will also delete all associated logs. This action cannot be undone.`}
        onConfirm={handleDelete}
      />

      {/* Spinner for toggling (screen-reader only) */}
      {togglingIds.size > 0 && (
        <span className="sr-only" aria-live="polite">
          <Loader2 className="animate-spin" />
          Updating automation status…
        </span>
      )}
    </div>
  );
}
