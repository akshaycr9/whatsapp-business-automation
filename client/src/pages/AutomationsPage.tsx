import { useState, useCallback } from 'react';
import {
  Plus,
  CreditCard,
  Banknote,
  Package,
  ShoppingCart,
  MessageSquare,
  MoreVertical,
  Pencil,
  Trash2,
  ScrollText,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import type { Automation, AutomationLog, ShopifyEvent, Template } from '@/types';
import { cn } from '@/lib/utils';

// ── Constants ──────────────────────────────────────────────────────────────

type ShopifyEventKey = ShopifyEvent;

interface EventConfig {
  label: string;
  icon: React.ReactNode;
  badgeClass: string;
}

const EVENT_CONFIG: Record<ShopifyEventKey, EventConfig> = {
  PREPAID_ORDER_CONFIRMED: {
    label: 'Prepaid Order Confirmed',
    icon: <CreditCard className="h-4 w-4" />,
    badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  COD_ORDER_CONFIRMED: {
    label: 'COD Order Confirmed',
    icon: <Banknote className="h-4 w-4" />,
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
  ORDER_FULFILLED: {
    label: 'Order Fulfilled',
    icon: <Package className="h-4 w-4" />,
    badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  },
  ABANDONED_CART: {
    label: 'Abandoned Cart',
    icon: <ShoppingCart className="h-4 w-4" />,
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  },
};

const EVENT_ICON_BG: Record<ShopifyEventKey, string> = {
  PREPAID_ORDER_CONFIRMED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  COD_ORDER_CONFIRMED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ORDER_FULFILLED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  ABANDONED_CART: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

const SHOPIFY_EVENTS = Object.keys(EVENT_CONFIG) as ShopifyEventKey[];

const BUTTON_REPLY_CONFIG: EventConfig = {
  label: 'Button Reply',
  icon: <MessageSquare className="h-4 w-4" />,
  badgeClass: 'bg-slate-100 text-slate-800 dark:bg-slate-800/40 dark:text-slate-300',
};

function getEventConfig(automation: Automation): EventConfig {
  if (automation.triggerType === 'BUTTON_REPLY' || !automation.shopifyEvent) {
    return BUTTON_REPLY_CONFIG;
  }
  return EVENT_CONFIG[automation.shopifyEvent] ?? BUTTON_REPLY_CONFIG;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function extractBodyText(components: unknown): string {
  if (!Array.isArray(components)) return '';
  const body = (components as Array<{ type: string; text?: string }>).find(
    (c) => c.type === 'BODY',
  );
  return body?.text ?? '';
}

function detectVariables(text: string): string[] {
  const matches = text.match(/\{\{(\d+)\}\}/g) ?? [];
  const positions = [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, '')))];
  return positions.sort((a, b) => Number(a) - Number(b));
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── Toggle Switch ──────────────────────────────────────────────────────────

interface ToggleSwitchProps {
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

function ToggleSwitch({ checked, onToggle, disabled = false }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-primary' : 'bg-input',
      )}
    >
      <span
        className={cn(
          'pointer-events-none block h-4 w-4 rounded-full bg-background shadow-sm transition-transform duration-200',
          checked ? 'translate-x-4' : 'translate-x-0.5',
        )}
      />
    </button>
  );
}

// ── Event Overview Cards ───────────────────────────────────────────────────

interface EventCardsProps {
  automations: Automation[];
}

function EventCards({ automations }: EventCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {SHOPIFY_EVENTS.map((event) => {
        const cfg = EVENT_CONFIG[event];
        const activeCount = automations.filter(
          (a) => a.shopifyEvent === event && a.isActive,
        ).length;
        const hasActive = activeCount > 0;

        return (
          <div key={event} className="bg-card border border-border rounded-xl p-4">
            <div
              className={cn(
                'h-8 w-8 rounded-lg flex items-center justify-center mb-3',
                EVENT_ICON_BG[event],
              )}
            >
              {cfg.icon}
            </div>
            <p className="text-sm font-medium text-foreground">{cfg.label}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className={cn(
                  'inline-block h-2 w-2 rounded-full',
                  hasActive ? 'bg-green-500' : 'bg-muted-foreground/40',
                )}
              />
              <p className="text-xs text-muted-foreground">
                {activeCount === 0
                  ? 'No active automations'
                  : `${activeCount} active automation${activeCount > 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Shopify path options for variable mapping ──────────────────────────────

interface ShopifyPathOption {
  value: string;
  label: string;
  category: string;
}

const ORDER_PATHS: ShopifyPathOption[] = [
  { value: 'name',                      label: 'Order Number',           category: 'Order' },
  { value: 'order_number',              label: 'Order Number (numeric)', category: 'Order' },
  { value: 'total_price',               label: 'Order Total',            category: 'Order' },
  { value: 'subtotal_price',            label: 'Subtotal',               category: 'Order' },
  { value: 'financial_status',          label: 'Payment Status',         category: 'Order' },
  { value: 'fulfillment_status',        label: 'Fulfillment Status',     category: 'Order' },
  { value: 'created_at',               label: 'Order Date',             category: 'Order' },
  { value: 'customer.first_name',       label: 'Customer First Name',    category: 'Customer' },
  { value: 'customer.last_name',        label: 'Customer Last Name',     category: 'Customer' },
  { value: 'customer.email',            label: 'Customer Email',         category: 'Customer' },
  { value: 'customer.phone',            label: 'Customer Phone',         category: 'Customer' },
  { value: 'shipping_address.address1', label: 'Shipping Street',        category: 'Shipping' },
  { value: 'shipping_address.city',     label: 'Shipping City',          category: 'Shipping' },
  { value: 'shipping_address.province', label: 'Shipping State',         category: 'Shipping' },
  { value: 'shipping_address.zip',      label: 'Shipping Postcode',      category: 'Shipping' },
  { value: 'shipping_address.country',  label: 'Shipping Country',       category: 'Shipping' },
  { value: 'line_items.0.name',         label: 'First Item Name',        category: 'Items' },
  { value: 'line_items.0.quantity',     label: 'First Item Quantity',    category: 'Items' },
  { value: 'line_items.0.price',        label: 'First Item Price',       category: 'Items' },
];

const CART_PATHS: ShopifyPathOption[] = [
  { value: 'total_price',           label: 'Cart Total',          category: 'Cart' },
  { value: 'email',                 label: 'Customer Email',       category: 'Customer' },
  { value: 'phone',                 label: 'Customer Phone',       category: 'Customer' },
  { value: 'customer.first_name',   label: 'Customer First Name',  category: 'Customer' },
  { value: 'customer.last_name',    label: 'Customer Last Name',   category: 'Customer' },
  { value: 'shipping_address.city', label: 'Shipping City',        category: 'Shipping' },
];

const CUSTOM_SENTINEL = '__custom__';

function getPathOptions(event: string): ShopifyPathOption[] {
  return event === 'ABANDONED_CART' ? CART_PATHS : ORDER_PATHS;
}

function groupByCategory(options: ShopifyPathOption[]): Map<string, ShopifyPathOption[]> {
  const map = new Map<string, ShopifyPathOption[]>();
  for (const opt of options) {
    const group = map.get(opt.category) ?? [];
    group.push(opt);
    map.set(opt.category, group);
  }
  return map;
}

// ── Variable Mapping Section ───────────────────────────────────────────────

interface VariableMappingProps {
  template: Template | null;
  mapping: Record<string, string>;
  onChange: (mapping: Record<string, string>) => void;
  shopifyEvent: string;
}

function VariableMappingSection({ template, mapping, onChange, shopifyEvent }: VariableMappingProps) {
  const [customPositions, setCustomPositions] = useState<Set<string>>(new Set());

  if (!template) return null;

  const bodyText = extractBodyText(template.components);
  const variables = detectVariables(bodyText);

  if (variables.length === 0) return null;

  const pathOptions = getPathOptions(shopifyEvent);
  const grouped = groupByCategory(pathOptions);
  const knownValues = new Set(pathOptions.map((o) => o.value));

  const handleSelectChange = (pos: string, selected: string) => {
    if (selected === CUSTOM_SENTINEL) {
      setCustomPositions((prev) => new Set(prev).add(pos));
      onChange({ ...mapping, [pos]: '' });
    } else {
      setCustomPositions((prev) => {
        const next = new Set(prev);
        next.delete(pos);
        return next;
      });
      onChange({ ...mapping, [pos]: selected });
    }
  };

  const isCustom = (pos: string): boolean =>
    customPositions.has(pos) || (!!mapping[pos] && !knownValues.has(mapping[pos]));

  const selectValue = (pos: string): string =>
    isCustom(pos) ? CUSTOM_SENTINEL : (mapping[pos] ?? '');

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-foreground">Variable Mapping</p>
        {bodyText && (
          <p className="text-xs text-muted-foreground mt-1 font-mono bg-muted rounded px-2 py-1.5 leading-relaxed">
            {bodyText}
          </p>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Select the Shopify field to use for each template variable.
      </p>
      <div className="space-y-3">
        {variables.map((pos) => (
          <div key={pos} className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-muted-foreground w-10 shrink-0">
                {`{{${pos}}}`}
              </span>
              <Select value={selectValue(pos)} onValueChange={(val) => handleSelectChange(pos, val)}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select a Shopify field…" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(grouped.entries()).map(([category, options]) => (
                    <SelectGroup key={category}>
                      <SelectLabel>{category}</SelectLabel>
                      {options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <span>{opt.label}</span>
                          <span className="ml-2 font-mono text-xs text-muted-foreground">
                            {opt.value}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                  <SelectGroup>
                    <SelectLabel>Advanced</SelectLabel>
                    <SelectItem value={CUSTOM_SENTINEL}>Custom path…</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            {isCustom(pos) && (
              <div className="ml-12">
                <Input
                  placeholder="e.g. line_items.0.sku"
                  value={mapping[pos] ?? ''}
                  onChange={(e) => onChange({ ...mapping, [pos]: e.target.value })}
                  className="text-sm font-mono"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Automation Form Dialog ─────────────────────────────────────────────────

interface AutomationFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: CreateAutomationInput) => Promise<void>;
  initialData?: Automation | null;
  approvedTemplates: Template[];
}

function AutomationFormDialog({
  open,
  onClose,
  onSubmit,
  initialData,
  approvedTemplates,
}: AutomationFormDialogProps) {
  const isEdit = initialData !== null && initialData !== undefined;

  const [name, setName] = useState(initialData?.name ?? '');
  const [shopifyEvent, setShopifyEvent] = useState<ShopifyEvent>(
    initialData?.shopifyEvent ?? 'PREPAID_ORDER_CONFIRMED',
  );
  const [templateId, setTemplateId] = useState(initialData?.templateId ?? '');
  const [delayMinutes, setDelayMinutes] = useState(String(initialData?.delayMinutes ?? 0));
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [variableMapping, setVariableMapping] = useState<Record<string, string>>(
    initialData?.variableMapping ?? {},
  );
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const selectedTemplate = approvedTemplates.find((t) => t.id === templateId) ?? null;

  // Reset form when dialog opens
  const handleOpenChange = (o: boolean) => {
    if (!o) {
      onClose();
      setFormError(null);
    }
  };

  const handleTemplateChange = (id: string) => {
    setTemplateId(id);
    setVariableMapping({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Name is required');
      return;
    }
    if (!templateId) {
      setFormError('Please select a template');
      return;
    }
    const delay = parseInt(delayMinutes, 10);
    if (isNaN(delay) || delay < 0) {
      setFormError('Delay must be 0 or a positive number');
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        shopifyEvent,
        templateId,
        variableMapping,
        isActive,
        delayMinutes: delay,
      });
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save automation');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Automation' : 'New Automation'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the automation configuration.'
              : 'Set up a WhatsApp message to send automatically on a Shopify event.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          {formError && (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="automation-name">Name</Label>
            <Input
              id="automation-name"
              placeholder="e.g. Prepaid Order Confirmation"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="shopify-event">Shopify Event</Label>
            <Select
              value={shopifyEvent}
              onValueChange={(v) => setShopifyEvent(v as ShopifyEvent)}
            >
              <SelectTrigger id="shopify-event">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SHOPIFY_EVENTS.map((ev) => (
                  <SelectItem key={ev} value={ev}>
                    {EVENT_CONFIG[ev].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="template-select">Template</Label>
            {approvedTemplates.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No approved templates available. Approve a template first.
              </p>
            ) : (
              <Select value={templateId} onValueChange={handleTemplateChange}>
                <SelectTrigger id="template-select">
                  <SelectValue placeholder="Select a template..." />
                </SelectTrigger>
                <SelectContent>
                  {approvedTemplates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="delay-minutes">Delay (minutes) — 0 for immediate</Label>
            <Input
              id="delay-minutes"
              type="number"
              min={0}
              value={delayMinutes}
              onChange={(e) => setDelayMinutes(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <ToggleSwitch
              checked={isActive}
              onToggle={() => setIsActive((prev) => !prev)}
            />
            <Label className="cursor-pointer" onClick={() => setIsActive((prev) => !prev)}>
              Active on {isEdit ? 'save' : 'create'}
            </Label>
          </div>

          <VariableMappingSection
            template={selectedTemplate}
            mapping={variableMapping}
            onChange={setVariableMapping}
            shopifyEvent={shopifyEvent}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {saving ? 'Saving...' : isEdit ? 'Update Automation' : 'Create Automation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Logs Dialog ────────────────────────────────────────────────────────────

interface LogsDialogProps {
  automation: Automation | null;
  onClose: () => void;
  fetchLogs: (
    id: string,
    page?: number,
  ) => Promise<{
    items: AutomationLog[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }>;
}

function LogsDialog({ automation, onClose, fetchLogs }: LogsDialogProps) {
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [logsMeta, setLogsMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (pageNum: number) => {
      if (!automation) return;
      setLoading(true);
      setError(null);
      try {
        const result = await fetchLogs(automation.id, pageNum);
        setLogs(result.items);
        setLogsMeta(result.meta);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load logs');
      } finally {
        setLoading(false);
      }
    },
    [automation, fetchLogs],
  );

  // Load when automation changes (dialog opens)
  const prevId = automation?.id;
  useState(() => {
    if (prevId) void load(1);
  });

  // We need useEffect for the load trigger — using a pattern that works without hooks order issues
  const [initialized, setInitialized] = useState(false);
  if (!initialized && automation) {
    setInitialized(true);
    void load(1);
  }

  const logStatusBadge = (status: AutomationLog['status']) => {
    if (status === 'SENT')
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-0">
          Sent
        </Badge>
      );
    if (status === 'FAILED')
      return (
        <Badge variant="destructive">Failed</Badge>
      );
    return <Badge variant="secondary">Pending</Badge>;
  };

  return (
    <Dialog open={automation !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Automation Logs</DialogTitle>
          <DialogDescription>
            {automation?.name} — {logsMeta.total} total entries
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void load(logsMeta.page)}
            disabled={loading}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="overflow-y-auto flex-1">
          {loading && logs.length === 0 ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No logs yet for this automation.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>WA Message ID</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{log.customerPhone}</TableCell>
                    <TableCell>{logStatusBadge(log.status)}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground max-w-[180px] truncate">
                      {log.waMessageId ?? '—'}
                    </TableCell>
                    <TableCell className="text-xs text-destructive max-w-[200px] truncate">
                      {log.errorMessage ?? '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {logsMeta.totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Page {logsMeta.page} of {logsMeta.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={logsMeta.page <= 1 || loading}
                onClick={() => void load(logsMeta.page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={logsMeta.page >= logsMeta.totalPages || loading}
                onClick={() => void load(logsMeta.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Delete Confirmation Dialog ─────────────────────────────────────────────

interface DeleteDialogProps {
  automation: Automation | null;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
}

function DeleteDialog({ automation, onClose, onConfirm }: DeleteDialogProps) {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    if (!automation) return;
    setDeleting(true);
    try {
      await onConfirm(automation.id);
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={automation !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Automation</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete{' '}
            <span className="font-medium text-foreground">{automation?.name}</span>? This will
            also delete all associated logs. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={deleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => void handleConfirm()}
            disabled={deleting}
          >
            {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

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

  const handleCreate = async (input: CreateAutomationInput) => {
    await createAutomation(input);
    toast({ title: 'Automation created', description: input.name });
  };

  const handleUpdate = async (input: CreateAutomationInput) => {
    if (!editTarget) return;
    await updateAutomation(editTarget.id, input);
    toast({ title: 'Automation updated', description: input.name });
    setEditTarget(null);
  };

  const handleDelete = async (id: string) => {
    await removeAutomation(id);
    toast({ title: 'Automation deleted' });
  };

  const handleToggle = async (automation: Automation) => {
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
  };

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

      {/* Error State */}
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

      {/* Automations Table */}
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
                const cfg = getEventConfig(automation);
                return (
                  <TableRow key={automation.id}>
                    <TableCell className="font-medium text-sm">{automation.name}</TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          'text-xs font-medium border-0',
                          cfg.badgeClass,
                        )}
                      >
                        {cfg.label}
                      </Badge>
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
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
        initialData={null}
        approvedTemplates={approvedTemplates}
      />

      {/* Edit Dialog */}
      <AutomationFormDialog
        open={editTarget !== null}
        onClose={() => setEditTarget(null)}
        onSubmit={handleUpdate}
        initialData={editTarget}
        approvedTemplates={approvedTemplates}
      />

      {/* Logs Dialog */}
      <LogsDialog
        automation={logsTarget}
        onClose={() => setLogsTarget(null)}
        fetchLogs={fetchLogs}
      />

      {/* Delete Dialog */}
      <DeleteDialog
        automation={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
