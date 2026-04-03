// ── Pure utility functions extracted from TemplatesPage ──────────────────────

type ComponentsArray = Array<{ type?: string; text?: string; buttons?: unknown[] }>;

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

export function getButtonCount(components: unknown): number {
  if (!Array.isArray(components)) return 0;
  const comps = components as ComponentsArray;
  for (const c of comps) {
    if (c.type === 'BUTTONS' && Array.isArray(c.buttons)) return c.buttons.length;
  }
  return 0;
}
