import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  fetchMessages,
  loadMoreMessages,
  checkWindow,
  selectConvMessages,
} from '@/features/messages/messagesSlice';
import type { Message } from '@/types';

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
  const dispatch = useAppDispatch();
  const convState = useAppSelector(
    conversationId ? selectConvMessages(conversationId) : selectConvMessages('__none__'),
  );

  // Fetch messages and check window whenever conversationId changes
  useEffect(() => {
    if (!conversationId) return;
    if (convState.status === 'idle') {
      void dispatch(fetchMessages(conversationId));
      void dispatch(checkWindow(conversationId));
    }
  }, [conversationId, convState.status, dispatch]);

  const loadMore = useCallback(() => {
    if (!conversationId || !convState.hasMore || convState.loadingMore) return;
    void dispatch(loadMoreMessages(conversationId));
  }, [conversationId, convState.hasMore, convState.loadingMore, dispatch]);

  const refetch = useCallback(() => {
    if (!conversationId) return;
    void dispatch(fetchMessages(conversationId));
    void dispatch(checkWindow(conversationId));
  }, [conversationId, dispatch]);

  return {
    messages: convState.items,
    hasMore: convState.hasMore,
    loadingInitial: convState.status === 'loading',
    loadingMore: convState.loadingMore,
    error: convState.error,
    isWithin24HourWindow: convState.isWithin24HourWindow,
    loadMore,
    refetch,
  };
}
