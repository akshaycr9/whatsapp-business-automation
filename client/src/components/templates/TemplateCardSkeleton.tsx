import { Skeleton } from '@/components/ui/skeleton';

export function TemplateTableSkeleton() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]" style={{ minWidth: 780 }}>
        <thead>
          <tr>
            {['Template Name', 'Category', 'Language', 'Status', 'Sync', 'Created', 'Updated', 'Actions'].map(
              (col) => (
                <th
                  key={col}
                  className="bg-card border-b border-border px-3.5 py-2.5 text-left"
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#8a948f',
                  }}
                >
                  {col}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 8 }).map((_, i) => (
            <tr key={i} className="border-b border-border">
              <td className="px-3.5 py-3">
                <Skeleton className="h-4 w-40 mb-1" />
                <Skeleton className="h-3 w-56" />
              </td>
              <td className="px-3.5 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
              <td className="px-3.5 py-3"><Skeleton className="h-4 w-8" /></td>
              <td className="px-3.5 py-3"><Skeleton className="h-5 w-20 rounded-full" /></td>
              <td className="px-3.5 py-3"><Skeleton className="h-7 w-16 rounded-[8px]" /></td>
              <td className="px-3.5 py-3"><Skeleton className="h-4 w-14" /></td>
              <td className="px-3.5 py-3"><Skeleton className="h-4 w-14" /></td>
              <td className="px-3.5 py-3">
                <div className="flex justify-end gap-1">
                  <Skeleton className="h-[30px] w-[30px] rounded-[8px]" />
                  <Skeleton className="h-[30px] w-[30px] rounded-[8px]" />
                  <Skeleton className="h-[30px] w-[30px] rounded-[8px]" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** @deprecated Use TemplateTableSkeleton instead */
export function TemplateCardSkeleton() {
  return <TemplateTableSkeleton />;
}
