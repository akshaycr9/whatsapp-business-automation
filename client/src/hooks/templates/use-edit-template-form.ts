import { useMemo } from "react";
import { useTemplates } from "./use-templates";
import {
  getBodyText,
  getBodyExamples,
  getHeaderText,
  getFooterText,
} from "@/lib/template-utils";
import type { TemplateFormData } from "@/lib/template-form.schema";

interface EditTemplateFormReturn {
  template: ReturnType<typeof useTemplates>["templates"][0] | null;
  initialValues: Partial<TemplateFormData>;
}

export function useEditTemplateForm(
  templateId: string | undefined
): EditTemplateFormReturn {
  const { templates } = useTemplates();

  const template = useMemo(
    () => (templateId ? templates.find((t) => t.id === templateId) ?? null : null),
    [templateId, templates]
  );

  const initialValues = useMemo(() => {
    if (!template) {
      return {};
    }

    const headerText = getHeaderText(template.components);
    const bodyText = getBodyText(template.components);
    const footerText = getFooterText(template.components);
    const bodySamples = getBodyExamples(template.components);

    // Get buttons from components
    const buttonComponent = (
      template.components as Array<Record<string, unknown>>
    )?.find((c) => c["type"] === "BUTTONS");
    const buttons = buttonComponent && Array.isArray(buttonComponent["buttons"])
      ? (buttonComponent["buttons"] as Array<Record<string, unknown>>).map(
          (b) => ({
            type: (b["type"] as
              | "QUICK_REPLY"
              | "URL"
              | "PHONE_NUMBER"
              | "COPY_CODE") || "QUICK_REPLY",
            text: (b["text"] as string) || "",
            url: (b["url"] as string) || "",
            phone_number: (b["phone_number"] as string) || "",
            example: (b["example"] as string) || "",
          })
        )
      : [];

    return {
      name: template.name,
      language: template.language,
      category: template.category,
      headerEnabled: headerText !== "",
      headerText,
      bodyText,
      bodySamples,
      footerEnabled: footerText !== "",
      footerText,
      buttonsEnabled: buttons.length > 0,
      buttonGroup: buttons.length > 0 && buttons[0].type === "QUICK_REPLY"
        ? ("QUICK_REPLY" as const)
        : ("CTA" as const),
      buttons,
    } as Partial<TemplateFormData>;
  }, [template]);

  return { template, initialValues };
}
