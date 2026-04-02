import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/lib/api';
import type {
  Conversation,
  PaginatedResponse,
  NewMessageEvent,
  ConversationUpdatedEvent,
} from '@/types';
import type { RootState } from '@/app/store';

type LoadStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface ConversationsState {
  list: Conversation[];
  status: LoadStatus;
  error: string | null;
  search: string;
}

const initialState: ConversationsState = {
  list: [],
  status: 'idle',
  error: null,
  search: '',
};

// ─── Thunks ────────────────────────────────────────────────────────────────────

export const fetchConversations = createAsyncThunk<
  Conversation[],
  string | undefined,
  { rejectValue: string }
>(
  'conversations/fetchAll',
  async (search = '', { rejectWithValue }) => {
    try {
      const params: Record<string, string> = {};
      if (search.trim()) params.search = search.trim();
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
    conversationUpdated: (state, action: PayloadAction<ConversationUpdatedEvent>) => {
      const idx = state.list.findIndex((c) => c.id === action.payload.conversation.id);
      if (idx !== -1) {
        state.list[idx] = action.payload.conversation;
      }
    },
    newMessageInConversation: (state, action: PayloadAction<NewMessageEvent>) => {
      const idx = state.list.findIndex((c) => c.id === action.payload.conversationId);
      if (idx === -1) return;
      const updated: Conversation = {
        ...state.list[idx],
        lastMessageAt: action.payload.message.createdAt,
        lastMessageText: action.payload.message.body,
      };
      state.list.splice(idx, 1);
      state.list.unshift(updated);
    },
    markRead: (state, action: PayloadAction<string>) => {
      const conversation = state.list.find((c) => c.id === action.payload);
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
        state.list = action.payload;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Unknown error';
      });
  },
});

// ─── Actions ───────────────────────────────────────────────────────────────────

export const { setSearch, conversationUpdated, newMessageInConversation, markRead } =
  conversationsSlice.actions;

// ─── Selectors ─────────────────────────────────────────────────────────────────

export const selectConversations = (state: RootState): Conversation[] =>
  state.conversations.list;
export const selectConversationsStatus = (state: RootState): LoadStatus =>
  state.conversations.status;
export const selectConversationsError = (state: RootState): string | null =>
  state.conversations.error;
export const selectConversationsSearch = (state: RootState): string =>
  state.conversations.search;
export const selectConversationById =
  (id: string) =>
  (state: RootState): Conversation | null =>
    state.conversations.list.find((c) => c.id === id) ?? null;

export default conversationsSlice.reducer;
