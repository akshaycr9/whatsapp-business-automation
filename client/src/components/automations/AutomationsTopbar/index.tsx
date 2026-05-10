export function AutomationsTopbar() {
  return (
    <div className="h-14 border-b border-border bg-card flex items-center px-5 gap-4 flex-shrink-0">
      <span className="text-[16px] font-[650] tracking-[-0.01em] text-ink-900">Automations</span>
      <span className="text-[12.5px] text-ink-500 pl-3 ml-1 border-l border-border">
        Shopify → WhatsApp rules
      </span>
      <div className="flex-1" />
      <button className="w-8 h-8 grid place-items-center rounded-md text-ink-700 hover:bg-surface-sunken transition-colors">
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>
      <button className="w-8 h-8 grid place-items-center rounded-md text-ink-700 hover:bg-surface-sunken transition-colors">
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      </button>
    </div>
  );
}
