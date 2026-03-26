import { useState, useRef } from 'react';
import {
  Plus,
  RefreshCw,
  Trash2,
  RotateCcw,
  FileText,
  Info,
  X,
  ExternalLink,
  Phone,
  Copy,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
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
import {
  useTemplates,
  type StatusFilter,
  type CreateTemplateInput,
  type TemplateComponentInput,
  type TemplateButtonInput,
} from '@/hooks/use-templates';
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
    return <Badge variant="destructive">REJECTED</Badge>;
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
  return [...new Set(matches)].sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, ''), 10);
    const numB = parseInt(b.replace(/\D/g, ''), 10);
    return numA - numB;
  });
}

// ── Component helpers ─────────────────────────────────────────────────────────

type ComponentsArray = Array<{ type?: string; text?: string; buttons?: unknown[] }>;

function getBodyText(components: unknown): string {
  if (!Array.isArray(components)) return '';
  const comps = components as ComponentsArray;
  for (const c of comps) {
    if (c.type === 'BODY' && c.text) return c.text;
  }
  for (const c of comps) {
    if (c.text) return c.text;
  }
  return '';
}

function getButtonCount(components: unknown): number {
  if (!Array.isArray(components)) return 0;
  const comps = components as ComponentsArray;
  for (const c of comps) {
    if (c.type === 'BUTTONS' && Array.isArray(c.buttons)) return c.buttons.length;
  }
  return 0;
}

