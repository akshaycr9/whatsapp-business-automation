import { ReactNode } from "react";
import { NewTemplatePageTopbar } from "./NewTemplatePageTopbar";
import { TemplatePreviewPanel } from "./TemplatePreviewPanel";

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
          <TemplatePreviewPanel
            header={previewHeader}
            body={previewBody}
            footer={previewFooter}
            buttons={previewButtons}
            detectedVars={detectedVars}
          />
        </div>
      </div>
    </div>
  );
}
