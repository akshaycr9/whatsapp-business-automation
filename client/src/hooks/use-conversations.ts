import { useEffect, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  fetchConversations,
  setSearch,
  markRead,
  selectConversations,
  selectConversationsStatus,
  selectConversationsError,
  selectConversationsSearch,
} from '@/features/conversations/conversationsSlice';
import type { Conversation } from '@/types';

export interface UseConversationsReturn {
  conversations: Conversation[];
  loading: boolean;
  isFetching: boolean;
  error: string | null;
  search: string;
  setSearch: (value: string) => void;
  refetch: () => void;
  markConversationRead: (id: string) => void;
}

export function useConversations(): UseConversationsReturn {
  const dispatch = useAppDispatch();
  const conversations = useAppSelector(selectConversations);
  const status = useAppSelector(selectConversationsStatus);
  const error = useAppSelector(selectConversationsError);
  const search = useAppSelector(selectConversationsSearch);

  // Debounce timer is local — it is not state, just an implementation detail
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial fetch on mount (only if not yet loaded)
  useEffect(() => {
    if (status === 'idle') {
      void dispatch(fetchConversations(''));
    }
  }, [status, dispatch]);

  // Debounce search — dispatch fetch 300ms after search value settles in Redux
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void dispatch(fetchConversations(search));
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

  const refetch = useCallback(() => {
    void dispatch(fetchConversations(search));
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
    refetch,
    markConversationRead,
  };
}
