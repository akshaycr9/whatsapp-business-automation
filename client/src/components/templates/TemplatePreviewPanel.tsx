import { PhonePreview } from "./PhonePreview";

interface TemplatePreviewPanelProps {
  header: string | undefined;
  body: string;
  footer: string | undefined;
  buttons: Array<{
    type: "URL" | "PHONE_NUMBER" | "QUICK_REPLY" | "COPY_CODE";
    text: string;
  }>;
  detectedVars: string[];
}

export function TemplatePreviewPanel({
  header,
  body,
  footer,
  buttons,
  detectedVars,
}: TemplatePreviewPanelProps) {
  return (
    <div className="sticky top-0 self-start pt-1">
      <div className="mb-2.5 text-center text-2xs font-bold uppercase tracking-[0.06em] text-ink-500">
        Live Preview
      </div>
      <PhonePreview
        header={header}
        body={body}
        footer={footer}
        buttons={buttons.length > 0 ? buttons : undefined}
      />
      <div className="mt-3 text-center text-3xs text-ink-400">
        {detectedVars.length > 0
          ? "Preview with entered sample values"
          : "Preview with sample data"}
      </div>
    </div>
  );
}
