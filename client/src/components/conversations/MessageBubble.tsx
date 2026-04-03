import React, { useState } from 'react';
import { Check, CheckCheck, AlertCircle, Clock, FileText, Image, Video, Music, File, MousePointerClick, ExternalLink, Phone, Play } from 'lucide-react';
import Lightbox from 'yet-another-react-lightbox';
import VideoPlugin from 'yet-another-react-lightbox/plugins/video';
import 'yet-another-react-lightbox/styles.css';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { Message, MessageStatus, Reaction } from '@/types';

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

function MediaContent({ message }: { message: Message }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const src = message.mediaId ? `/api/media/${message.mediaId}` : null;
  const mimeType = message.mediaMimeType ?? undefined;

  if (message.type === 'IMAGE') {
    return (
      <>
        <div className="flex flex-col gap-2">
          {src ? (
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="relative group rounded-lg overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <img
                src={src}
                alt={message.caption ?? 'Image'}
                className="block w-full max-w-[280px] sm:max-w-xs max-h-64 object-cover rounded-lg"
              />
              {/* Expand hint on hover */}
              <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-medium bg-black/50 px-2 py-1 rounded-full">
                  View
                </span>
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-black/10 text-sm">
              <Image className="h-5 w-5" />
              <span>Image unavailable</span>
            </div>
          )}
          {message.caption && <p className="text-sm px-1">{message.caption}</p>}
        </div>
        {src && (
          <Lightbox
            open={lightboxOpen}
            close={() => setLightboxOpen(false)}
            slides={[{ src }]}
          />
        )}
      </>
    );
  }

  if (message.type === 'VIDEO') {
    return (
      <>
        <div className="flex flex-col gap-2">
          {src ? (
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="relative group rounded-lg overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video
                src={src}
                className="block w-full max-w-[280px] sm:max-w-xs max-h-64 object-cover rounded-lg"
              />
              {/* Play icon overlay */}
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex items-center justify-center w-12 h-12 rounded-full bg-black/50 group-hover:bg-black/70 transition-colors">
                  <Play className="h-5 w-5 text-white fill-white ml-0.5" />
                </span>
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-black/10 text-sm">
              <Video className="h-5 w-5" />
              <span>Video unavailable</span>
            </div>
          )}
          {message.caption && <p className="text-sm px-1">{message.caption}</p>}
        </div>
        {src && (
          <Lightbox
            open={lightboxOpen}
            close={() => setLightboxOpen(false)}
            plugins={[VideoPlugin]}
            slides={[{
              type: 'video',
              sources: [{ src, type: mimeType ?? 'video/mp4' }],
            }]}
          />
        )}
      </>
    );
  }

  if (message.type === 'AUDIO') {
    return (
      <div className="flex flex-col gap-2">
        {src ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <audio src={src} controls className="w-full min-w-[200px]" />
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-black/10 text-sm">
            <Music className="h-5 w-5" />
            <span>Audio unavailable</span>
          </div>
        )}
      </div>
    );
  }

  if (message.type === 'DOCUMENT') {
    return (
      <div className="flex flex-col gap-2">
        <a
          href={src ?? '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 rounded-md bg-black/10 hover:bg-black/20 transition-colors text-sm font-medium"
        >
          <FileText className="h-5 w-5 flex-shrink-0" />
          <span>{message.caption ?? 'Document'}</span>
        </a>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-black/10 text-sm">
      <File className="h-5 w-5" />
      <span>File</span>
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

// ── Reaction pills ───────────────────────────────────────────────────────────

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
          className="flex items-center gap-0.5 bg-background border border-border rounded-full px-1.5 py-0.5 text-sm shadow-sm leading-none select-none"
        >
          {emoji}
          {count > 1 && (
            <span className="text-[10px] text-muted-foreground font-medium">{count}</span>
          )}
        </span>
      ))}
    </div>
  );
}

// ── Main bubble ─────────────────────────────────────────────────────────────

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

      {/* Media type label */}
      {isMedia && (
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 capitalize">
          {message.type.charAt(0) + message.type.slice(1).toLowerCase()}
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
          <MediaContent message={message} />
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

      {/* Reaction pills — sit below the bubble, overlapping slightly */}
      <ReactionPills reactions={message.reactions} isOutbound={isOutbound} />
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
});
