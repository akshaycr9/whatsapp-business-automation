import React from 'react';
import {
  Check,
  CheckCheck,
  AlertCircle,
  Clock,
  MousePointerClick,
  ExternalLink,
  Phone,
} from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { MediaContainer } from './MediaContainer';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { Message, MessageStatus, Reaction } from '@/types';
import { TemplateButtonType } from '@/types';

interface Props {
  message: Message;
}

function StatusIcon({ status }: { status: MessageStatus }) {
  const iconClass = 'h-2.5 w-2.5';
  switch (status) {
    case 'PENDING':
      return <Clock className={cn(iconClass, 'opacity-50')} />;
    case 'SENT':
      return <Check className={cn(iconClass, 'opacity-60')} />;
    case 'DELIVERED':
      return <CheckCheck className={cn(iconClass, 'opacity-60')} />;
    case 'READ':
      return <CheckCheck className={cn(iconClass, 'text-[#53BDEB]')} />;
    case 'FAILED':
      return <AlertCircle className={cn(iconClass, 'text-[#a9384d]')} />;
    default:
      return null;
  }
}

function MediaContent({ message }: { message: Message }) {
  return (
    <MediaContainer
      mediaId={message.mediaId ?? null}
      type={message.type}
      caption={message.caption ?? undefined}
      mediaMimeType={message.mediaMimeType ?? undefined}
    />
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
    if (message.statusUpdatedAt) {
      rows.push({ label: 'Delivered', time: formatTimestamp(message.statusUpdatedAt) });
    }
  }

  if (readAt) {
    rows.push({ label: 'Read', time: formatTimestamp(readAt) });
  } else if (message.status === 'READ' && message.statusUpdatedAt && !deliveredAt) {
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

interface StoredButton {
  type: string;
  text: string;
  url?: string;
  phone_number?: string;
}

function TemplateButtons({ buttons }: { buttons: StoredButton[] }) {
  return (
    <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-black/10">
      {buttons.map((btn, i) => {
        const isUrl = btn.type === TemplateButtonType.URL;
        const isPhone = btn.type === TemplateButtonType.PHONE_NUMBER;
        return (
          <div
            key={i}
            className="flex items-center justify-center gap-1.5 text-sm font-medium text-primary bg-white rounded-lg py-2 px-3 border border-primary/20"
          >
            {isUrl && <ExternalLink className="h-4 w-4 flex-shrink-0" />}
            {isPhone && <Phone className="h-4 w-4 flex-shrink-0" />}
            {!isUrl && !isPhone && (
              <MousePointerClick className="h-4 w-4 flex-shrink-0 opacity-70" />
            )}
            <span>{btn.text}</span>
          </div>
        );
      })}
    </div>
  );
}

function ReplyContext({ body, templateName }: { body: string; templateName?: string }) {
  return (
    <div className="flex items-stretch gap-1.5 mb-1.5 rounded-lg bg-black/10 px-2 py-1.5 overflow-hidden">
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

function ReactionPills({ reactions, isOutbound }: { reactions: Reaction[]; isOutbound: boolean }) {
  const grouped = reactions.reduce<Record<string, number>>((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] ?? 0) + 1;
    return acc;
  }, {});

  const entries = Object.entries(grouped);
  if (entries.length === 0) return null;

  return (
    <div className={cn('flex gap-1 flex-wrap -mt-1', isOutbound ? 'justify-end' : 'justify-start')}>
      {entries.map(([emoji, count]) => (
        <span
          key={emoji}
          className="flex items-center gap-0.5 bg-white border border-border rounded-full px-1.5 py-0.5 text-sm shadow-sm leading-none select-none"
        >
          {emoji}
          {count > 1 && <span className="text-[10px] text-muted-foreground font-medium">{count}</span>}
        </span>
      ))}
    </div>
  );
}

// ── Main bubble ──────────────────────────────────────────────────────────────

export const MessageBubble = React.memo(function MessageBubble({ message }: Props) {
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
        'flex flex-col gap-1 w-auto max-w-[45%]',
        isOutbound ? 'items-end' : 'items-start',
      )}
    >
      {/* Interactive / button-reply label */}
      {isInteractive && (
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
          Button reply
        </span>
      )}

      {/* Media type label */}
      {isMedia && (
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground capitalize">
          {message.type.charAt(0) + message.type.slice(1).toLowerCase()}
        </span>
      )}

      {/* Bubble */}
      <div
        title={new Date(message.createdAt).toLocaleString()}
        className={cn(
          'relative px-3 py-2 rounded-2xl text-sm leading-relaxed',
          isOutbound
            ? 'bg-[#d9fdd3] text-[#111]'
            : 'bg-white text-[#111] shadow-sm',
        )}
        style={{
          boxShadow: isOutbound
            ? '0 1px 0.5px rgba(0,0,0,0.08)'
            : '0 1px 0.5px rgba(0,0,0,0.08)',
        }}
      >
        {/* Reply-to context for inbound button replies */}
        {isInteractive && !isOutbound && replyToBody && (
          <ReplyContext body={replyToBody} templateName={replyToTemplateName} />
        )}

        {/* Message body */}
        {isMedia ? (
          <MediaContent message={message} />
        ) : (
          <p className="whitespace-pre-wrap break-words">{message.body ?? ''}</p>
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
          <span className="text-[10px] opacity-70 text-[#667781]">
            {formatRelativeTime(message.createdAt)}
          </span>
          {isOutbound && (
            <span className="text-[#667781]">
              <StatusIcon status={message.status} />
            </span>
          )}
        </div>
      </div>

      {/* Reaction pills — sit below the bubble, overlapping slightly */}
      <ReactionPills reactions={message.reactions} isOutbound={isOutbound} />
    </div>
  );

  return (
    <div className={cn('flex', isOutbound ? 'justify-end' : 'justify-start', 'px-4 py-0.5')}>
      {isOutbound ? (
        <Tooltip>
          <TooltipTrigger asChild>{bubble}</TooltipTrigger>
          <TooltipContent side="left" className="bg-popover text-popover-foreground border shadow-md">
            <StatusTooltipContent message={message} />
          </TooltipContent>
        </Tooltip>
      ) : (
        bubble
      )}
    </div>
  );
});
