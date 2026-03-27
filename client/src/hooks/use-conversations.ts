import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { socket } from '@/lib/socket';
import type {
  Conversation,
  PaginatedResponse,
  NewMessageEvent,
  ConversationUpdatedEvent,
} from '@/types';

// Module-level cache — persists across component mounts for instant re-navigation
let cachedConversations: Conversation[] | null = null;

export interface UseConversationsReturn {
  conversations: Conversation[];
  loading: boolean;
  isFetching: boolean;
  error: string | null;
  search: string;
  setSearch: (value: string) => void;
  refetch: () => void;
}

export function useConversations(): UseConversationsReturn {
  const [conversations, setConversations] = useState<Conversation[]>(cachedConversations ?? []);
  const [loading, setLoading] = useState(cachedConversations === null);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef(search);
  searchRef.current = search;

  const fetchConversations = useCallback(async (searchTerm: string) => {
    setIsFetching(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      const response = await api.get<PaginatedResponse<Conversation>>('/conversations', { params });
      const newConversations = response.data.data;
      setConversations(newConversations);
      // Only cache the default (non-search) view
      if (!searchTerm.trim()) {
        cachedConversations = newConversations;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setLoading(false);
      setIsFetching(false);
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
      // Update cache too
      if (cachedConversations) {
        cachedConversations = cachedConversations.map((c) =>
          c.id === event.conversation.id ? event.conversation : c,
        );
      }
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
        const newList = [updated, ...rest];
        cachedConversations = newList;
        return newList;
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

  return { conversations, loading, isFetching, error, search, setSearch, refetch };
}
