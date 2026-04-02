import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/lib/api';
import type {
  Message,
  NewMessageEvent,
  MessageStatusUpdateEvent,
  MessageReactionEvent,
} from '@/types';

type LoadStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

// Per-conversation messages state
interface ConvMessages {
  items: Message[];
  status: LoadStatus;
  error: string | null;
  cursor: string | null;
  hasMore: boolean;
  loadingMore: boolean;
  isWithin24HourWindow: boolean;
}

interface MessagesState {
  byConversationId: Record<string, ConvMessages>;
}

const initialState: MessagesState = {
  byConversationId: {},
};

const defaultConvMessages = (): ConvMessages => ({
  items: [],
  status: 'idle',
  error: null,
  cursor: null,
  hasMore: false,
  loadingMore: false,
  isWithin24HourWindow: false,
});

// Avoids circular dep with store.ts — only reference the local state shape
type MessagesThunkConfig = {
  state: { messages: MessagesState };
  rejectValue: string;
};

// ─── Thunks ────────────────────────────────────────────────────────────────────

export const fetchMessages = createAsyncThunk<
  { conversationId: string; messages: Message[]; cursor: string | null; hasMore: boolean },
  string,
  { rejectValue: string }
>(
  'messages/fetchInitial',
  async (conversationId, { rejectWithValue }) => {
    try {
      const res = await api.get<{
        data: Message[];
        meta: { cursor: string | null; hasMore: boolean };
      }>(`/conversations/${conversationId}/messages`, { params: { limit: 50 } });
      // Backend returns newest-first (DESC); reverse to oldest-first for chat display
      const messages = [...res.data.data]
        .reverse()
        .map((m) => ({ ...m, reactions: m.reactions ?? [] }));
      return {
        conversationId,
        messages,
        cursor: res.data.meta.cursor,
        hasMore: res.data.meta.hasMore,
      };
    } catch (err: unknown) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to load messages');
    }
  },
);

export const loadMoreMessages = createAsyncThunk<
  { conversationId: string; messages: Message[]; cursor: string | null; hasMore: boolean },
  string,
  MessagesThunkConfig
>(
  'messages/loadMore',
  async (conversationId, { rejectWithValue, getState }) => {
    const convState = getState().messages.byConversationId[conversationId];
    if (!convState || convState.items.length === 0) {
      return rejectWithValue('No messages loaded yet');
    }
    const cursor = convState.items[0].createdAt;
    try {
      const res = await api.get<{
        data: Message[];
        meta: { cursor: string | null; hasMore: boolean };
      }>(`/conversations/${conversationId}/messages`, {
        params: { limit: 50, cursor },
      });
      // Prepend older messages (reverse DESC response to oldest-first before prepending)
      const messages = [...res.data.data]
        .reverse()
        .map((m) => ({ ...m, reactions: m.reactions ?? [] }));
      return {
        conversationId,
        messages,
        cursor: res.data.meta.cursor,
        hasMore: res.data.meta.hasMore,
      };
    } catch (err: unknown) {
      return rejectWithValue(
        err instanceof Error ? err.message : 'Failed to load older messages',
      );
    }
  },
);

export const checkWindow = createAsyncThunk<
  { conversationId: string; isOpen: boolean },
  string,
  { rejectValue: string }
>(
  'messages/checkWindow',
  async (conversationId, { rejectWithValue }) => {
    try {
      const res = await api.get<{ data: { isOpen: boolean } }>(
        `/conversations/${conversationId}/window`,
      );
      return { conversationId, isOpen: res.data.data.isOpen };
    } catch {
      return rejectWithValue('Failed to check window');
    }
  },
);

// ─── Slice ─────────────────────────────────────────────────────────────────────

