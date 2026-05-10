export function EditPageSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <div className="h-14 border-b border-border bg-card flex items-center px-5 gap-4 flex-shrink-0 animate-pulse">
        <div className="w-8 h-8 bg-surface-sunken rounded-md" />
        <div className="h-4 w-40 bg-surface-sunken rounded" />
        <div className="flex-1" />
        <div className="h-8 w-20 bg-surface-sunken rounded-md" />
        <div className="h-8 w-28 bg-surface-sunken rounded-md" />
      </div>
      <div className="flex-1 overflow-hidden px-5 md:px-7 pt-5 pb-8">
        <div
          className="grid gap-5 h-full animate-pulse"
          style={{ gridTemplateColumns: 'minmax(0, 1fr) 340px' }}
        >
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-lg h-24" />
            <div className="bg-card border border-border rounded-lg h-24" />
            <div className="bg-card border border-border rounded-lg h-32" />
          </div>
          <div className="bg-card border border-border rounded-lg h-[510px]" />
        </div>
      </div>
    </div>
  );
}
