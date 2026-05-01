import { ChevronLeft } from "lucide-react";

interface NewTemplatePageTopbarProps {
  pageName: string;
  subPageName?: string;
  onBack: () => void;
}

export function NewTemplatePageTopbar({
  pageName,
  subPageName,
  onBack,
}: NewTemplatePageTopbarProps) {
  return (
    <div className="flex h-14 flex-shrink-0 items-center gap-3 border-b border-border bg-card px-5">
      <button
        className="inline-flex items-center gap-1 bg-transparent p-0 text-sm font-semibold text-brand-700"
        onClick={onBack}
      >
        <ChevronLeft size={16} />
        {pageName}
      </button>
      <span className="text-base text-ink-300">/</span>
      <span className="text-base font-[650] tracking-tight text-ink-900">
        {subPageName}
      </span>
    </div>
  );
}