const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    messageReceived: (state, action: PayloadAction<NewMessageEvent>) => {
      const { conversationId, message } = action.payload;
      const conv = state.byConversationId[conversationId];
      if (!conv) return; // conversation not open, no need to update
      // Avoid duplicates
      if (conv.items.some((m) => m.id === message.id)) return;
      conv.items.push({ ...message, reactions: message.reactions ?? [] });
    },
    messageStatusUpdated: (state, action: PayloadAction<MessageStatusUpdateEvent>) => {
      const statusPriority: Record<string, number> = {
        PENDING: 0,
        SENT: 1,
        DELIVERED: 2,
        READ: 3,
        FAILED: 4,
      };
      for (const conv of Object.values(state.byConversationId)) {
        const msg = conv.items.find((m) => m.id === action.payload.messageId);
        if (!msg) continue;
        const currentPriority = statusPriority[msg.status] ?? 0;
        const newPriority = statusPriority[action.payload.status] ?? 0;
        if (action.payload.status === 'FAILED' || newPriority > currentPriority) {
          msg.status = action.payload.status;
          if (action.payload.timestamps) {
            msg.metadata = { ...(msg.metadata ?? {}), ...action.payload.timestamps };
          }
        }
        break;
      }
    },
    messageReactionUpdated: (state, action: PayloadAction<MessageReactionEvent>) => {
      for (const conv of Object.values(state.byConversationId)) {
        const msg = conv.items.find((m) => m.id === action.payload.messageId);
        if (msg) {
          msg.reactions = action.payload.reactions;
          break;
        }
      }
    },
    windowUpdated: (
      state,
      action: PayloadAction<{ conversationId: string; isOpen: boolean }>,
    ) => {
      const conv = state.byConversationId[action.payload.conversationId];
      if (conv) {
        conv.isWithin24HourWindow = action.payload.isOpen;
      }
    },
  },
  extraReducers: (builder) => {
    // fetchMessages
    builder
      .addCase(fetchMessages.pending, (state, action) => {
        const id = action.meta.arg;
        state.byConversationId[id] = {
          ...defaultConvMessages(),
          status: 'loading',
        };
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        const { conversationId, messages, cursor, hasMore } = action.payload;
        state.byConversationId[conversationId] = {
          ...defaultConvMessages(),
          status: 'succeeded',
          items: messages,
          cursor,
          hasMore,
        };
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        const id = action.meta.arg;
        if (state.byConversationId[id]) {
          state.byConversationId[id].status = 'failed';
          state.byConversationId[id].error = action.payload ?? 'Unknown error';
        }
      });

    // loadMoreMessages
    builder
      .addCase(loadMoreMessages.pending, (state, action) => {
        const id = action.meta.arg;
        if (state.byConversationId[id]) {
          state.byConversationId[id].loadingMore = true;
          state.byConversationId[id].error = null;
        }
      })
      .addCase(loadMoreMessages.fulfilled, (state, action) => {
        const { conversationId, messages, cursor, hasMore } = action.payload;
        const conv = state.byConversationId[conversationId];
        if (conv) {
          conv.items = [...messages, ...conv.items];
          conv.cursor = cursor;
          conv.hasMore = hasMore;
          conv.loadingMore = false;
        }
      })
      .addCase(loadMoreMessages.rejected, (state, action) => {
        const id = action.meta.arg;
        if (state.byConversationId[id]) {
          state.byConversationId[id].loadingMore = false;
          state.byConversationId[id].error = action.payload ?? 'Unknown error';
        }
      });

    // checkWindow
    builder.addCase(checkWindow.fulfilled, (state, action) => {
      const { conversationId, isOpen } = action.payload;
      const conv = state.byConversationId[conversationId];
      if (conv) {
        conv.isWithin24HourWindow = isOpen;
      }
    });
  },
});

// ─── Actions ───────────────────────────────────────────────────────────────────

export const {
  messageReceived,
  messageStatusUpdated,
  messageReactionUpdated,
  windowUpdated,
} = messagesSlice.actions;

// ─── Selectors ─────────────────────────────────────────────────────────────────

export const selectConvMessages =
  (conversationId: string) =>
  (state: { messages: MessagesState }): ConvMessages =>
    state.messages.byConversationId[conversationId] ?? defaultConvMessages();

export default messagesSlice.reducer;
