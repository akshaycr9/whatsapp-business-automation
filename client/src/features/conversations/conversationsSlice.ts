import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/lib/api';
import type {
  Conversation,
  ConversationCategory,
  PaginatedResponse,
  NewMessageEvent,
  ConversationUpdatedEvent,
} from '@/types';
import type { RootState } from '@/app/store';

type LoadStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface ConversationsState {
  allConversations: Conversation[];
  status: LoadStatus;
  error: string | null;
  search: string;
  activeCategory: ConversationCategory | null;
}

const initialState: ConversationsState = {
  allConversations: [],
  status: 'idle',
  error: null,
  search: '',
  activeCategory: null,
};

// ─── Thunks ────────────────────────────────────────────────────────────────────

interface FetchConversationsPayload {
  search?: string;
  category?: ConversationCategory | null;
}

export const fetchConversations = createAsyncThunk<
  Conversation[],
  FetchConversationsPayload,
  { rejectValue: string }
>(
  'conversations/fetchAll',
  async (payload, { rejectWithValue }) => {
    try {
      const params: Record<string, string> = {};
      if (payload.search?.trim()) params.search = payload.search.trim();
      if (payload.category) params.category = payload.category;
      const res = await api.get<PaginatedResponse<Conversation>>('/conversations', { params });
      return res.data.data;
    } catch (err: unknown) {
      return rejectWithValue(
        err instanceof Error ? err.message : 'Failed to load conversations',
      );
    }
  },
);

// ─── Slice ─────────────────────────────────────────────────────────────────────

const conversationsSlice = createSlice({
  name: 'conversations',
  initialState,
  reducers: {
    setSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload;
    },
    setCategory: (state, action: PayloadAction<ConversationCategory | null>) => {
      state.activeCategory = action.payload;
    },
    conversationUpdated: (state, action: PayloadAction<ConversationUpdatedEvent>) => {
      const idx = state.allConversations.findIndex((c) => c.id === action.payload.conversation.id);
      if (idx !== -1) {
        state.allConversations[idx] = {
          ...action.payload.conversation,
          category: action.payload.category,
        };
      }
    },
    newMessageInConversation: (state, action: PayloadAction<NewMessageEvent>) => {
      const idx = state.allConversations.findIndex((c) => c.id === action.payload.conversationId);
      if (idx === -1) return;
      const updated: Conversation = {
        ...state.allConversations[idx],
        lastMessageAt: action.payload.message.createdAt,
        lastMessageText: action.payload.message.body || '[Media]',
      };
      state.allConversations.splice(idx, 1);
      state.allConversations.unshift(updated);
    },
    markRead: (state, action: PayloadAction<string>) => {
      const conversation = state.allConversations.find((c) => c.id === action.payload);
      if (conversation) {
        conversation.unreadCount = 0;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => {
        // Only show full loading spinner on first load; subsequent fetches stay 'succeeded'
        if (state.status === 'idle') state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // Merge fetched conversations with existing ones to maintain full list
        const newConvs = action.payload;
        for (const newConv of newConvs) {
          const idx = state.allConversations.findIndex((c) => c.id === newConv.id);
          if (idx !== -1) {
            state.allConversations[idx] = newConv;
          } else {
            state.allConversations.push(newConv);
          }
        }
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Unknown error';
      });
  },
});

// ─── Actions ───────────────────────────────────────────────────────────────────

export const { setSearch, setCategory, conversationUpdated, newMessageInConversation, markRead } =
  conversationsSlice.actions;

// ─── Selectors ─────────────────────────────────────────────────────────────────

export const selectConversations = (state: RootState): Conversation[] => {
  const { allConversations, activeCategory } = state.conversations;
  // Filter by active category (null = 'chats')
  const targetCategory = activeCategory || 'chats';
  return allConversations.filter((c) => (c.category || 'chats') === targetCategory);
};

export const selectAllConversations = (state: RootState): Conversation[] =>
  state.conversations.allConversations;

export const selectConversationsStatus = (state: RootState): LoadStatus =>
  state.conversations.status;

export const selectConversationsError = (state: RootState): string | null =>
  state.conversations.error;

export const selectConversationsSearch = (state: RootState): string =>
  state.conversations.search;

export const selectConversationById =
  (id: string) =>
  (state: RootState): Conversation | null =>
    state.conversations.allConversations.find((c) => c.id === id) ?? null;

export const selectActiveCategory = (state: RootState): ConversationCategory | null =>
  state.conversations.activeCategory;

export const selectConversationsByCategory =
  (category: ConversationCategory) =>
  (state: RootState): Conversation[] =>
    state.conversations.allConversations.filter((c) => (c.category || 'chats') === category);

export default conversationsSlice.reducer;
