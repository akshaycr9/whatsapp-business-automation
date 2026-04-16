import { Skeleton } from '@/components/ui/skeleton';

export function MessagesSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-4">
      {[false, true, false, true, false].map((isRight, i) => (
        <div key={i} className={`flex ${isRight ? 'justify-end' : 'justify-start'}`}>
          <Skeleton className={`h-10 rounded-2xl ${isRight ? 'w-48' : 'w-64'}`} />
        </div>
      ))}
    </div>
  );
}
