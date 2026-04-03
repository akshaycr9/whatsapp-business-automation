import { Skeleton } from '@/components/ui/skeleton';

export function TemplateCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-4 w-36" />
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-14" />
        </div>
      </div>
      <Skeleton className="h-3 w-12" />
      <Skeleton className="h-12 w-full" />
      <div className="flex justify-between">
        <Skeleton className="h-3 w-20" />
        <div className="flex gap-1">
          <Skeleton className="h-7 w-7" />
          <Skeleton className="h-7 w-7" />
        </div>
      </div>
    </div>
  );
}
