import { useRef, useMemo, useCallback, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import {
  useTemplates,
  type CreateTemplateInput,
  type TemplateComponentInput,
  type TemplateButtonInput,
} from "@/hooks/templates/use-templates";
import { toast } from "@/hooks/use-toast";
import {
  extractVariables,
  substituteWithSamples,
  makeButton,
  type DialogButton,
} from "@/lib/template-utils";
import type { TemplateFormData } from "@/lib/template-form.schema";

interface UseTemplateFormLogicParams {
  form: UseFormReturn<TemplateFormData>;
  headerEnabled: boolean;
  headerText: string;
  bodyText: string;
  bodySamples: string[];
  footerEnabled: boolean;
  footerText: string;
  buttonsEnabled: boolean;
  buttonGroup: "QUICK_REPLY" | "CTA";
  buttons: TemplateFormData["buttons"];
  category: TemplateFormData["category"];
}

interface UseTemplateFormLogicReturn {
  // Computed values
  detectedVars: string[];
  quickReplies: TemplateFormData["buttons"];
  urlBtn: TemplateFormData["buttons"][0] | undefined;
  phoneBtn: TemplateFormData["buttons"][0] | undefined;
  copyBtn: TemplateFormData["buttons"][0] | undefined;
  urlBtnIndex: number;
  phoneBtnIndex: number;
  copyBtnIndex: number;
  isDynamicUrl: boolean;

  // Preview data
  previewHeader: string | undefined;
  previewBody: string;
  previewButtons: Array<{
    type: "URL" | "PHONE_NUMBER" | "QUICK_REPLY" | "COPY_CODE";
    text: string;
  }>;

  // Handlers
  bodyRef: React.RefObject<HTMLTextAreaElement>;
  insertVariable: () => void;
  addButtonOfType: (
    type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER" | "COPY_CODE",
  ) => void;
  handleButtonGroupChange: (group: "QUICK_REPLY" | "CTA") => void;
  onSubmit: (data: TemplateFormData) => Promise<void>;
}

export function useTemplateFormLogic(
  params: UseTemplateFormLogicParams,
): UseTemplateFormLogicReturn {
  const navigate = useNavigate();
  const { createTemplate } = useTemplates();
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const {
    form,
    headerEnabled,
    headerText,
    bodyText,
    bodySamples,
    footerEnabled,
    footerText,
    buttonsEnabled,
    buttonGroup,
    buttons,
    category,
  } = params;

  // Note: bodyRef is kept for backwards compatibility but is no longer actively used
  // insertVariable now appends to the end of the body text for simplicity

  // Detect variables from body text
  const detectedVars = useMemo(() => extractVariables(bodyText), [bodyText]);

  // Sync samples array with detected variables
  useEffect(() => {
    const currentSamples = form.getValues("bodySamples");
    if (detectedVars.length > currentSamples.length) {
      const newSamples = [...currentSamples];
      while (newSamples.length < detectedVars.length) {
        newSamples.push("");
      }
      form.setValue("bodySamples", newSamples);
    } else if (detectedVars.length < currentSamples.length) {
      form.setValue(
        "bodySamples",
        currentSamples.slice(0, detectedVars.length),
      );
    }
  }, [detectedVars, form]);

  // Insert variable at the end of body text
  const insertVariable = useCallback(() => {
    const nextNum = detectedVars.length + 1;
    const variable = `{{${nextNum}}}`;
    // Append variable to the end of the body text
    const currentText = form.getValues("bodyText") || "";
    const separator = currentText && !currentText.endsWith(" ") ? " " : "";
    form.setValue("bodyText", currentText + separator + variable);
  }, [detectedVars.length, form]);

  // Filter buttons by type
  const quickReplies = useMemo(
    () => buttons.filter((b) => b.type === "QUICK_REPLY"),
    [buttons],
  );
  const urlBtn = useMemo(
    () => buttons.find((b) => b.type === "URL"),
    [buttons],
  );
  const phoneBtn = useMemo(
    () => buttons.find((b) => b.type === "PHONE_NUMBER"),
    [buttons],
  );
  const copyBtn = useMemo(
    () => buttons.find((b) => b.type === "COPY_CODE"),
    [buttons],
  );
  const urlBtnIndex = useMemo(
    () => buttons.findIndex((b) => b.type === "URL"),
    [buttons],
  );
  const phoneBtnIndex = useMemo(
    () => buttons.findIndex((b) => b.type === "PHONE_NUMBER"),
    [buttons],
  );
  const copyBtnIndex = useMemo(
    () => buttons.findIndex((b) => b.type === "COPY_CODE"),
    [buttons],
  );
  const isDynamicUrl = useMemo(
    () => (urlBtn ? /\{\{1\}\}/.test(urlBtn.url) : false),
    [urlBtn],
  );

  // Preview data
  const previewHeader = useMemo(
    () =>
      headerEnabled
        ? substituteWithSamples(headerText, bodySamples)
        : undefined,
    [headerEnabled, headerText, bodySamples],
  );
  const previewBody = useMemo(
    () =>
      substituteWithSamples(bodyText, bodySamples) ||
      "Your template body appears here.",
    [bodyText, bodySamples],
  );
  const previewButtons = useMemo(
    () =>
      buttonsEnabled
        ? buttons
            .filter((b) => b.text.trim())
            .map((b) => ({
              type: b.type as
                | "URL"
                | "PHONE_NUMBER"
                | "QUICK_REPLY"
                | "COPY_CODE",
              text: b.text,
            }))
        : [],
    [buttonsEnabled, buttons],
  );

  // Add button of specific type
  const addButtonOfType = useCallback(
    (type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER" | "COPY_CODE") => {
      form.setValue("buttons", [...buttons, makeButton(type)]);
    },
    [buttons, form],
  );

  // Handle button group change
  const handleButtonGroupChange = useCallback(
    (group: "QUICK_REPLY" | "CTA") => {
      form.setValue("buttonGroup", group);
      // Clear buttons when switching groups
      if (group === "QUICK_REPLY") {
        const newButtons = buttons.filter((b) => b.type === "QUICK_REPLY");
        form.setValue("buttons", newButtons);
      } else {
        const newButtons = buttons.filter((b) => b.type !== "QUICK_REPLY");
        form.setValue("buttons", newButtons);
      }
    },
    [buttons, form],
  );

  // Submit handler
  const onSubmit = useCallback(
    async (data: TemplateFormData) => {
      const components: TemplateComponentInput[] = [];

      if (data.headerEnabled && data.headerText.trim()) {
        components.push({
          type: "HEADER",
          format: "TEXT",
          text: data.headerText.trim(),
        });
      }

      const bodyComp: TemplateComponentInput = {
        type: "BODY",
        text: data.bodyText.trim(),
      };
      if (data.bodySamples.length > 0) {
        bodyComp.example = data.bodySamples
          .map((s) => s.trim())
          .filter((s) => s);
      }
      components.push(bodyComp);

      if (data.footerEnabled && data.footerText.trim()) {
        components.push({ type: "FOOTER", text: data.footerText.trim() });
      }

      if (data.buttonsEnabled && data.buttons.length > 0) {
        const btnInputs: TemplateButtonInput[] = data.buttons.map((btn) => {
          const base: TemplateButtonInput = {
            type: btn.type,
            text: btn.text.trim(),
          };
          if (btn.type === "URL") {
            base.url = btn.url.trim();
            if (btn.example.trim()) base.example = btn.example.trim();
          }
          if (btn.type === "PHONE_NUMBER")
            base.phone_number = btn.phone_number.trim();
          if (btn.type === "COPY_CODE") base.example = btn.example.trim();
          return base;
        });
        components.push({ type: "BUTTONS", buttons: btnInputs });
      }

      const input: CreateTemplateInput = {
        name: data.name.trim(),
        language: data.language,
        category: data.category,
        components,
      };

      try {
        await createTemplate(input);
        toast({
          title: "Template submitted",
          description: "Awaiting Meta approval.",
        });
        navigate("/templates");
      } catch (err) {
        toast({
          title: "Error",
          description:
            err instanceof Error ? err.message : "Failed to create template",
          variant: "destructive",
        });
      }
    },
    [createTemplate, navigate],
  );

  return {
    detectedVars,
    quickReplies,
    urlBtn,
    phoneBtn,
    copyBtn,
    urlBtnIndex,
    phoneBtnIndex,
    copyBtnIndex,
    isDynamicUrl,
    previewHeader,
    previewBody,
    previewButtons,
    bodyRef,
    insertVariable,
    addButtonOfType,
    handleButtonGroupChange,
    onSubmit,
  };
}
