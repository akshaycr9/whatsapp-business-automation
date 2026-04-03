import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import type { Template, Message, ApiResponse, PaginatedResponse } from '@/types';

interface Props {
  conversationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMessageSent: (message: Message) => void;
}

interface TemplateComponent {
  type: string;
  text?: string;
  buttons?: Array<{ type: string; text: string; url?: string }>;
}

function extractVariablePositions(components: unknown): number[] {
  const comps = (components as TemplateComponent[]) ?? [];
  const bodyComp = comps.find((c) => c.type === 'BODY');
  if (!bodyComp?.text) return [];
  const matches = bodyComp.text.match(/\{\{(\d+)\}\}/g) ?? [];
  const positions = matches.map((m) => parseInt(m.replace(/\D/g, ''), 10));
  return [...new Set(positions)].sort((a, b) => a - b);
}

interface UrlButtonVar {
  key: string;         // e.g. "btn_0_1"
  varPos: number;      // e.g. 1
  buttonLabel: string; // e.g. "Track Order"
}

function extractUrlButtonVars(components: unknown): UrlButtonVar[] {
  const comps = (components as TemplateComponent[]) ?? [];
  const buttonsComp = comps.find((c) => c.type === 'BUTTONS');
  if (!buttonsComp?.buttons) return [];

  const result: UrlButtonVar[] = [];
  buttonsComp.buttons.forEach((btn, buttonIndex) => {
    if (btn.type !== 'URL' || !btn.url) return;
    const matches = btn.url.match(/\{\{(\d+)\}\}/g) ?? [];
    const positions = [...new Set(matches.map((m) => parseInt(m.replace(/\D/g, ''), 10)))].sort((a, b) => a - b);
    positions.forEach((varPos) => {
      result.push({ key: `btn_${buttonIndex}_${varPos}`, varPos, buttonLabel: btn.text });
    });
  });
  return result;
}

function getBodyText(components: unknown): string {
  const comps = (components as TemplateComponent[]) ?? [];
  return comps.find((c) => c.type === 'BODY')?.text ?? '';
}

const CATEGORY_LABELS: Record<string, string> = {
  MARKETING: 'Marketing',
  UTILITY: 'Utility',
  AUTHENTICATION: 'Auth',
};

export const TemplateSendDialog = React.memo(function TemplateSendDialog({ conversationId, open, onOpenChange, onMessageSent }: Props) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<PaginatedResponse<Template>>('/templates', {
        params: { status: 'APPROVED', limit: 100 },
      });
      setTemplates(response.data.data);
    } catch {
      toast({ title: 'Failed to load templates', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      void fetchTemplates();
      setSelectedTemplate(null);
      setVariables({});
    }
  }, [open, fetchTemplates]);

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    // Pre-populate all variable keys (body + URL button) with empty strings
    const initial: Record<string, string> = {};
    for (const pos of extractVariablePositions(template.components)) {
      initial[String(pos)] = '';
    }
    for (const v of extractUrlButtonVars(template.components)) {
      initial[v.key] = '';
    }
    setVariables(initial);
  };

  const handleSend = async () => {
    if (!selectedTemplate) return;
    setSending(true);
    try {
      const response = await api.post<ApiResponse<Message>>(
        `/conversations/${conversationId}/messages/template`,
        { templateId: selectedTemplate.id, variables },
      );
      onMessageSent(response.data.data);
      onOpenChange(false);
    } catch (err) {
      toast({
        title: 'Failed to send template',
        description: err instanceof Error ? err.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const variablePositions = selectedTemplate
    ? extractVariablePositions(selectedTemplate.components)
    : [];

  const urlButtonVars = selectedTemplate
    ? extractUrlButtonVars(selectedTemplate.components)
    : [];

  const canSend =
    selectedTemplate !== null &&
    variablePositions.every((pos) => (variables[String(pos)] ?? '').trim() !== '') &&
    urlButtonVars.every((v) => (variables[v.key] ?? '').trim() !== '');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {selectedTemplate && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 -ml-1"
                onClick={() => setSelectedTemplate(null)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            {selectedTemplate ? selectedTemplate.name : 'Send Template'}
          </DialogTitle>
        </DialogHeader>

        {!selectedTemplate ? (
          /* Template list */
          loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : templates.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No approved templates available.
            </p>
          ) : (
            <ScrollArea className="max-h-80">
              <div className="flex flex-col gap-1 pr-2">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTemplate(t)}
                    className="flex items-start gap-3 w-full text-left px-3 py-2.5 rounded-md hover:bg-accent transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.name}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {getBodyText(t.components) || 'No body text'}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-[10px] flex-shrink-0 mt-0.5">
                      {CATEGORY_LABELS[t.category] ?? t.category}
                    </Badge>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )
        ) : (
          /* Variable input screen */
          <div className="flex flex-col gap-4">
            {getBodyText(selectedTemplate.components) && (
              <p className="text-sm text-muted-foreground bg-muted rounded-md px-3 py-2">
                {getBodyText(selectedTemplate.components)}
              </p>
            )}

            {variablePositions.length === 0 && urlButtonVars.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                This template has no variables. Ready to send.
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {variablePositions.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Message Body
                    </p>
                    {variablePositions.map((pos) => (
                      <div key={pos} className="flex flex-col gap-1.5">
                        <Label htmlFor={`var-${pos}`} className="text-xs">
                          Variable {pos}{' '}
                          <span className="text-muted-foreground">{`{{${pos}}}`}</span>
                        </Label>
                        <Input
                          id={`var-${pos}`}
                          value={variables[String(pos)] ?? ''}
                          onChange={(e) =>
                            setVariables((prev) => ({ ...prev, [String(pos)]: e.target.value }))
                          }
                          placeholder={`Enter value for {{${pos}}}`}
                          className="h-8 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {urlButtonVars.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      URL Button Variables
                    </p>
                    {urlButtonVars.map((v) => (
                      <div key={v.key} className="flex flex-col gap-1.5">
                        <Label htmlFor={`var-${v.key}`} className="text-xs">
                          {v.buttonLabel}{' '}
                          <span className="text-muted-foreground">{`{{${v.varPos}}}`}</span>
                        </Label>
                        <Input
                          id={`var-${v.key}`}
                          value={variables[v.key] ?? ''}
                          onChange={(e) =>
                            setVariables((prev) => ({ ...prev, [v.key]: e.target.value }))
                          }
                          placeholder={`Enter value for ${v.buttonLabel} URL`}
                          className="h-8 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <Button onClick={() => void handleSend()} disabled={!canSend || sending} className="w-full">
              {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {sending ? 'Sending...' : 'Send'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
});
