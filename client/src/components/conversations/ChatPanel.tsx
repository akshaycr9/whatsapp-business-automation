import React, { useEffect, useRef, useCallback } from 'react';
import { MessageSquare, RefreshCw, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { DateSeparator } from './DateSeparator';
import { MessagesSkeleton } from './MessagesSkeleton';
import { useMessages } from '@/hooks/use-messages';
import { api } from '@/lib/api';
import { formatPhoneDisplay, getInitials } from '@/lib/utils';
import type { Message, Conversation } from '@/types';

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

  // Auto-scroll to bottom when new messages arrive (only if near bottom)
  useEffect(() => {
    const count = messages.length;
    const prevCount = prevMessageCountRef.current;
    prevMessageCountRef.current = count;

    // Don't scroll if we loaded older messages (count increased but it's loadMore)
    if (count > prevCount && isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (!loadingInitial && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [loadingInitial]);

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    isNearBottomRef.current = distanceFromBottom < 100;

    // Infinite scroll: load more when scrolled to top
    if (container.scrollTop < 50 && hasMore && !loadingMore) {
      loadMore();
    }
  }, [hasMore, loadingMore, loadMore]);

  // Mark conversation as read when it becomes active
  useEffect(() => {
    if (!conversationId) return;
    // Optimistically clear the unread badge immediately
    onMarkRead(conversationId);
    void api.patch(`/conversations/${conversationId}/read`).catch(() => {
      // Ignore errors for read marking
    });
  }, [conversationId, onMarkRead]);

  const handleMessageSent = useCallback(
    (_message: Message) => {
      // The server emits a new_message socket event after persisting the message,
      // which dispatches messageReceived and adds it to Redux without clearing state.
      // Calling refetchMessages() here resets items to [] (fetchMessages.pending),
      // creating a race window where status-update socket events are silently dropped.
      isNearBottomRef.current = true;
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    },
    [],
  );

  // Group messages by day for date separators
  const messagesWithDates: Array<{ type: 'date'; date: string } | { type: 'message'; message: Message }> = [];
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

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center gap-3 border-b bg-background px-4 py-3 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-8 w-8"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <Avatar className="h-9 w-9 flex-shrink-0">
          <AvatarFallback className="bg-primary/15 text-primary font-semibold text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
          {customer && (
            <p className="text-xs text-muted-foreground">
              {formatPhoneDisplay(customer.phone)}
            </p>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={refetchMessages}
          title="Refresh messages"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
      >
        {/* Load more spinner */}
        {loadingMore && (
          <div className="flex justify-center py-3">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Load more trigger text */}
        {hasMore && !loadingMore && messages.length > 0 && (
          <div className="flex justify-center py-2">
            <button
              type="button"
              onClick={loadMore}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Load older messages
            </button>
          </div>
        )}

        {loadingInitial && <MessagesSkeleton />}

        {!loadingInitial && messagesError && (
          <div className="p-4">
            <Alert variant="destructive">
              <AlertDescription>
                {messagesError}
                <button
                  type="button"
                  onClick={refetchMessages}
                  className="ml-2 underline"
                >
                  Try again
                </button>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {!loadingInitial && !messagesError && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No messages yet</p>
          </div>
        )}

        {!loadingInitial &&
          messagesWithDates.map((item, idx) => {
            if (item.type === 'date') {
              return <DateSeparator key={`date-${idx}`} date={item.date} />;
            }
            return <MessageBubble key={item.message.id} message={item.message} />;
          })}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} className="h-1" />
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
