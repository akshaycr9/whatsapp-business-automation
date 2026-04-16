import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ActivityIcon } from '@/components/dashboard/ActivityIcon';
import { formatRelativeTime } from '@/lib/utils';
import type { ActivityType } from '@/types/dashboard';

interface ActivityItemProps {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: string;
}

interface ActivityItemSkeletonProps {
  count?: number;
}

export const ActivityItemSkeleton = React.memo(function ActivityItemSkeleton({
  count = 1,
}: ActivityItemSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-3">
          <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-3 w-12 flex-shrink-0" />
        </div>
      ))}
    </>
  );
});

export const ActivityItem = React.memo(function ActivityItem({
  type,
  description,
  timestamp,
}: ActivityItemProps) {
  return (
    <li className="flex items-center gap-3 px-5 py-3">
      <ActivityIcon type={type} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground truncate">{description}</p>
      </div>
      <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
        {formatRelativeTime(timestamp)}
      </span>
    </li>
  );
});
