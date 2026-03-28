import { Check, CheckCheck, AlertCircle, Clock, FileText, Image, Video, Music, File, MousePointerClick, ExternalLink, Phone } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { Message, MessageStatus } from '@/types';

interface Props {
  message: Message;
}

function StatusIcon({ status }: { status: MessageStatus }) {
  switch (status) {
    case 'PENDING':
      // Clock: queued, not yet accepted by Meta servers
      return <Clock className="h-3 w-3 opacity-50" />;
    case 'SENT':
      // Single grey tick: accepted by Meta servers
      return <Check className="h-3 w-3 opacity-60" />;
    case 'DELIVERED':
      // Double grey tick: delivered to recipient's device
      return <CheckCheck className="h-3 w-3 opacity-60" />;
    case 'READ':
      // Double blue tick: recipient opened the message (#53BDEB — WhatsApp blue)
      return <CheckCheck className="h-3 w-3 text-[#53BDEB]" />;
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

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function StatusTooltipContent({ message }: { message: Message }) {
  const meta = message.metadata as Record<string, unknown> | null;
  const deliveredAt = meta?.deliveredAt as string | undefined;
  const readAt = meta?.readAt as string | undefined;

  const rows: { label: string; time: string }[] = [
    { label: 'Sent', time: formatTimestamp(message.createdAt) },
  ];

  if (deliveredAt) {
    rows.push({ label: 'Delivered', time: formatTimestamp(deliveredAt) });
  } else if (message.status === 'DELIVERED' || message.status === 'READ') {
    // statusUpdatedAt is available only if status was updated after creation
    if (message.statusUpdatedAt) {
      rows.push({ label: 'Delivered', time: formatTimestamp(message.statusUpdatedAt) });
    }
  }

  if (readAt) {
    rows.push({ label: 'Read', time: formatTimestamp(readAt) });
  } else if (message.status === 'READ' && message.statusUpdatedAt && !deliveredAt) {
    // If we only have statusUpdatedAt and status is READ, it's the read time
    rows.push({ label: 'Read', time: formatTimestamp(message.statusUpdatedAt) });
  }

  return (
    <div className="flex flex-col gap-1 text-[11px]">
      {rows.map(({ label, time }) => (
        <div key={label} className="flex gap-2">
          <span className="opacity-70 w-16 flex-shrink-0">{label}</span>
          <span>{time}</span>
        </div>
      ))}
    </div>
  );
}

// ── Template buttons ────────────────────────────────────────────────────────

interface StoredButton {
  type: string;
  text: string;
  url?: string;
  phone_number?: string;
}

function TemplateButtons({ buttons }: { buttons: StoredButton[] }) {
  return (
    <div className="flex flex-col gap-1 mt-2 pt-2 border-t border-primary-foreground/20">
      {buttons.map((btn, i) => {
        const isUrl = btn.type === 'URL';
        const isPhone = btn.type === 'PHONE_NUMBER';
        return (
          <div
            key={i}
            className="flex items-center justify-center gap-1.5 text-xs font-medium text-primary-foreground/90 py-0.5"
          >
            {isUrl && <ExternalLink className="h-3 w-3 flex-shrink-0" />}
            {isPhone && <Phone className="h-3 w-3 flex-shrink-0" />}
            {!isUrl && !isPhone && <MousePointerClick className="h-3 w-3 flex-shrink-0 opacity-70" />}
            <span>{btn.text}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Reply context (shown on inbound button-reply bubbles) ───────────────────

function ReplyContext({ body, templateName }: { body: string; templateName?: string }) {
  return (
    <div className="flex items-stretch gap-1.5 mb-1.5 rounded-lg bg-black/10 dark:bg-white/10 px-2 py-1.5 overflow-hidden">
      <div className="w-0.5 rounded-full bg-muted-foreground/50 flex-shrink-0" />
      <div className="flex flex-col gap-0.5 min-w-0">
        {templateName && (
          <span className="text-[10px] font-semibold text-muted-foreground truncate">
            {templateName}
          </span>
        )}
        <p className="text-xs text-muted-foreground line-clamp-2 break-words">{body}</p>
      </div>
    </div>
  );
}

// ── Main bubble ─────────────────────────────────────────────────────────────

export function MessageBubble({ message }: Props) {
  const isOutbound = message.direction === 'OUTBOUND';
  const isTemplate = message.type === 'TEMPLATE';
  const isInteractive = message.type === 'INTERACTIVE';
  const isMedia = ['IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT'].includes(message.type);

  const meta = message.metadata as Record<string, unknown> | null;
  const templateButtons = (meta?.buttons ?? []) as StoredButton[];
  const replyToBody = meta?.replyToBody as string | undefined;
  const replyToTemplateName = meta?.replyToTemplateName as string | undefined;

  const bubble = (
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

      {/* Interactive / button-reply label */}
      {isInteractive && (
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400">
          Button reply
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
        {/* Reply-to context for inbound button replies */}
        {isInteractive && !isOutbound && replyToBody && (
          <ReplyContext body={replyToBody} templateName={replyToTemplateName} />
        )}

        {/* Message body */}
        {isMedia ? (
          <MediaPlaceholder message={message} />
        ) : (
          <p className="whitespace-pre-wrap break-words">
            {message.body ?? ''}
          </p>
        )}

        {/* Template buttons */}
        {isTemplate && templateButtons.length > 0 && (
          <TemplateButtons buttons={templateButtons} />
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
  );

  return (
    <div
      className={cn(
        'flex',
        isOutbound ? 'justify-end' : 'justify-start',
        'px-4 py-0.5',
      )}
    >
      {isOutbound ? (
        <Tooltip>
          <TooltipTrigger asChild>
            {bubble}
          </TooltipTrigger>
          <TooltipContent side="left" className="bg-popover text-popover-foreground border shadow-md">
            <StatusTooltipContent message={message} />
          </TooltipContent>
        </Tooltip>
      ) : (
        bubble
      )}
    </div>
  );
}
