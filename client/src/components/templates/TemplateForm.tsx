import { Plus, Check, X, ExternalLink, Phone, Copy } from "lucide-react";
import { Toggle } from "./Toggle";
import { FieldGroup } from "./FieldGroup";
import { useTemplateFormState } from "@/hooks/templates/use-template-form-state";
import { useTemplateFormLogic } from "@/hooks/templates/use-template-form-logic";
import { useEditTemplateForm } from "@/hooks/templates/use-edit-template-form";
import { useTemplates } from "@/hooks/templates/use-templates";
import {
  TemplateComponentType,
  TemplateComponentFormat,
  TemplateButtonType,
  TemplateButtonGroupType,
  TemplateCategory,
  type TemplateComponentInput,
  type TemplateButtonInput,
} from "@/types";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import type { TemplateFormData } from "@/lib/template-form.schema";

interface TemplateFormProps {
  mode?: "new" | "edit";
  templateId?: string;
  form: ReturnType<typeof useTemplateFormState>["form"];
  headerEnabled: boolean;
  headerText: string;
  bodyText: string;
  bodySamples: string[];
  footerEnabled: boolean;
  footerText: string;
  buttonsEnabled: boolean;
  buttonGroup: TemplateButtonGroupType;
  buttons: TemplateFormData["buttons"];
  category: TemplateFormData["category"];
  removeButton: (index: number) => void;
}