// ── Toggle switch ────────────────────────────────────────────────────────────

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${enabled ? 'bg-primary' : 'bg-muted'}`}
      role="switch"
      aria-checked={enabled}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-background shadow transition-transform ${enabled ? 'translate-x-4' : 'translate-x-0.5'}`}
      />
    </button>
  );
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
  const buttonCount = getButtonCount(template.components);

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
        <div className="mt-2 flex flex-wrap gap-1">
          {variables.map((v) => (
            <span
              key={v}
              className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground"
            >
              {v}
            </span>
          ))}
          {buttonCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary font-medium">
              <MessageSquare className="h-3 w-3" />
              {buttonCount} button{buttonCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
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

interface PreviewButton {
  type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | 'COPY_CODE';
  text: string;
}

interface PreviewBubbleProps {
  header?: string;
  body: string;
  footer?: string;
  buttons?: PreviewButton[];
}

function PreviewBubble({ header, body, footer, buttons }: PreviewBubbleProps) {
  if (!body && !header) return null;

  const quickReplies = buttons?.filter((b) => b.type === 'QUICK_REPLY') ?? [];
  const ctaButtons = buttons?.filter((b) => b.type !== 'QUICK_REPLY') ?? [];

  return (
    <div className="mt-4 p-3 bg-muted rounded-lg">
      <p className="text-xs text-muted-foreground mb-2 font-medium">Preview</p>
      <div className="max-w-xs">
        <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-3 shadow-sm">
          {header && <p className="text-xs font-semibold text-foreground mb-1">{header}</p>}
          {body && <p className="text-sm text-foreground whitespace-pre-wrap">{body}</p>}
          {footer && <p className="text-xs text-muted-foreground mt-1">{footer}</p>}
        </div>

        {/* CTA buttons */}
        {ctaButtons.length > 0 && (
          <div className="mt-0.5 space-y-0.5">
            {ctaButtons.map((btn, i) => (
              <div
                key={i}
                className="bg-white dark:bg-card border border-border rounded-lg px-3 py-2 flex items-center justify-center gap-1.5 text-sm font-medium text-primary"
              >
                {btn.type === 'URL' && <ExternalLink className="h-3.5 w-3.5" />}
                {btn.type === 'PHONE_NUMBER' && <Phone className="h-3.5 w-3.5" />}
                {btn.type === 'COPY_CODE' && <Copy className="h-3.5 w-3.5" />}
                {btn.text || 'Button'}
              </div>
            ))}
          </div>
        )}

        {/* Quick replies */}
        {quickReplies.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {quickReplies.map((btn, i) => (
              <div
                key={i}
                className="bg-white dark:bg-card border border-border rounded-full px-3 py-1 text-xs font-medium text-primary"
              >
                {btn.text || 'Quick Reply'}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Button type for the dialog state ────────────────────────────────────────

interface DialogButton {
  type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | 'COPY_CODE';
  text: string;
  url: string;
  phone_number: string;
  example: string; // URL example or copy code value
}

function makeButton(type: DialogButton['type']): DialogButton {
  return { type, text: '', url: '', phone_number: '', example: '' };
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
  const [createError, setCreateError] = useState<string | null>(null);

  // Step 1
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('');
  const [category, setCategory] = useState<'MARKETING' | 'UTILITY' | 'AUTHENTICATION' | ''>('');

  // Step 2 — components
  const [headerEnabled, setHeaderEnabled] = useState(false);
  const [headerText, setHeaderText] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [footerEnabled, setFooterEnabled] = useState(false);
  const [footerText, setFooterText] = useState('');

  // Step 2 — variable samples
  const [bodySamples, setBodySamples] = useState<string[]>([]);

  // Step 2 — buttons
  const [buttonsEnabled, setButtonsEnabled] = useState(false);
  const [buttonGroup, setButtonGroup] = useState<'QUICK_REPLY' | 'CTA'>('QUICK_REPLY');
  const [buttons, setButtons] = useState<DialogButton[]>([]);

  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // ── Keep bodySamples in sync with detected variables ─────────────────────

  const detectedVars = extractVariables(bodyText);

  const syncSamples = (newBodyText: string) => {
    const vars = extractVariables(newBodyText);
    setBodySamples((prev) => {
      const next = [...prev];
      while (next.length < vars.length) next.push('');
      return next.slice(0, vars.length);
    });
  };

  const handleBodyChange = (val: string) => {
    setBodyText(val);
    syncSamples(val);
  };

  // ── Reset ─────────────────────────────────────────────────────────────────

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
    setBodySamples([]);
    setButtonsEnabled(false);
    setButtonGroup('QUICK_REPLY');
    setButtons([]);
    setCreateError(null);
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) resetForm();
    onOpenChange(val);
  };

  // ── Insert variable into body ─────────────────────────────────────────────

  const insertVariable = () => {
    const existing = extractVariables(bodyText);
    const nextNum = existing.length + 1;
    const variable = `{{${nextNum}}}`;
    if (bodyRef.current) {
      const start = bodyRef.current.selectionStart ?? bodyText.length;
      const end = bodyRef.current.selectionEnd ?? bodyText.length;
      const newText = bodyText.slice(0, start) + variable + bodyText.slice(end);
      handleBodyChange(newText);
      setTimeout(() => {
        if (bodyRef.current) {
          const pos = start + variable.length;
          bodyRef.current.setSelectionRange(pos, pos);
          bodyRef.current.focus();
        }
      }, 0);
    } else {
      handleBodyChange(bodyText + variable);
    }
  };

  // ── Button helpers ────────────────────────────────────────────────────────

  const addButton = (type: DialogButton['type']) => {
    setButtons((prev) => [...prev, makeButton(type)]);
  };

  const updateButton = (index: number, patch: Partial<DialogButton>) => {
    setButtons((prev) => prev.map((b, i) => (i === index ? { ...b, ...patch } : b)));
  };

  const removeButton = (index: number) => {
    setButtons((prev) => prev.filter((_, i) => i !== index));
  };

  const handleButtonGroupChange = (group: 'QUICK_REPLY' | 'CTA') => {
    setButtonGroup(group);
    setButtons([]);
  };

  // ── Validation ────────────────────────────────────────────────────────────

  const step1Valid =
    name.trim() !== '' && /^[a-z0-9_]+$/.test(name) && language !== '' && category !== '';

  const samplesValid =
    detectedVars.length === 0 || bodySamples.every((s) => s.trim() !== '');

  const buttonsValid = (() => {
    if (!buttonsEnabled) return true;
    if (buttons.length === 0) return false;
    return buttons.every((btn) => {
      if (!btn.text.trim()) return false;
      if (btn.type === 'URL' && !btn.url.trim()) return false;
      if (btn.type === 'PHONE_NUMBER' && !btn.phone_number.trim()) return false;
      if (btn.type === 'COPY_CODE' && !btn.example.trim()) return false;
      return true;
    });
  })();

  const step2Valid = bodyText.trim() !== '' && samplesValid && buttonsValid;

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    const components: TemplateComponentInput[] = [];

    if (headerEnabled && headerText.trim()) {
      components.push({ type: 'HEADER', format: 'TEXT', text: headerText.trim() });
    }

    const bodyComponent: TemplateComponentInput = { type: 'BODY', text: bodyText.trim() };
    if (bodySamples.length > 0) {
      bodyComponent.example = bodySamples.map((s) => s.trim());
    }
    components.push(bodyComponent);

    if (footerEnabled && footerText.trim()) {
      components.push({ type: 'FOOTER', text: footerText.trim() });
    }

    if (buttonsEnabled && buttons.length > 0) {
      const btnInputs: TemplateButtonInput[] = buttons.map((btn) => {
        const base: TemplateButtonInput = { type: btn.type, text: btn.text.trim() };
        if (btn.type === 'URL') {
          base.url = btn.url.trim();
          if (btn.example.trim()) base.example = btn.example.trim();
        }
        if (btn.type === 'PHONE_NUMBER') {
          base.phone_number = btn.phone_number.trim();
        }
        if (btn.type === 'COPY_CODE') {
          base.example = btn.example.trim();
        }
        return base;
      });
      components.push({ type: 'BUTTONS', buttons: btnInputs });
    }

    setCreateError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        language,
        category: category as 'MARKETING' | 'UTILITY' | 'AUTHENTICATION',
        components,
      });
      handleOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create template';
      setCreateError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Quick reply buttons UI ────────────────────────────────────────────────

  const quickReplies = buttons.filter((b) => b.type === 'QUICK_REPLY');

  // ── CTA button state helpers ──────────────────────────────────────────────

  const urlBtn = buttons.find((b) => b.type === 'URL');
  const phoneBtn = buttons.find((b) => b.type === 'PHONE_NUMBER');
  const copyBtn = buttons.find((b) => b.type === 'COPY_CODE');

  const urlBtnIndex = buttons.findIndex((b) => b.type === 'URL');
  const phoneBtnIndex = buttons.findIndex((b) => b.type === 'PHONE_NUMBER');
  const copyBtnIndex = buttons.findIndex((b) => b.type === 'COPY_CODE');

  const isDynamicUrl = urlBtn ? /\{\{1\}\}/.test(urlBtn.url) : false;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? 'New Template — Basic Info' : 'New Template — Components'}
          </DialogTitle>
        </DialogHeader>

        {/* ── Step 1 ── */}
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
                Lowercase letters and underscores only, e.g.{' '}
                <span className="font-mono">order_confirmed</span>
              </p>
              {name && !/^[a-z0-9_]+$/.test(name) && (
                <p className="text-xs text-destructive">Only lowercase letters, numbers, and underscores allowed</p>
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
              <Select
                value={category}
                onValueChange={(v) =>
                  setCategory(v as 'MARKETING' | 'UTILITY' | 'AUTHENTICATION')
                }
              >
                <SelectTrigger id="tpl-category">
                  <SelectValue placeholder="Select category…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTILITY">Utility</SelectItem>
                  <SelectItem value="MARKETING">Marketing</SelectItem>
                  <SelectItem value="AUTHENTICATION">Authentication</SelectItem>
                </SelectContent>
              </Select>
              {category === 'AUTHENTICATION' && (
                <p className="text-xs text-muted-foreground">
                  Authentication templates support the Copy Code button type.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Step 2 ── */}
        {step === 2 && (
          <div className="space-y-5">
            {/* Header */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Header (optional)</Label>
                <Toggle enabled={headerEnabled} onToggle={() => setHeaderEnabled((v) => !v)} />
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
                  Add Variable
                </Button>
              </div>
              <Textarea
                id="tpl-body"
                ref={bodyRef}
                placeholder="Hello {{1}}, your order {{2}} has been confirmed."
                value={bodyText}
                onChange={(e) => handleBodyChange(e.target.value)}
                className="min-h-[100px]"
              />
              <div className="flex items-start gap-1.5 rounded-md border border-dashed p-2 text-xs text-muted-foreground">
                <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                <span>
                  Use <span className="font-mono">{'{{1}}'}</span>,{' '}
                  <span className="font-mono">{'{{2}}'}</span> for variables mapped to Shopify data in automations.
                </span>
              </div>
            </div>

            {/* Variable sample values */}
            {detectedVars.length > 0 && (
              <div className="space-y-2 rounded-lg border bg-muted/40 p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Sample Values</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Required by Meta to review your template. Use realistic example values.
                  </p>
                </div>
                {detectedVars.map((v, i) => (
                  <div key={v} className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground w-8 shrink-0">{v}</span>
                    <Input
                      placeholder={`Sample for ${v}`}
                      value={bodySamples[i] ?? ''}
                      onChange={(e) => {
                        const next = [...bodySamples];
                        next[i] = e.target.value;
                        setBodySamples(next);
                      }}
                      className="h-8 text-sm"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Footer (optional)</Label>
                <Toggle enabled={footerEnabled} onToggle={() => setFooterEnabled((v) => !v)} />
              </div>
              {footerEnabled && (
                <Input
                  placeholder="Footer text (e.g. Reply STOP to unsubscribe)"
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                />
              )}
            </div>

            {/* Buttons */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Buttons (optional)</Label>
                  <p className="text-xs text-muted-foreground">
                    Add interactive buttons to your template
                  </p>
                </div>
                <Toggle enabled={buttonsEnabled} onToggle={() => setButtonsEnabled((v) => !v)} />
              </div>

              {buttonsEnabled && (
                <div className="space-y-3 rounded-lg border p-3">
                  {/* Button type selector */}
                  <div className="flex rounded-md border overflow-hidden">
                    <button
                      type="button"
                      onClick={() => handleButtonGroupChange('QUICK_REPLY')}
                      className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
                        buttonGroup === 'QUICK_REPLY'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      Quick Replies
                    </button>
                    <button
                      type="button"
                      onClick={() => handleButtonGroupChange('CTA')}
                      className={`flex-1 py-1.5 text-xs font-medium border-l transition-colors ${
                        buttonGroup === 'CTA'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      Call to Action
                    </button>
                  </div>

                  {/* Quick Replies */}
                  {buttonGroup === 'QUICK_REPLY' && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Up to 3 quick reply buttons. Text max 25 characters.
                      </p>
                      {quickReplies.map((btn, qIdx) => {
                        const globalIdx = buttons.findIndex(
                          (b, bi) =>
                            b.type === 'QUICK_REPLY' &&
                            buttons.slice(0, bi).filter((x) => x.type === 'QUICK_REPLY').length === qIdx,
                        );
                        return (
                          <div key={qIdx} className="flex items-center gap-2">
                            <Input
                              placeholder={`Quick reply text`}
                              value={btn.text}
                              onChange={(e) => updateButton(globalIdx, { text: e.target.value })}
                              maxLength={25}
                              className="h-8 text-sm"
                            />
                            <span className="text-xs text-muted-foreground shrink-0 w-8 text-right">
                              {btn.text.length}/25
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 shrink-0"
                              onClick={() => removeButton(globalIdx)}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        );
                      })}
                      {quickReplies.length < 3 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full h-8 text-xs gap-1"
                          onClick={() => addButton('QUICK_REPLY')}
                        >
                          <Plus className="h-3 w-3" />
                          Add Quick Reply
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Call to Action */}
                  {buttonGroup === 'CTA' && (
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground">
                        Add up to 1 URL and 1 phone number button. Max 2 CTA buttons total.
                      </p>

                      {/* URL button */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs flex items-center gap-1">
                            <ExternalLink className="h-3.5 w-3.5" /> Visit Website
                          </Label>
                          <Toggle
                            enabled={!!urlBtn}
                            onToggle={() => {
                              if (urlBtn) {
                                removeButton(urlBtnIndex);
                              } else {
                                addButton('URL');
                              }
                            }}
                          />
                        </div>
                        {urlBtn && (
                          <div className="space-y-1.5 pl-2 border-l-2 border-muted">
                            <Input
                              placeholder="Button text (max 25 chars)"
                              value={urlBtn.text}
                              onChange={(e) => updateButton(urlBtnIndex, { text: e.target.value })}
                              maxLength={25}
                              className="h-8 text-sm"
                            />
                            <Input
                              placeholder="https://example.com/order/{{1}}"
                              value={urlBtn.url}
                              onChange={(e) => updateButton(urlBtnIndex, { url: e.target.value })}
                              className="h-8 text-sm font-mono"
                            />
                            {isDynamicUrl && (
                              <Input
                                placeholder="Example URL (e.g. https://example.com/order/12345)"
                                value={urlBtn.example}
                                onChange={(e) =>
                                  updateButton(urlBtnIndex, { example: e.target.value })
                                }
                                className="h-8 text-sm"
                              />
                            )}
                            {urlBtn.url && !isDynamicUrl && (
                              <p className="text-xs text-muted-foreground">
                                Tip: use <span className="font-mono">{'{{1}}'}</span> in the URL for a dynamic link per customer.
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Phone number button */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" /> Call Phone Number
                          </Label>
                          <Toggle
                            enabled={!!phoneBtn}
                            onToggle={() => {
                              if (phoneBtn) {
                                removeButton(phoneBtnIndex);
                              } else {
                                addButton('PHONE_NUMBER');
                              }
                            }}
                          />
                        </div>
                        {phoneBtn && (
                          <div className="space-y-1.5 pl-2 border-l-2 border-muted">
                            <Input
                              placeholder="Button text (max 25 chars)"
                              value={phoneBtn.text}
                              onChange={(e) =>
                                updateButton(phoneBtnIndex, { text: e.target.value })
                              }
                              maxLength={25}
                              className="h-8 text-sm"
                            />
                            <Input
                              placeholder="+919876543210"
                              value={phoneBtn.phone_number}
                              onChange={(e) =>
                                updateButton(phoneBtnIndex, { phone_number: e.target.value })
                              }
                              className="h-8 text-sm font-mono"
                            />
                          </div>
                        )}
                      </div>

                      {/* Copy Code button (AUTHENTICATION only) */}
                      {category === 'AUTHENTICATION' && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs flex items-center gap-1">
                              <Copy className="h-3.5 w-3.5" /> Copy Code
                            </Label>
                            <Toggle
                              enabled={!!copyBtn}
                              onToggle={() => {
                                if (copyBtn) {
                                  removeButton(copyBtnIndex);
                                } else {
                                  addButton('COPY_CODE');
                                }
                              }}
                            />
                          </div>
                          {copyBtn && (
                            <div className="space-y-1.5 pl-2 border-l-2 border-muted">
                              <Input
                                placeholder="Example code (e.g. 123456)"
                                value={copyBtn.example}
                                onChange={(e) =>
                                  updateButton(copyBtnIndex, { example: e.target.value })
                                }
                                className="h-8 text-sm font-mono"
                              />
                              <p className="text-xs text-muted-foreground">
                                Meta uses this as a sample code during template review. The actual code is sent dynamically.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Preview */}
            <PreviewBubble
              header={headerEnabled ? headerText : undefined}
              body={bodyText}
              footer={footerEnabled ? footerText : undefined}
              buttons={
                buttonsEnabled
                  ? buttons.map((b) => ({ type: b.type, text: b.text }))
                  : undefined
              }
            />
          </div>
        )}

        {createError && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Meta rejected this template</AlertTitle>
            <AlertDescription>{createError}</AlertDescription>
          </Alert>
        )}

        <DialogFooter className="gap-2 pt-2">
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
      // Show a brief toast notification; the dialog also displays the full
      // error inline via createError state so the user can read and fix it.
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
