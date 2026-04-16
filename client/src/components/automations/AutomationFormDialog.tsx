import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { EVENT_CONFIG } from '@/lib/automation-utils';
import { VariableMappingSection } from './VariableMappingSection';
import type { Template, ShopifyEvent } from '@/types';
import type { CreateAutomationInput } from '@/hooks/use-automations';

const SHOPIFY_EVENTS = Object.keys(EVENT_CONFIG) as ShopifyEvent[];

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

// ── Form data type ────────────────────────────────────────────────────────────

export type AutomationFormData = CreateAutomationInput;

// ── Component ─────────────────────────────────────────────────────────────────

interface AutomationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: Partial<AutomationFormData> & {
    shopifyEvent?: ShopifyEvent | null;
    buttonTriggerText?: string | null;
    variableMapping?: Record<string, string>;
    isActive?: boolean;
  };
  approvedTemplates: Template[];
  onSubmit: (data: AutomationFormData) => Promise<void>;
  isSubmitting?: boolean;
  mode: 'create' | 'edit';
}

export function AutomationFormDialog({
  open,
  onOpenChange,
  initialValues,
  approvedTemplates,
  onSubmit,
  mode,
}: AutomationFormDialogProps) {
  const isEdit = mode === 'edit';

  const [name, setName] = useState(initialValues?.name ?? '');
  const [triggerType, setTriggerType] = useState<'SHOPIFY_EVENT' | 'BUTTON_REPLY'>(
    initialValues?.triggerType ?? 'SHOPIFY_EVENT',
  );
  const [shopifyEvent, setShopifyEvent] = useState<ShopifyEvent>(
    initialValues?.shopifyEvent ?? 'PREPAID_ORDER_CONFIRMED',
  );
  const [buttonTriggerText, setButtonTriggerText] = useState(
    initialValues?.buttonTriggerText ?? '',
  );
  const [templateId, setTemplateId] = useState(initialValues?.templateId ?? '');
  const [delayMinutes, setDelayMinutes] = useState(String(initialValues?.delayMinutes ?? 0));
  const [isActive, setIsActive] = useState(initialValues?.isActive ?? true);
  const [variableMapping, setVariableMapping] = useState<Record<string, string>>(
    initialValues?.variableMapping ?? {},
  );
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const selectedTemplate = approvedTemplates.find((t) => t.id === templateId) ?? null;

  const handleOpenChange = (o: boolean) => {
    if (!o) {
      setFormError(null);
    }
    onOpenChange(o);
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
    if (triggerType === 'BUTTON_REPLY' && !buttonTriggerText.trim()) {
      setFormError('Button trigger text is required');
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
        triggerType,
        ...(triggerType === 'SHOPIFY_EVENT'
          ? { shopifyEvent }
          : { buttonTriggerText: buttonTriggerText.trim() }),
        templateId,
        variableMapping,
        isActive,
        delayMinutes: delay,
      });
      onOpenChange(false);
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
              : 'Configure a WhatsApp message sent automatically on a trigger.'}
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
              placeholder="e.g. COD Order Confirmation"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="trigger-type">Trigger Type</Label>
            <Select
              value={triggerType}
              onValueChange={(v) => setTriggerType(v as 'SHOPIFY_EVENT' | 'BUTTON_REPLY')}
            >
              <SelectTrigger id="trigger-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SHOPIFY_EVENT">Shopify Event</SelectItem>
                <SelectItem value="BUTTON_REPLY">WhatsApp Button Reply</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {triggerType === 'SHOPIFY_EVENT' ? (
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
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="button-trigger-text">Button Text (exact match)</Label>
              <Input
                id="button-trigger-text"
                placeholder="e.g. Confirm My Order"
                value={buttonTriggerText}
                onChange={(e) => setButtonTriggerText(e.target.value)}
                maxLength={20}
              />
              <p className="text-xs text-muted-foreground">
                Must match the quick reply button label exactly (max 20 characters).
              </p>
            </div>
          )}

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
            shopifyEvent={triggerType === 'SHOPIFY_EVENT' ? shopifyEvent : 'PREPAID_ORDER_CONFIRMED'}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
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
