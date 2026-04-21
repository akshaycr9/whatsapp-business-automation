import React from 'react';
import { cn, formatRelativeTime, getInitials } from '@/lib/utils';

// Deterministic avatar color from display name
const AVATAR_COLORS = [
  '#9b6c3a',
  '#3a7a9b',
  '#6c6b3a',
  '#7a3a6c',
  '#3a9b7a',
  '#7a5a3a',
  '#5c5c5c',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

interface ConversationListItemProps {
  id: string;
  displayName: string;
  lastMessageText: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  isActive: boolean;
  isAuto?: boolean;
  onClick: () => void;
}

export const ConversationListItem = React.memo(function ConversationListItem({
  displayName,
  lastMessageText,
  lastMessageAt,
  unreadCount,
  isActive,
  isAuto = false,
  onClick,
}: ConversationListItemProps) {
  const initials = getInitials(displayName);
  const avatarColor = getAvatarColor(displayName);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('w-full text-left transition-colors duration-100')}
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        gap: 10,
        padding: '12px',
        borderBottom: '1px solid var(--cf-border)',
        background: isActive ? 'var(--brand-050)' : 'var(--cf-surface)',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        if (!isActive)
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--cf-surface-2)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = isActive
          ? 'var(--brand-050)'
          : 'var(--cf-surface)';
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: avatarColor,
          display: 'grid',
          placeItems: 'center',
          color: '#fff',
          fontWeight: 650,
          fontSize: 13.5,
          flexShrink: 0,
        }}
      >
        {initials}
      </div>

      {/* Content */}
      <div style={{ minWidth: 0 }}>
        {/* Name row */}
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            lineHeight: 1.2,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: 'var(--ink-900)',
            }}
          >
            {displayName}
          </span>
          {isAuto && (
            <span
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: 'var(--accent-violet)',
                background: 'var(--accent-violet-bg)',
                padding: '1px 5px',
                borderRadius: 4,
                flexShrink: 0,
              }}
            >
              AUTO
            </span>
          )}
        </div>
        {/* Preview row */}
        <div
          style={{
            fontSize: 12,
            color: 'var(--ink-500)',
            marginTop: 3,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            maxWidth: 190,
          }}
        >
          {lastMessageText ?? 'No messages yet'}
        </div>
      </div>

      {/* Right column: time + unread */}
      <div
        style={{
          textAlign: 'right',
          fontSize: 11,
          color: 'var(--ink-500)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 4,
        }}
      >
        {lastMessageAt && <div>{formatRelativeTime(lastMessageAt)}</div>}
        {unreadCount > 0 && (
          <div
            style={{
              background: 'var(--brand-600)',
              color: '#fff',
              fontSize: 10.5,
              fontWeight: 700,
              padding: '1px 6px',
              borderRadius: 99,
              minWidth: 18,
              textAlign: 'center',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
      </div>
    </button>
  );
});

export { getAvatarColor };
