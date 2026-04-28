import React, { useEffect, useRef, useCallback } from 'react';
import { MessageSquare, ArrowLeft, Loader2 } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { DateSeparator } from './DateSeparator';
import { MessagesSkeleton } from './MessagesSkeleton';
import { useMessages } from '@/hooks/use-messages';
import { api } from '@/lib/api';
import { formatPhoneDisplay, getInitials } from '@/lib/utils';
import { getAvatarColor } from './ConversationListItem';
import type { Message, Conversation } from '@/types';

const CHAT_BG_PATTERN = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><g fill='%23e0d8cb' opacity='0.5'><circle cx='20' cy='20' r='1.5'/><circle cx='55' cy='15' r='1'/><circle cx='80' cy='30' r='1.3'/><circle cx='30' cy='50' r='1.1'/><circle cx='65' cy='55' r='1.5'/><circle cx='90' cy='70' r='1'/><circle cx='15' cy='80' r='1.3'/><circle cx='50' cy='85' r='1.1'/></g></svg>")`;

interface ChatPanelProps {
  conversationId: string;
  conversations: Conversation[];
  onBack: () => void;
  onMarkRead: (id: string) => void;
}

export const ChatPanel = React.memo(function ChatPanel({
  conversationId,
  conversations,
  onBack,
  onMarkRead,
}: ChatPanelProps) {
  const {
    messages,
    hasMore,
    loadingInitial,
    loadingMore,
    error: messagesError,
    isWithin24HourWindow,
    loadMore,
    refetch: refetchMessages,
  } = useMessages(conversationId);

  const conversation = conversations.find((c) => c.id === conversationId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const prevMessageCountRef = useRef(0);
  const hasScrolledInitiallyRef = useRef(false);

  // Scroll to bottom on initial load (after skeleton disappears and messages render)
  // With fixed media dimensions, no layout shift will occur
  useEffect(() => {
    if (!loadingInitial && !hasScrolledInitiallyRef.current && messages.length > 0) {
      hasScrolledInitiallyRef.current = true;
      const container = messagesContainerRef.current;
      if (container) {
        // Use requestAnimationFrame to ensure DOM has rendered
        requestAnimationFrame(() => {
          container.scrollTop = container.scrollHeight;
        });
      }
    }
  }, [loadingInitial]);

  // Auto-scroll to bottom when new messages arrive (only if user is near bottom)
  useEffect(() => {
    const count = messages.length;
    const prevCount = prevMessageCountRef.current;
    prevMessageCountRef.current = count;
    if (count > prevCount && isNearBottomRef.current) {
      const container = messagesContainerRef.current;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [messages]);

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    isNearBottomRef.current = distanceFromBottom < 100;
    if (container.scrollTop < 50 && hasMore && !loadingMore) loadMore();
  }, [hasMore, loadingMore, loadMore]);

  // Mark conversation as read when opened and reset scroll tracking
  useEffect(() => {
    if (!conversationId) return;
    hasScrolledInitiallyRef.current = false;
    onMarkRead(conversationId);
    void api.patch(`/conversations/${conversationId}/read`).catch(() => {});
  }, [conversationId, onMarkRead]);

  const handleMessageSent = useCallback((_message: Message) => {
    isNearBottomRef.current = true;
    const container = messagesContainerRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, []);

  // Group messages by day
  const messagesWithDates: Array<
    { type: 'date'; date: string } | { type: 'message'; message: Message }
  > = [];
  let lastDateString = '';
  for (const msg of messages) {
    const dateString = new Date(msg.createdAt).toDateString();
    if (dateString !== lastDateString) {
      messagesWithDates.push({ type: 'date', date: msg.createdAt });
      lastDateString = dateString;
    }
    messagesWithDates.push({ type: 'message', message: msg });
  }

  const customer = conversation?.customer;
  const displayName = customer
    ? (customer.name ?? formatPhoneDisplay(customer.phone))
    : 'Loading...';
  const initials = customer ? getInitials(customer.name ?? customer.phone) : '?';
  const avatarColor = getAvatarColor(displayName);

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div
        style={{
          background: 'var(--cf-surface)',
          borderBottom: '1px solid var(--cf-border)',
          padding: '10px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexShrink: 0,
        }}
      >
        {/* Mobile back button */}
        <button
          type="button"
          className="md:hidden"
          onClick={onBack}
          style={{
            width: 32,
            height: 32,
            display: 'grid',
            placeItems: 'center',
            borderRadius: 8,
            color: 'var(--ink-700)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <ArrowLeft style={{ width: 17, height: 17, strokeWidth: 1.75 }} />
        </button>

        {/* Avatar */}
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: avatarColor,
            display: 'grid',
            placeItems: 'center',
            color: '#fff',
            fontWeight: 650,
            fontSize: 12.5,
            flexShrink: 0,
          }}
        >
          {initials}
        </div>

        {/* Name + phone */}
        <div style={{ minWidth: 0, flexShrink: 1 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--ink-900)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {displayName}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-500)', marginTop: 2 }}>
            {customer ? formatPhoneDisplay(customer.phone) : ''}
          </div>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />
      </div>

      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
        style={{
          background: `#efeae2 ${CHAT_BG_PATTERN}`,
          padding: '0',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Inner scroll container */}
        <div
          style={{
            flex: 1,
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {/* Load more spinner */}
          {loadingMore && (
            <div className="flex justify-center py-3">
              <Loader2
                style={{ width: 16, height: 16, color: '#54656f' }}
                className="animate-spin"
              />
            </div>
          )}

          {/* Load more trigger */}
          {hasMore && !loadingMore && messages.length > 0 && (
            <div className="flex justify-center py-2">
              <button
                type="button"
                onClick={loadMore}
                style={{
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: '#54656f',
                  background: 'rgba(255,255,255,0.7)',
                  padding: '3px 10px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Load older messages
              </button>
            </div>
          )}

          {loadingInitial && <MessagesSkeleton />}

          {!loadingInitial && messagesError && (
            <div className="p-4">
              <div
                style={{
                  background: 'rgba(255,255,255,0.85)',
                  border: '1px solid var(--cf-border)',
                  borderRadius: 10,
                  padding: '12px 16px',
                  fontSize: 13,
                  color: 'var(--accent-rose)',
                }}
              >
                {messagesError}
                <button
                  type="button"
                  onClick={refetchMessages}
                  style={{ marginLeft: 8, textDecoration: 'underline', cursor: 'pointer' }}
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {!loadingInitial && !messagesError && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.7)',
                  display: 'grid',
                  placeItems: 'center',
                  marginBottom: 12,
                }}
              >
                <MessageSquare style={{ width: 24, height: 24, color: '#54656f' }} />
              </div>
              <p style={{ fontSize: 13, color: '#54656f' }}>No messages yet</p>
            </div>
          )}

          {!loadingInitial &&
            messagesWithDates.map((item, idx) => {
              if (item.type === 'date') {
                return <DateSeparator key={`date-${idx}`} date={item.date} />;
              }
              return <MessageBubble key={item.message.id} message={item.message} />;
            })}

          <div ref={messagesEndRef} style={{ height: 4 }} />
        </div>
      </div>

      {/* Chat input */}
      <ChatInput
        conversationId={conversationId}
        isWithin24HourWindow={isWithin24HourWindow}
        onMessageSent={handleMessageSent}
      />
    </div>
  );
});