export function TemplateForm({
  mode = "new",
  templateId,
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
  removeButton,
}: TemplateFormProps) {
  const navigate = useNavigate();
  const { updateTemplate } = useTemplates();

  // Load template data if in edit mode
  const { template } = useEditTemplateForm(
    mode === "edit" ? templateId : undefined,
  );

  const {
    detectedVars,
    quickReplies,
    urlBtn,
    phoneBtn,
    copyBtn,
    urlBtnIndex,
    phoneBtnIndex,
    copyBtnIndex,
    isDynamicUrl,
    insertVariable,
    addButtonOfType,
    handleButtonGroupChange,
    onSubmit: onSubmitNew,
  } = useTemplateFormLogic({
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
  } as Parameters<typeof useTemplateFormLogic>[0]);

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = form;

  // Override submit handler for edit mode
  const onSubmit = async (data: TemplateFormData) => {
    if (mode === "edit" && template) {
      // Edit mode: update existing template
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
        bodyComp.example = data.bodySamples
          .map((s) => s.trim())
          .filter((s) => s);
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

      try {
        await updateTemplate(template.id, components);
        toast({ title: "Template saved" });
        navigate("/templates");
      } catch (err) {
        toast({
          title: "Error",
          description:
            err instanceof Error ? err.message : "Failed to save template",
          variant: "destructive",
        });
      }
    } else {
      // New mode: use original handler
      await onSubmitNew(data);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="overflow-y-auto rounded-lg border border-border bg-card px-6 py-5 flex flex-col"
    >
      {/* Template Name */}
      <FieldGroup label="Template Name">
        <input
          {...form.register("name")}
          className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-sm text-ink-900 outline-none transition-[border-color,box-shadow] focus:border-brand-500 focus:shadow-[0_0_0_3px_rgba(23,163,152,0.1)]"
          placeholder="e.g. order_confirmed"
        />
        {form.formState.errors.name && (
          <p className="mt-1 text-2xs text-accent-rose">
            {form.formState.errors.name.message}
          </p>
        )}
        {!form.formState.errors.name && (
          <p className="mt-1 text-2xs text-ink-500">
            Lowercase letters and underscores only, e.g.{" "}
            <span className="font-mono">order_confirmed</span>
          </p>
        )}
      </FieldGroup>

      {/* Category */}
      <FieldGroup label="Category">
        <div className="flex flex-wrap gap-1.5">
          {Object.values(TemplateCategory).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => form.setValue("category", cat)}
              className={`cursor-pointer rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${
                category === cat
                  ? "border-brand-600 bg-brand-100 text-brand-800"
                  : "border-border bg-white text-ink-500"
              }`}
            >
              {cat.charAt(0) + cat.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </FieldGroup>

      {/* Language */}
      <FieldGroup label="Language">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ["en", "English (en)"],
              ["en_US", "English US (en_US)"],
              ["hi", "Hindi (hi)"],
            ] as const
          ).map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => form.setValue("language", val)}
              className={`cursor-pointer rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${
                form.watch("language") === val
                  ? "border-brand-600 bg-brand-100 text-brand-800"
                  : "border-border bg-white text-ink-500"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </FieldGroup>

      {/* Header */}
      <FieldGroup label="Header" hint="Optional · Text · 60 char max">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-ink-500">Enable header</span>
          <Toggle
            enabled={headerEnabled}
            onToggle={() => form.setValue("headerEnabled", !headerEnabled)}
          />
        </div>
        {headerEnabled && (
          <input
            {...form.register("headerText")}
            className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-ink-900 outline-none transition-[border-color,box-shadow] focus:border-brand-500 focus:shadow-[0_0_0_3px_rgba(23,163,152,0.1)]"
            placeholder="Header text"
            maxLength={60}
          />
        )}
      </FieldGroup>

      {/* Body */}
      <FieldGroup label="Body" hint="Required · 1,024 char max">
        <textarea
          {...form.register("bodyText")}
          className="min-h-[110px] w-full resize-y rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm leading-[1.55] text-ink-900 outline-none transition-[border-color,box-shadow] focus:border-brand-500 focus:shadow-[0_0_0_3px_rgba(23,163,152,0.1)]"
          placeholder="Hello {{1}}, your order {{2}} has been confirmed."
          maxLength={1024}
        />
        {form.formState.errors.bodyText && (
          <p className="mt-1 text-2xs text-accent-rose">
            {form.formState.errors.bodyText.message}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-2xs text-ink-500">
          <span>Variables:</span>
          {detectedVars.map((v, i) => (
            <span key={v} className="inline-flex items-center gap-1">
              <span className="rounded bg-accent-violet-bg px-1.5 py-0.5 font-mono text-xs font-semibold text-accent-violet">
                {v}
              </span>
              <span className="text-2xs text-ink-400">var_{i + 1}</span>
            </span>
          ))}
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-sm border border-border bg-card px-2 py-0.5 text-2xs font-semibold text-ink-900 transition-colors hover:bg-surface-sunken"
            onClick={insertVariable}
          >
            <Plus size={11} strokeWidth={2.5} />
            Variable
          </button>
        </div>
      </FieldGroup>

      {/* Sample values */}
      {detectedVars.length > 0 && (
        <FieldGroup label="Sample Values" hint="Required by Meta for review">
          <div className="space-y-2 rounded-lg border border-brand-200 bg-brand-050 p-3">
            <p className="mb-2 text-xs text-ink-700">
              Provide a realistic example for each variable. These are shown to
              Meta reviewers.
            </p>
            {detectedVars.map((v, i) => (
              <div key={v} className="flex items-center gap-2">
                <span className="shrink-0 rounded bg-accent-violet-bg px-1.5 py-0.5 font-mono text-xs font-semibold text-accent-violet">
                  {v}
                </span>
                <input
                  {...form.register(`bodySamples.${i}`)}
                  className="flex-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-ink-900 outline-none transition-[border-color,box-shadow] focus:border-brand-500 focus:shadow-[0_0_0_3px_rgba(23,163,152,0.1)]"
                  placeholder={`Sample for ${v}`}
                />
              </div>
            ))}
          </div>
        </FieldGroup>
      )}

      {/* Footer */}
      <FieldGroup label="Footer" hint="Optional · 60 char max">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-ink-500">Enable footer</span>
          <Toggle
            enabled={footerEnabled}
            onToggle={() => form.setValue("footerEnabled", !footerEnabled)}
          />
        </div>
        {footerEnabled && (
          <input
            {...form.register("footerText")}
            className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-ink-900 outline-none transition-[border-color,box-shadow] focus:border-brand-500 focus:shadow-[0_0_0_3px_rgba(23,163,152,0.1)]"
            placeholder="e.g. Reply STOP to unsubscribe"
            maxLength={60}
          />
        )}
      </FieldGroup>

      {/* Buttons */}
      <FieldGroup label="Buttons" hint="Optional">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-ink-500">Add interactive buttons</span>
          <Toggle
            enabled={buttonsEnabled}
            onToggle={() => form.setValue("buttonsEnabled", !buttonsEnabled)}
          />
        </div>
        {buttonsEnabled && (
          <div className="space-y-3 rounded-lg border border-border bg-surface-2 p-3">
            <div className="flex overflow-hidden rounded-lg border border-border">
              {[TemplateButtonGroupType.QUICK_REPLY, TemplateButtonGroupType.CTA].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => handleButtonGroupChange(g)}
                  className={`flex-1 py-1.5 text-xs font-semibold transition-colors ${
                    buttonGroup === g
                      ? "bg-brand-700 text-white"
                      : "bg-transparent text-ink-500"
                  }`}
                >
                  {g === "QUICK_REPLY" ? "Quick Replies" : "Call to Action"}
                </button>
              ))}
            </div>

            {buttonGroup === "QUICK_REPLY" && (
              <div className="space-y-2">
                <p className="text-2xs text-ink-500">
                  Up to 3 quick reply buttons. Text max 25 characters.
                </p>
                {quickReplies.map((btn, qIdx) => {
                  const actualIdx = buttons.indexOf(btn);
                  return (
                    <div key={qIdx} className="flex items-center gap-2">
                      <input
                        {...form.register(`buttons.${actualIdx}.text`)}
                        className="flex-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-ink-900 outline-none"
                        placeholder="Quick reply text"
                        maxLength={25}
                      />
                      <span className="shrink-0 text-3xs text-ink-400">
                        {btn.text.length}/25
                      </span>
                      <button
                        type="button"
                        className="grid h-7 w-7 place-items-center rounded-sm transition-colors hover:bg-accent-rose-bg"
                        onClick={() => removeButton(actualIdx)}
                      >
                        <X size={12} className="text-accent-rose" />
                      </button>
                    </div>
                  );
                })}
                {quickReplies.length < 3 && (
                  <button
                    type="button"
                    className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-border py-1.5 text-xs font-semibold text-ink-500 transition-colors hover:bg-surface-sunken"
                    onClick={() => addButtonOfType(TemplateButtonType.QUICK_REPLY)}
                  >
                    <Plus size={12} /> Add Quick Reply
                  </button>
                )}
              </div>
            )}

            {buttonGroup === "CTA" && (
              <div className="space-y-3">
                <p className="text-2xs text-ink-500">
                  Add URL and/or phone number buttons.
                </p>

                {/* URL */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="flex items-center gap-1 text-xs font-semibold text-ink-700">
                      <ExternalLink size={12} /> Visit Website
                    </label>
                    <Toggle
                      enabled={!!urlBtn}
                      onToggle={() => {
                        if (urlBtn) removeButton(urlBtnIndex);
                        else addButtonOfType(TemplateButtonType.URL);
                      }}
                    />
                  </div>
                  {urlBtn && (
                    <div className="space-y-1.5 border-l-2 border-border pl-2">
                      <input
                        {...form.register(`buttons.${urlBtnIndex}.text`)}
                        className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-ink-900 outline-none"
                        placeholder="Button text (max 25 chars)"
                        maxLength={25}
                      />
                      <input
                        {...form.register(`buttons.${urlBtnIndex}.url`)}
                        className="w-full rounded-lg border border-border bg-card px-3 py-1.5 font-mono text-xs text-ink-900 outline-none"
                        placeholder="https://example.com/order/{{1}}"
                      />
                      {isDynamicUrl && (
                        <input
                          {...form.register(`buttons.${urlBtnIndex}.example`)}
                          className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-ink-900 outline-none"
                          placeholder="Example URL (e.g. https://example.com/order/12345)"
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="flex items-center gap-1 text-xs font-semibold text-ink-700">
                      <Phone size={12} /> Call Phone Number
                    </label>
                    <Toggle
                      enabled={!!phoneBtn}
                      onToggle={() => {
                        if (phoneBtn) removeButton(phoneBtnIndex);
                        else addButtonOfType(TemplateButtonType.PHONE_NUMBER);
                      }}
                    />
                  </div>
                  {phoneBtn && (
                    <div className="space-y-1.5 border-l-2 border-border pl-2">
                      <input
                        {...form.register(`buttons.${phoneBtnIndex}.text`)}
                        className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-ink-900 outline-none"
                        placeholder="Button text (max 25 chars)"
                        maxLength={25}
                      />
                      <input
                        {...form.register(
                          `buttons.${phoneBtnIndex}.phone_number`,
                        )}
                        className="w-full rounded-lg border border-border bg-card px-3 py-1.5 font-mono text-xs text-ink-900 outline-none"
                        placeholder="+919876543210"
                      />
                    </div>
                  )}
                </div>

                {/* Copy Code (AUTHENTICATION only) */}
                {category === "AUTHENTICATION" && (
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="flex items-center gap-1 text-xs font-semibold text-ink-700">
                        <Copy size={12} /> Copy Code
                      </label>
                      <Toggle
                        enabled={!!copyBtn}
                        onToggle={() => {
                          if (copyBtn) removeButton(copyBtnIndex);
                          else addButtonOfType(TemplateButtonType.COPY_CODE);
                        }}
                      />
                    </div>
                    {copyBtn && (
                      <div className="space-y-1.5 border-l-2 border-border pl-2">
                        <input
                          {...form.register(`buttons.${copyBtnIndex}.example`)}
                          className="w-full rounded-lg border border-border bg-card px-3 py-1.5 font-mono text-xs text-ink-900 outline-none"
                          placeholder="Example code (e.g. 123456)"
                        />
                        <p className="text-2xs text-ink-500">
                          Used as a sample code during Meta review. Actual code
                          sent dynamically.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </FieldGroup>

      {/* Submit */}
      <div className="mt-4 flex flex-1 flex-col justify-end border-t border-border pt-2">
        <div className="flex items-center justify-end gap-3">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-800 bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-800 disabled:opacity-50 disabled:pointer-events-none"
            disabled={isSubmitting}
          >
            <Check size={13} strokeWidth={2.5} />
            {isSubmitting ? "Submitting…" : "Submit Template"}
          </button>
        </div>
      </div>
    </form>
  );
}
