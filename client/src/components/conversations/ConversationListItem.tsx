import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn, formatRelativeTime, getInitials, formatPhoneDisplay } from '@/lib/utils';

interface ConversationListItemProps {
  id: string;
  displayName: string;
  lastMessageText: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  isActive: boolean;
  onClick: () => void;
}

export const ConversationListItem = React.memo(function ConversationListItem({
  displayName,
  lastMessageText,
  lastMessageAt,
  unreadCount,
  isActive,
  onClick,
}: ConversationListItemProps) {
  const initials = getInitials(displayName);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-150',
        'hover:bg-muted/50',
        isActive && 'bg-primary/10 border-l-2 border-primary',
        !isActive && 'border-l-2 border-transparent',
      )}
    >
      {/* Avatar */}
      <Avatar className="h-10 w-10 flex-shrink-0">
        <AvatarFallback className="bg-primary/15 text-primary font-semibold text-sm">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Top row: name + timestamp */}
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span
            className={cn(
              'text-sm font-medium truncate',
              isActive ? 'text-foreground' : 'text-foreground',
            )}
          >
            {displayName}
          </span>
          {lastMessageAt && (
            <span className="text-[11px] text-muted-foreground flex-shrink-0">
              {formatRelativeTime(lastMessageAt)}
            </span>
          )}
        </div>

        {/* Bottom row: last message + unread badge */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground truncate">
            {lastMessageText ?? 'No messages yet'}
          </span>
          {unreadCount > 0 && (
            <span className="flex-shrink-0 inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
});

// Keep formatPhoneDisplay available for callers who need to map Conversation -> props
export { formatPhoneDisplay };
