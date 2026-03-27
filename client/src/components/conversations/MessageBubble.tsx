import { Check, CheckCheck, AlertCircle, FileText, Image, Video, Music, File } from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { Message, MessageStatus } from '@/types';

interface Props {
  message: Message;
}

function StatusIcon({ status }: { status: MessageStatus }) {
  switch (status) {
    case 'PENDING':
    case 'SENT':
      return <Check className="h-3 w-3 text-current opacity-60" />;
    case 'DELIVERED':
      return <CheckCheck className="h-3 w-3 text-current opacity-60" />;
    case 'READ':
      return <CheckCheck className="h-3 w-3 text-primary" />;
    case 'FAILED':
      return <AlertCircle className="h-3 w-3 text-destructive" />;
    default:
      return null;
  }
}

function MediaPlaceholder({ message }: { message: Message }) {
  const typeConfig: Record<
    string,
    { icon: React.ReactNode; label: string }
  > = {
    IMAGE: { icon: <Image className="h-6 w-6" />, label: 'Image' },
    VIDEO: { icon: <Video className="h-6 w-6" />, label: 'Video' },
    AUDIO: { icon: <Music className="h-6 w-6" />, label: 'Audio' },
    DOCUMENT: { icon: <FileText className="h-6 w-6" />, label: 'Document' },
  };

  const config = typeConfig[message.type] ?? { icon: <File className="h-6 w-6" />, label: 'File' };

  return (
    <div className="flex flex-col gap-2">
      <a
        href={message.mediaId ? `/api/media/${message.mediaId}` : '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-3 py-2 rounded-md bg-black/10 hover:bg-black/20 transition-colors"
      >
        {config.icon}
        <span className="text-sm font-medium">{config.label}</span>
      </a>
      {message.caption && (
        <p className="text-sm px-1">{message.caption}</p>
      )}
    </div>
  );
}

export function MessageBubble({ message }: Props) {
  const isOutbound = message.direction === 'OUTBOUND';
  const isTemplate = message.type === 'TEMPLATE';
  const isMedia = ['IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT'].includes(message.type);

  return (
    <div
      className={cn(
        'flex',
        isOutbound ? 'justify-end' : 'justify-start',
        'px-4 py-0.5',
      )}
    >
      <div
        className={cn(
          'flex flex-col gap-1 max-w-[75%] sm:max-w-sm md:max-w-md',
          isOutbound ? 'items-end' : 'items-start',
        )}
      >
        {/* Template label */}
        {isTemplate && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            {String(message.metadata?.templateName ?? 'Template')}
          </span>
        )}

        {/* Bubble */}
        <div
          title={new Date(message.createdAt).toLocaleString()}
          className={cn(
            'relative px-3 py-2 rounded-2xl text-sm leading-relaxed',
            isOutbound
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : 'bg-muted text-foreground rounded-bl-sm',
            isTemplate && isOutbound && 'rounded-tr-sm',
          )}
        >
          {/* Message body */}
          {isMedia ? (
            <MediaPlaceholder message={message} />
          ) : (
            <p className="whitespace-pre-wrap break-words">
              {message.body ?? ''}
            </p>
          )}

          {/* Timestamp + status row */}
          <div
            className={cn(
              'flex items-center gap-1 mt-1',
              isOutbound ? 'justify-end' : 'justify-end',
            )}
          >
            <span
              className={cn(
                'text-[10px] opacity-70',
                isOutbound ? 'text-primary-foreground' : 'text-muted-foreground',
              )}
            >
              {formatRelativeTime(message.createdAt)}
            </span>
            {isOutbound && (
              <span className={cn(isOutbound ? 'text-primary-foreground' : '')}>
                <StatusIcon status={message.status} />
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
