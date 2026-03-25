import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { socket } from '@/lib/socket';
import type { Message, NewMessageEvent, MessageStatusUpdateEvent } from '@/types';

interface MessagesMeta {
  cursor: string | null;
  hasMore: boolean;
}

export interface UseMessagesReturn {
  messages: Message[];
  hasMore: boolean;
  loadingInitial: boolean;
  loadingMore: boolean;
  error: string | null;
  isWithin24HourWindow: boolean;
  loadMore: () => void;
  refetch: () => void;
}

export function useMessages(conversationId: string | undefined): UseMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [meta, setMeta] = useState<MessagesMeta>({ cursor: null, hasMore: false });
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isWithin24HourWindow, setIsWithin24HourWindow] = useState(false);

  const conversationIdRef = useRef(conversationId);
  conversationIdRef.current = conversationId;

  const fetchMessages = useCallback(async (convId: string) => {
    setLoadingInitial(true);
    setError(null);
    setMessages([]);
    setMeta({ cursor: null, hasMore: false });
    try {
      const response = await api.get<{
        data: Message[];
        meta: { cursor: string | null; hasMore: boolean };
      }>(`/conversations/${convId}/messages`, { params: { limit: 50 } });
      setMessages(response.data.data);
      setMeta({ cursor: response.data.meta.cursor, hasMore: response.data.meta.hasMore });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoadingInitial(false);
    }
  }, []);

  const checkWindow = useCallback(async (convId: string) => {
    try {
      const response = await api.get<{ data: { isWithin24HourWindow: boolean } }>(
        `/conversations/${convId}/window`,
      );
      setIsWithin24HourWindow(response.data.data.isWithin24HourWindow);
    } catch {
      setIsWithin24HourWindow(false);
    }
  }, []);

  // Fetch messages and check window when conversationId changes
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setMeta({ cursor: null, hasMore: false });
      setLoadingInitial(false);
      setError(null);
      setIsWithin24HourWindow(false);
      return;
    }
    void fetchMessages(conversationId);
    void checkWindow(conversationId);
  }, [conversationId, fetchMessages, checkWindow]);

  // Socket event handlers
  useEffect(() => {
    const handleNewMessage = (event: NewMessageEvent) => {
      if (event.conversationId !== conversationIdRef.current) return;
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m.id === event.message.id)) return prev;
        return [...prev, event.message];
      });
      // Refresh 24h window status
      if (conversationIdRef.current) {
        void checkWindow(conversationIdRef.current);
      }
    };

    const handleStatusUpdate = (event: MessageStatusUpdateEvent) => {
      const statusPriority: Record<string, number> = {
        PENDING: 0,
        SENT: 1,
        DELIVERED: 2,
        READ: 3,
        FAILED: 4,
      };
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== event.messageId) return m;
          const currentPriority = statusPriority[m.status] ?? 0;
          const newPriority = statusPriority[event.status] ?? 0;
          // Only upgrade status (except FAILED which can always be set)
          if (event.status === 'FAILED' || newPriority > currentPriority) {
            return { ...m, status: event.status };
          }
          return m;
        }),
      );
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_status_update', handleStatusUpdate);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_status_update', handleStatusUpdate);
    };
  }, [checkWindow]);

  const loadMore = useCallback(async () => {
    if (!conversationId || !meta.hasMore || loadingMore) return;
    if (messages.length === 0) return;

    const oldestMessage = messages[0];
    setLoadingMore(true);
    try {
      const response = await api.get<{
        data: Message[];
        meta: { cursor: string | null; hasMore: boolean };
      }>(`/conversations/${conversationId}/messages`, {
        params: { limit: 50, cursor: oldestMessage.createdAt },
      });
      // Prepend older messages
      setMessages((prev) => [...response.data.data, ...prev]);
      setMeta({ cursor: response.data.meta.cursor, hasMore: response.data.meta.hasMore });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load older messages');
    } finally {
      setLoadingMore(false);
    }
  }, [conversationId, meta.hasMore, loadingMore, messages]);

  const refetch = useCallback(() => {
    if (!conversationId) return;
    void fetchMessages(conversationId);
    void checkWindow(conversationId);
  }, [conversationId, fetchMessages, checkWindow]);

  return {
    messages,
    hasMore: meta.hasMore,
    loadingInitial,
    loadingMore,
    error,
    isWithin24HourWindow,
    loadMore,
    refetch,
  };
}
