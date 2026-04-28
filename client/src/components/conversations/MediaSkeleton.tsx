import { Skeleton } from '@/components/ui/skeleton';
import type { MessageType } from '@/types';

interface MediaSkeletonProps {
  type: MessageType;
}

export function MediaSkeleton({ type }: MediaSkeletonProps) {
  if (type === 'IMAGE') {
    return <Skeleton className="w-full max-w-[280px] sm:max-w-xs aspect-[4/3] rounded-lg" />;
  }

  if (type === 'VIDEO') {
    return <Skeleton className="w-full max-w-[280px] sm:max-w-xs aspect-video rounded-lg" />;
  }

  if (type === 'AUDIO') {
    return <Skeleton className="w-full min-w-[200px] max-w-sm h-10 rounded-lg" />;
  }

  if (type === 'DOCUMENT') {
    return <Skeleton className="w-full max-w-xs h-10 rounded-lg" />;
  }

  return null;
}
