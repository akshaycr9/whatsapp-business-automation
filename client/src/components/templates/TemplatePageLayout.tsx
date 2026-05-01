import { ReactNode } from "react";
import { PhonePreview } from "./PhonePreview";
import { NewTemplatePageTopbar } from "./NewTemplatePageTopbar";

interface TemplatePageLayoutProps {
  topbarPageName: string;
  topbarSubPageName?: string;
  onBackClick: () => void;
  previewHeader: string | undefined;
  previewBody: string;
  previewFooter: string | undefined;
  previewButtons: Array<{
    type: "URL" | "PHONE_NUMBER" | "QUICK_REPLY" | "COPY_CODE";
    text: string;
  }>;
  detectedVars: string[];
  children: ReactNode;
}

export function TemplatePageLayout({
  topbarPageName,
  topbarSubPageName,
  onBackClick,
  previewHeader,
  previewBody,
  previewFooter,
  previewButtons,
  detectedVars,
  children,
}: TemplatePageLayoutProps) {
  return (
    <div className="flex flex-col h-full">
      <NewTemplatePageTopbar
        pageName={topbarPageName}
        subPageName={topbarSubPageName}
        onBack={onBackClick}
      />

      {/* Content */}
      <div className="flex-1 overflow-hidden px-5 pb-8 pt-5 md:px-7">
        <div
          className="grid h-full gap-5"
          style={{ gridTemplateColumns: "minmax(0, 1fr) 340px" }}
        >
          {/* Left: form */}
          {children}

          {/* Right: live preview */}
          <div className="sticky top-0 self-start pt-1">
            <div className="mb-2.5 text-center text-2xs font-bold uppercase tracking-[0.06em] text-ink-500">
              Live Preview
            </div>
            <PhonePreview
              header={previewHeader}
              body={previewBody}
              footer={previewFooter}
              buttons={previewButtons.length > 0 ? previewButtons : undefined}
            />
            <div className="mt-3 text-center text-3xs text-ink-400">
              {detectedVars.length > 0
                ? "Preview with entered sample values"
                : "Preview with sample data"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
