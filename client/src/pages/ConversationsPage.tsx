import { useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageSquare, Search, RefreshCw, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ConversationListItem } from '@/components/conversations/ConversationListItem';
import { MessageBubble } from '@/components/conversations/MessageBubble';
import { ChatInput } from '@/components/conversations/ChatInput';
import { useConversations } from '@/hooks/use-conversations';
import { useMessages } from '@/hooks/use-messages';
import { api } from '@/lib/api';
import { formatPhoneDisplay, getInitials } from '@/lib/utils';
import type { Message, Conversation } from '@/types';

// ── Skeleton helpers ──────────────────────────────────────────────────────────

function ConversationListSkeleton() {
  return (
    <div className="flex flex-col">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3 w-10" />
            </div>
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
      ))}
    </div>
  );
}

function MessagesSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-4">
      {[false, true, false, true, false].map((isRight, i) => (
        <div key={i} className={`flex ${isRight ? 'justify-end' : 'justify-start'}`}>
          <Skeleton className={`h-10 rounded-2xl ${isRight ? 'w-48' : 'w-64'}`} />
        </div>
      ))}
    </div>
  );
}

// ── Date separator ────────────────────────────────────────────────────────────

function DateSeparator({ date }: { date: string }) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  let label: string;
  if (d.toDateString() === today.toDateString()) {
    label = 'Today';
  } else if (d.toDateString() === yesterday.toDateString()) {
    label = 'Yesterday';
  } else {
    label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2">
      <div className="flex-1 h-px bg-border" />
      <span className="text-[11px] text-muted-foreground font-medium flex-shrink-0">{label}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

// ── Chat panel ────────────────────────────────────────────────────────────────

interface ChatPanelProps {
  conversationId: string;
  conversations: Conversation[];
  onBack: () => void;
}

function ChatPanel({ conversationId, conversations, onBack }: ChatPanelProps) {
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
    void api.patch(`/conversations/${conversationId}/read`).catch(() => {
      // Ignore errors for read marking
    });
  }, [conversationId]);

  const handleMessageSent = useCallback(
    (message: Message) => {
      // Message is appended via the socket event, but as a fallback also refetch
      // Scroll to bottom after send
      isNearBottomRef.current = true;
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      // Refetch to get the latest state
      refetchMessages();
    },
    [refetchMessages],
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
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ConversationsPage() {
  const { id: activeId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { conversations, loading, error, search, setSearch, refetch } = useConversations();

  const handleSelectConversation = useCallback(
    (id: string) => {
      navigate(`/conversations/${id}`);
    },
    [navigate],
  );

  const handleBack = useCallback(() => {
    navigate('/conversations');
  }, [navigate]);

  // Mobile: if a conversation is selected, hide the list
  const showListOnMobile = !activeId;
  const showChatOnMobile = !!activeId;

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Left panel: conversation list ── */}
      <div
        className={`
          flex flex-col border-r bg-background
          w-full md:w-80 lg:w-96 flex-shrink-0
          ${showListOnMobile ? 'flex' : 'hidden md:flex'}
        `}
      >
        {/* Header */}
        <div className="p-4 border-b flex-shrink-0">
          <h1 className="text-lg font-semibold text-foreground mb-3">Conversations</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading && <ConversationListSkeleton />}

          {!loading && error && (
            <div className="p-4">
              <Alert variant="destructive">
                <AlertDescription>
                  {error}
                  <button
                    type="button"
                    onClick={refetch}
                    className="ml-2 underline"
                  >
                    Try again
                  </button>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {!loading && !error && conversations.length === 0 && (
            <div className="flex flex-col items-center justify-center p-8 text-center h-full min-h-[200px]">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <MessageSquare className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">No conversations yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                WhatsApp messages from customers will appear here.
              </p>
            </div>
          )}

          {!loading &&
            !error &&
            conversations.map((conversation) => (
              <ConversationListItem
                key={conversation.id}
                conversation={conversation}
                isActive={conversation.id === activeId}
                onClick={() => handleSelectConversation(conversation.id)}
              />
            ))}
        </div>
      </div>

      {/* ── Right panel: chat area ── */}
      <div
        className={`
          flex-1 flex flex-col overflow-hidden
          ${showChatOnMobile ? 'flex' : 'hidden md:flex'}
        `}
      >
        {activeId ? (
          <ChatPanel
            key={activeId}
            conversationId={activeId}
            conversations={conversations}
            onBack={handleBack}
          />
        ) : (
          <div className="hidden md:flex flex-col flex-1 items-center justify-center p-8 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-base font-medium text-foreground">Select a conversation</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Choose a conversation from the left to start chatting
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
