import { useCallback, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, MessageSquare } from 'lucide-react';
import { useAppSelector } from '@/app/hooks';
import { selectAllConversations } from '@/features/conversations/conversationsSlice';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChatPanel } from '@/components/conversations/ChatPanel';
import { ConversationListItem } from '@/components/conversations/ConversationListItem';
import { ConversationListSkeleton } from '@/components/conversations/ConversationListSkeleton';
import { useConversations } from '@/hooks/use-conversations';
import { formatPhoneDisplay } from '@/lib/utils';
import type { ConversationCategory } from '@/types';

export default function ConversationsPage() {
  const { id: activeId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    conversations,
    loading,
    error,
    search,
    setSearch,
    activeCategory,
    setActiveCategory,
    refetch,
    markConversationRead,
  } = useConversations();

  const allConversations = useAppSelector(selectAllConversations);

  const categoryCounts = useMemo(() => {
    const counts = { chats: 0, requesting: 0, intervened: 0 };
    allConversations.forEach((c) => {
      const cat = c.category || 'chats';
      counts[cat as ConversationCategory]++;
    });
    return counts;
  }, [allConversations]);

  const handleSelectConversation = useCallback(
    (id: string) => navigate(`/conversations/${id}`),
    [navigate],
  );

  const handleBack = useCallback(() => navigate('/conversations'), [navigate]);

  // If the active conversation is not in the current tab, clear the selection
  useEffect(() => {
    if (activeId && !conversations.find((c) => c.id === activeId)) {
      navigate('/conversations');
    }
  }, [activeId, conversations, navigate]);

  const showListOnMobile = !activeId;
  const showChatOnMobile = !!activeId;

  return (
    <div className="flex h-full overflow-hidden p-0">
      {/* Card wrapper — matches .conv-layout */}
      <div
        className={`
          flex h-full w-full overflow-hidden
          bg-[var(--cf-surface)] border border-[var(--cf-border)]
          rounded-[14px] shadow-[var(--shadow-sm-cf)]
        `}
        style={{ display: 'grid', gridTemplateColumns: '320px minmax(0,1fr)' }}
      >
        {/* ── Left panel: conversation list ── */}
        <div
          className={`
            flex flex-col border-r border-[var(--cf-border)] bg-[var(--cf-surface)] overflow-hidden
            ${showListOnMobile ? 'flex' : 'hidden md:flex'}
          `}
          style={{ gridColumn: 1 }}
        >
          {/* Search bar */}
          <div
            className="flex-shrink-0 border-b border-[var(--cf-border)]"
            style={{ padding: '12px' }}
          >
            <div
              className="flex items-center gap-2 rounded-lg"
              style={{
                background: 'var(--cf-surface-sunken)',
                padding: '7px 11px',
              }}
            >
              <Search
                style={{ width: 14, height: 14, color: 'var(--ink-500)', flexShrink: 0, strokeWidth: 2 }}
              />
              <input
                type="text"
                placeholder="Search conversations"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 border-none bg-transparent outline-none text-[13px] text-[var(--ink-900)] placeholder:text-[var(--ink-400)]"
              />
            </div>
          </div>

          {/* Tabs */}
          <div
            className="flex flex-shrink-0 border-b border-[var(--cf-border)]"
            style={{ padding: '0 12px', gap: 4 }}
          >
            {(
              [
                { id: 'chats' as const, label: 'Chats', count: categoryCounts.chats },
                { id: 'requesting' as const, label: 'Requesting', count: categoryCounts.requesting },
                { id: 'intervened' as const, label: 'Intervened', count: categoryCounts.intervened },
              ] as { id: ConversationCategory | null; label: string; count: number }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id === 'chats' ? null : tab.id)}
                style={{
                  padding: '10px 8px',
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: (activeCategory === tab.id || (activeCategory === null && tab.id === 'chats')) ? 'var(--brand-800)' : 'var(--ink-500)',
                  borderBottom: (activeCategory === tab.id || (activeCategory === null && tab.id === 'chats'))
                    ? '2px solid var(--brand-700)'
                    : '2px solid transparent',
                  marginBottom: -1,
                  background: 'none',
                  border: 'none',
                  borderBottomStyle: 'solid',
                  borderBottomWidth: 2,
                  borderBottomColor:
                    (activeCategory === tab.id || (activeCategory === null && tab.id === 'chats')) ? 'var(--brand-700)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'color 0.12s, border-color 0.12s',
                }}
              >
                {tab.label}
                <span
                  style={{
                    display: 'inline-block',
                    background:
                      (activeCategory === tab.id || (activeCategory === null && tab.id === 'chats')) ? 'var(--brand-100)' : 'var(--cf-surface-sunken)',
                    color:
                      (activeCategory === tab.id || (activeCategory === null && tab.id === 'chats')) ? 'var(--brand-700)' : 'var(--ink-500)',
                    padding: '0px 6px',
                    borderRadius: 99,
                    fontSize: 10.5,
                    marginLeft: 4,
                    fontWeight: 700,
                  }}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loading && <ConversationListSkeleton />}

            {!loading && error && (
              <div className="p-4">
                <Alert variant="destructive">
                  <AlertDescription>
                    {error}
                    <button type="button" onClick={refetch} className="ml-2 underline">
                      Try again
                    </button>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {!loading && !error && conversations.length === 0 && (
              <div className="flex flex-col items-center justify-center p-8 text-center h-full min-h-[200px]">
                <div
                  className="flex items-center justify-center mb-3"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: 'var(--cf-surface-sunken)',
                  }}
                >
                  <MessageSquare
                    style={{ width: 24, height: 24, color: 'var(--ink-400)' }}
                  />
                </div>
                <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink-900)' }}>
                  No conversations yet
                </p>
                <p style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 4 }}>
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
                  displayName={
                    conversation.customer.name ??
                    formatPhoneDisplay(conversation.customer.phone)
                  }
                  lastMessageText={conversation.lastMessageText}
                  lastMessageAt={conversation.lastMessageAt}
                  unreadCount={conversation.unreadCount}
                  isActive={conversation.id === activeId}
                  isAuto={false}
                  onClick={() => handleSelectConversation(conversation.id)}
                />
              ))}
          </div>
        </div>

        {/* ── Right panel: chat area ── */}
        <div
          className={`
            flex flex-col overflow-hidden
            ${showChatOnMobile ? 'flex' : 'hidden md:flex'}
          `}
          style={{ gridColumn: 2 }}
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
            <div
              className="hidden md:flex flex-col flex-1 items-center justify-center p-8 text-center"
              style={{ background: '#efeae2' }}
            >
              <div
                className="flex items-center justify-center mb-4"
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.6)',
                }}
              >
                <MessageSquare style={{ width: 32, height: 32, color: '#6b7671' }} />
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-900)' }}>
                Select a conversation
              </p>
              <p style={{ fontSize: 12.5, color: 'var(--ink-500)', marginTop: 4, maxWidth: 240 }}>
                Choose a conversation from the left to start chatting
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
