import {
  TemplateStatus,
  TemplateComponentType,
  TemplateComponentFormat,
  TemplateButtonType,
} from '@/types';
import type { Template, TemplateComponentInput, TemplateButtonInput } from '@/types';
import type { TemplateFormData } from '@/lib/template-form.schema';

export const filterTemplatesByCategory = (
  templates: Template[],
  categoryFilter: string,
): Template[] =>
  categoryFilter === 'all'
    ? templates
    : templates.filter((t) => t.category === categoryFilter);

export const buildSyncToastDescription = (
  status: TemplateStatus,
  rejectedReason: string | null,
): string =>
  status === TemplateStatus.REJECTED && rejectedReason
    ? `Rejected: ${rejectedReason}`
    : `Status: ${status}`;

export const buildSyncAllToastTitle = (synced: number): string =>
  `Synced ${synced} template${synced !== 1 ? 's' : ''}`;

export const buildTemplateComponents = (data: TemplateFormData): TemplateComponentInput[] => {
  const components: TemplateComponentInput[] = [];

  if (data.headerEnabled && data.headerText.trim()) {
    components.push({
      type: TemplateComponentType.HEADER,
      format: TemplateComponentFormat.TEXT,
      text: data.headerText.trim(),
    });
  }

  const bodyComp: TemplateComponentInput = {
    type: TemplateComponentType.BODY,
    text: data.bodyText.trim(),
  };
  if (data.bodySamples.length > 0) {
    bodyComp.example = data.bodySamples.map((s) => s.trim()).filter((s) => s);
  }
  components.push(bodyComp);

  if (data.footerEnabled && data.footerText.trim()) {
    components.push({ type: TemplateComponentType.FOOTER, text: data.footerText.trim() });
  }

  if (data.buttonsEnabled && data.buttons.length > 0) {
    const btnInputs: TemplateButtonInput[] = data.buttons.map((btn) => {
      const base: TemplateButtonInput = {
        type: btn.type as TemplateButtonType,
        text: btn.text.trim(),
      };
      if (btn.type === TemplateButtonType.URL) {
        base.url = btn.url.trim();
        if (btn.example.trim()) base.example = btn.example.trim();
      }
      if (btn.type === TemplateButtonType.PHONE_NUMBER)
        base.phone_number = btn.phone_number.trim();
      if (btn.type === TemplateButtonType.COPY_CODE) base.example = btn.example.trim();
      return base;
    });
    components.push({ type: TemplateComponentType.BUTTONS, buttons: btnInputs });
  }

  return components;
};
