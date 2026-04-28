import { Skeleton } from '@/components/ui/skeleton';
import type { MessageType } from '@/types';

interface MediaSkeletonProps {
  type: MessageType;
}

export function MediaSkeleton({ type }: MediaSkeletonProps) {
  // Fixed dimensions to match actual media and prevent layout shift
  if (type === 'IMAGE') {
    return <Skeleton style={{ width: '280px', height: '210px' }} className="rounded-lg" />;
  }

  if (type === 'VIDEO') {
    return <Skeleton style={{ width: '280px', height: '157px' }} className="rounded-lg" />;
  }

  if (type === 'AUDIO') {
    return <Skeleton style={{ width: '100%', maxWidth: '320px', height: '40px' }} className="rounded-lg" />;
  }

  if (type === 'DOCUMENT') {
    return <Skeleton style={{ width: '100%', maxWidth: '320px', height: '40px' }} className="rounded-lg" />;
  }

  return null;
}
