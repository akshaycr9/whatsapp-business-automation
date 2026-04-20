// ── Pure utility functions extracted from TemplatesPage ──────────────────────

type ComponentsArray = Array<{ type?: string; text?: string; buttons?: unknown[]; format?: string }>;

type ButtonShape = { type?: string; text?: string; url?: string; phone_number?: string };

export function getHeaderText(components: unknown): string {
  if (!Array.isArray(components)) return '';
  const comps = components as ComponentsArray;
  const header = comps.find((c) => c.type === 'HEADER');
  if (header?.text) return header.text;
  if (header?.format && header.format !== 'TEXT') return `[${header.format}]`;
  return '';
}

export function getFooterText(components: unknown): string {
  if (!Array.isArray(components)) return '';
  const comps = components as ComponentsArray;
  const footer = comps.find((c) => c.type === 'FOOTER');
  return footer?.text ?? '';
}

export function getCtaText(components: unknown): string {
  if (!Array.isArray(components)) return '';
  const comps = components as ComponentsArray;
  const buttons = comps.find((c) => c.type === 'BUTTONS');
  if (!Array.isArray(buttons?.buttons)) return '';
  const first = (buttons.buttons as ButtonShape[]).find(
    (b) => b.type === 'URL' || b.type === 'PHONE_NUMBER' || b.type === 'COPY_CODE',
  );
  return first?.text ?? '';
}

export function substituteVars(text: string): string {
  const samples: Record<string, string> = {
    '{{1}}': 'Priya',
    '{{2}}': 'Classic Crew Tee (M · Navy)',
    '{{3}}': '2x',
    '{{4}}': '2,498',
    '{{5}}': '21 Apr',
  };
  return text.replace(/\{\{\d+\}\}/g, (m) => samples[m] ?? m);
}

export function extractVariables(text: string): string[] {
  const matches = text.match(/\{\{\d+\}\}/g);
  if (!matches) return [];
  return [...new Set(matches)].sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, ''), 10);
    const numB = parseInt(b.replace(/\D/g, ''), 10);
    return numA - numB;
  });
}

export function getBodyText(components: unknown): string {
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

export interface TemplateButton {
  type: 'URL' | 'PHONE_NUMBER' | 'QUICK_REPLY' | 'COPY_CODE';
  text: string;
}

export function getTemplateButtons(components: unknown): TemplateButton[] {
  if (!Array.isArray(components)) return [];
  const comps = components as ComponentsArray;
  const buttonsComp = comps.find((c) => c.type === 'BUTTONS');
  if (!Array.isArray(buttonsComp?.buttons)) return [];
  return (buttonsComp.buttons as ButtonShape[])
    .filter((b) => b.type && b.text)
    .map((b) => ({ type: b.type as TemplateButton['type'], text: b.text ?? '' }));
}

export function getBodyExamples(components: unknown): string[] {
  if (!Array.isArray(components)) return [];
  const body = (components as Array<Record<string, unknown>>).find((c) => c['type'] === 'BODY');
  if (!body) return [];
  const ex = body['example'];
  if (!ex) return [];
  // Our stored format: string[]
  if (Array.isArray(ex) && ex.length > 0 && typeof ex[0] === 'string') return ex as string[];
  // Meta's returned format: { body_text: string[][] }
  if (typeof ex === 'object' && ex !== null && 'body_text' in (ex as object)) {
    const bt = (ex as { body_text: unknown }).body_text;
    if (Array.isArray(bt) && bt.length > 0 && Array.isArray(bt[0])) {
      return (bt[0] as unknown[]).map(String);
    }
  }
  return [];
}

export function getButtonCount(components: unknown): number {
  if (!Array.isArray(components)) return 0;
  const comps = components as ComponentsArray;
  for (const c of comps) {
    if (c.type === 'BUTTONS' && Array.isArray(c.buttons)) return c.buttons.length;
  }
  return 0;
}
