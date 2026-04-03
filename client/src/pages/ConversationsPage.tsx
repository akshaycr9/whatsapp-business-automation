import { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageSquare, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChatPanel } from '@/components/conversations/ChatPanel';
import { ConversationListItem } from '@/components/conversations/ConversationListItem';
import { ConversationListSkeleton } from '@/components/conversations/ConversationListSkeleton';
import { useConversations } from '@/hooks/use-conversations';
import { formatPhoneDisplay } from '@/lib/utils';

export default function ConversationsPage() {
  const { id: activeId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { conversations, loading, error, search, setSearch, refetch, markConversationRead } = useConversations();

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
                id={conversation.id}
                displayName={conversation.customer.name ?? formatPhoneDisplay(conversation.customer.phone)}
                lastMessageText={conversation.lastMessageText}
                lastMessageAt={conversation.lastMessageAt}
                unreadCount={conversation.unreadCount}
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
            onMarkRead={markConversationRead}
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
