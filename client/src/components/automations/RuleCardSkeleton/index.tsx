export function RuleCardSkeleton() {
  return (
    <div
      className="bg-card border border-border rounded-lg shadow-sm animate-pulse grid gap-4 items-center"
      style={{ padding: '16px 18px', gridTemplateColumns: 'auto 1fr auto' }}
    >
      <div className="w-9 h-5 bg-surface-sunken rounded-full flex-shrink-0" />
      <div className="space-y-2.5">
        <div className="h-4 bg-surface-sunken rounded w-1/3" />
        <div className="h-3 bg-surface-sunken rounded w-2/3" />
        <div className="flex gap-2 mt-1">
          <div className="h-7 bg-surface-sunken rounded-[9px] w-28" />
          <div className="h-7 bg-surface-sunken rounded-[9px] w-20" />
          <div className="h-7 bg-surface-sunken rounded-[9px] w-36" />
        </div>
      </div>
      <div className="w-16 h-8 bg-surface-sunken rounded-md" />
    </div>
  );
}
