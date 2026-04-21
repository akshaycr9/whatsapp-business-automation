import React, { useState } from 'react';
import {
  Check,
  CheckCheck,
  AlertCircle,
  Clock,
  FileText,
  Image,
  Video,
  Music,
  File,
  MousePointerClick,
  ExternalLink,
  Phone,
  Play,
} from 'lucide-react';
import Lightbox from 'yet-another-react-lightbox';
import VideoPlugin from 'yet-another-react-lightbox/plugins/video';
import 'yet-another-react-lightbox/styles.css';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { Message, MessageStatus, Reaction } from '@/types';

interface Props {
  message: Message;
}

function StatusIcon({ status, isOutbound }: { status: MessageStatus; isOutbound: boolean }) {
  const color = isOutbound ? '#667781' : '#667781';
  switch (status) {
    case 'PENDING':
      return <Clock style={{ width: 11, height: 11, opacity: 0.5, color }} />;
    case 'SENT':
      return <Check style={{ width: 11, height: 11, opacity: 0.6, color }} />;
    case 'DELIVERED':
      return <CheckCheck style={{ width: 11, height: 11, opacity: 0.6, color }} />;
    case 'READ':
      return <CheckCheck style={{ width: 11, height: 11, color: '#53BDEB' }} />;
    case 'FAILED':
      return <AlertCircle style={{ width: 11, height: 11, color: '#a9384d' }} />;
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
            slides={[{ type: 'video', sources: [{ src, type: mimeType ?? 'video/mp4' }] }]}
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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        marginTop: 8,
        paddingTop: 8,
        borderTop: '1px solid rgba(0,0,0,0.08)',
      }}
    >
      {buttons.map((btn, i) => {
        const isUrl = btn.type === 'URL';
        const isPhone = btn.type === 'PHONE_NUMBER';
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              fontSize: 12,
              fontWeight: 600,
              color: '#0a7cff',
              padding: '3px 0',
            }}
          >
            {isUrl && <ExternalLink style={{ width: 12, height: 12, flexShrink: 0 }} />}
            {isPhone && <Phone style={{ width: 12, height: 12, flexShrink: 0 }} />}
            {!isUrl && !isPhone && (
              <MousePointerClick style={{ width: 12, height: 12, flexShrink: 0, opacity: 0.7 }} />
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
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
        gap: 6,
        marginBottom: 6,
        borderRadius: 8,
        background: 'rgba(0,0,0,0.06)',
        padding: '6px 8px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: 2,
          borderRadius: 99,
          background: 'rgba(0,0,0,0.25)',
          flexShrink: 0,
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        {templateName && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: '#54656f',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {templateName}
          </span>
        )}
        <p
          style={{
            fontSize: 12,
            color: '#3a4641',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            wordBreak: 'break-word',
          }}
        >
          {body}
        </p>
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
    <div
      className={cn('flex gap-1 flex-wrap -mt-1', isOutbound ? 'justify-end' : 'justify-start')}
    >
      {entries.map(([emoji, count]) => (
        <span
          key={emoji}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
            background: '#fff',
            border: '1px solid var(--cf-border)',
            borderRadius: 99,
            padding: '2px 6px',
            fontSize: 13,
            boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          {emoji}
          {count > 1 && (
            <span style={{ fontSize: 10, color: 'var(--ink-500)', fontWeight: 500 }}>{count}</span>
          )}
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

  // WhatsApp-style bubble colors
  const bubbleBg = isOutbound ? '#d9fdd3' : '#ffffff';
  const bubbleColor = '#111';
  const bubbleShadow = '0 1px 0.5px rgba(0,0,0,0.08)';

  const bubble = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        maxWidth: '62%',
        alignItems: isOutbound ? 'flex-end' : 'flex-start',
      }}
    >
      {/* Auto-tag for template messages */}
      {isTemplate && isOutbound && (
        <div
          style={{
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: 'var(--accent-violet)',
            background: 'var(--accent-violet-bg)',
            padding: '1px 5px',
            borderRadius: 4,
            marginBottom: 2,
          }}
        >
          Sent by automation · template
        </div>
      )}

      {/* Interactive / button-reply label */}
      {isInteractive && (
        <span
          style={{
            fontSize: 9.5,
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 99,
            background: 'rgba(0,0,0,0.08)',
            color: '#54656f',
          }}
        >
          Button reply
        </span>
      )}

      {/* Media type label */}
      {isMedia && (
        <span
          style={{
            fontSize: 9.5,
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 99,
            background: 'rgba(0,0,0,0.08)',
            color: '#54656f',
            textTransform: 'capitalize',
          }}
        >
          {message.type.charAt(0) + message.type.slice(1).toLowerCase()}
        </span>
      )}

      {/* Bubble */}
      <div
        title={new Date(message.createdAt).toLocaleString()}
        style={{
          background: bubbleBg,
          color: bubbleColor,
          boxShadow: bubbleShadow,
          padding: '7px 10px 6px',
          borderRadius: 8,
          fontSize: 13,
          lineHeight: 1.45,
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
          position: 'relative',
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
          <span>{message.body ?? ''}</span>
        )}

        {/* Template buttons */}
        {isTemplate && templateButtons.length > 0 && (
          <TemplateButtons buttons={templateButtons} />
        )}

        {/* Timestamp + status row */}
        <span
          style={{
            fontSize: 10,
            color: '#667781',
            float: 'right',
            margin: '6px -3px -2px 8px',
            display: 'inline-flex',
            gap: 3,
            alignItems: 'center',
          }}
        >
          {formatRelativeTime(message.createdAt)}
          {isOutbound && <StatusIcon status={message.status} isOutbound={isOutbound} />}
        </span>
      </div>

      {/* Reaction pills */}
      <ReactionPills reactions={message.reactions} isOutbound={isOutbound} />
    </div>
  );

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isOutbound ? 'flex-end' : 'flex-start',
      }}
    >
      {isOutbound ? (
        <Tooltip>
          <TooltipTrigger asChild>{bubble}</TooltipTrigger>
          <TooltipContent
            side="left"
            className="bg-popover text-popover-foreground border shadow-md"
          >
            <StatusTooltipContent message={message} />
          </TooltipContent>
        </Tooltip>
      ) : (
        bubble
      )}
    </div>
  );
});
