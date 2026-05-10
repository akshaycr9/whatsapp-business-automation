import type { TemplateSelectorProps } from './TemplateSelector.types';

export function TemplateSelector({ value, templates, onChange }: TemplateSelectorProps) {
  if (templates.length === 0) {
    return (
      <p className="text-sm text-ink-400 italic">
        No approved templates available. Create and approve a template to send messages. You can
        still configure the automation and select a template later.
      </p>
    );
  }
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-10 px-3 bg-surface-2 border border-border rounded-md text-[13px] text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
    >
      <option value="">— choose a template —</option>
      {templates.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name}
        </option>
      ))}
    </select>
  );
}
