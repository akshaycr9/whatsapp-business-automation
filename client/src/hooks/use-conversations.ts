import { useEffect, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  fetchConversations,
  setSearch,
  setCategory,
  markRead,
  selectConversations,
  selectConversationsStatus,
  selectConversationsError,
  selectConversationsSearch,
  selectActiveCategory,
} from '@/features/conversations/conversationsSlice';
import type { Conversation, ConversationCategory } from '@/types';

export interface UseConversationsReturn {
  conversations: Conversation[];
  loading: boolean;
  isFetching: boolean;
  error: string | null;
  search: string;
  setSearch: (value: string) => void;
  activeCategory: ConversationCategory | null;
  setActiveCategory: (category: ConversationCategory | null) => void;
  refetch: () => void;
  markConversationRead: (id: string) => void;
}

export function useConversations(): UseConversationsReturn {
  const dispatch = useAppDispatch();
  const conversations = useAppSelector(selectConversations);
  const status = useAppSelector(selectConversationsStatus);
  const error = useAppSelector(selectConversationsError);
  const search = useAppSelector(selectConversationsSearch);
  const activeCategory = useAppSelector(selectActiveCategory);

  // Debounce timer is local — it is not state, just an implementation detail
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial fetch on mount (only if not yet loaded)
  useEffect(() => {
    if (status === 'idle') {
      void dispatch(fetchConversations({ search: '', category: null }));
    }
  }, [status, dispatch]);

  // Debounce search — dispatch fetch 300ms after values settle in Redux
  // Note: we don't filter by category in the API call; instead we filter on the client side
  // This allows us to maintain all conversations for accurate tab counts
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void dispatch(fetchConversations({ search }));
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, dispatch]);

  const handleSetSearch = useCallback(
    (value: string) => {
      dispatch(setSearch(value));
    },
    [dispatch],
  );

  const handleSetCategory = useCallback(
    (category: ConversationCategory | null) => {
      dispatch(setCategory(category));
    },
    [dispatch],
  );

  const refetch = useCallback(() => {
    void dispatch(fetchConversations({ search }));
  }, [dispatch, search]);

  const markConversationRead = useCallback(
    (id: string) => {
      dispatch(markRead(id));
    },
    [dispatch],
  );

  return {
    conversations,
    loading: status === 'loading',
    isFetching: status === 'loading' && conversations.length > 0,
    error,
    search,
    setSearch: handleSetSearch,
    activeCategory,
    setActiveCategory: handleSetCategory,
    refetch,
    markConversationRead,
  };
}
