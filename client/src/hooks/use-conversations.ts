import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { socket } from '@/lib/socket';
import type {
  Conversation,
  PaginatedResponse,
  NewMessageEvent,
  ConversationUpdatedEvent,
} from '@/types';

export interface UseConversationsReturn {
  conversations: Conversation[];
  loading: boolean;
  error: string | null;
  search: string;
  setSearch: (value: string) => void;
  refetch: () => void;
}

export function useConversations(): UseConversationsReturn {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef(search);
  searchRef.current = search;

  const fetchConversations = useCallback(async (searchTerm: string) => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      const response = await api.get<PaginatedResponse<Conversation>>('/conversations', { params });
      setConversations(response.data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    void fetchConversations('');
  }, [fetchConversations]);

  // Debounce search
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      void fetchConversations(search);
    }, 300);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [search, fetchConversations]);

  // Socket event handlers
  useEffect(() => {
    const handleConversationUpdated = (event: ConversationUpdatedEvent) => {
      setConversations((prev) =>
        prev.map((c) => (c.id === event.conversation.id ? event.conversation : c)),
      );
    };

    const handleNewMessage = (event: NewMessageEvent) => {
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === event.conversationId);
        if (idx === -1) return prev;
        const updated: Conversation = {
          ...prev[idx],
          lastMessageAt: event.message.createdAt,
          lastMessageText: event.message.body,
        };
        // Move to top
        const rest = prev.filter((c) => c.id !== event.conversationId);
        return [updated, ...rest];
      });
    };

    socket.on('conversation_updated', handleConversationUpdated);
    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('conversation_updated', handleConversationUpdated);
      socket.off('new_message', handleNewMessage);
    };
  }, []);

  const refetch = useCallback(() => {
    void fetchConversations(searchRef.current);
  }, [fetchConversations]);

  return { conversations, loading, error, search, setSearch, refetch };
}
