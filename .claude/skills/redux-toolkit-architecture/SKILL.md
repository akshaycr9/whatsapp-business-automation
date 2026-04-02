---
description: >
  Redux Toolkit global state architecture for the Qwertees WhatsApp Automation frontend.
  Use when migrating component state to global Redux store, adding new slices, writing selectors,
  wiring up async thunks, or reviewing any Redux-related code in client/. Triggers on:
  "redux", "global state", "store", "slice", "selector", "thunk", "dispatch",
  "lift state", "move state to redux", "redux architecture", "redux best practices".
---

# Redux Toolkit Architecture — Qwertees WhatsApp Automation

This skill governs all Redux state management in `client/`. The project uses React 18+,
TypeScript strict mode, Redux Toolkit (RTK), and React-Redux hooks. Every rule here is derived
from the official Redux Style Guide and tailored to this codebase.

---

## 0. Decision Rule — Redux vs Local State

Before writing any state, decide where it belongs:

| Use **Redux** (global) | Use **`useState`** (local) |
|------------------------|---------------------------|
| Data shared by ≥2 unrelated components | Modal open/closed flag |
| Data that must survive navigation (cached) | Form field values while typing |
| Server data fetched from the API | Hover/focus/active UI state |
| Real-time updates via Socket.io | Dropdown expanded/collapsed |
| Notification/push subscription state | Tooltip visibility |
| Auth/session state | Accordion open state |
| Pagination cursors used across tabs | Temp variables during animation |

**Golden rule from the Redux Style Guide (Priority B):** "There should be a single place to
find all global app-wide values, but local state belongs in components."

Form state is **never** in Redux unless a live preview of unsaved changes is needed by another
component simultaneously.

---

## 1. Store Setup

### File: `client/src/app/store.ts`

```typescript
import { configureStore } from '@reduxjs/toolkit';
import conversationsReducer from '../features/conversations/conversationsSlice';
import customersReducer from '../features/customers/customersSlice';
import templatesReducer from '../features/templates/templatesSlice';
import automationsReducer from '../features/automations/automationsSlice';
import dashboardReducer from '../features/dashboard/dashboardSlice';
import uiReducer from '../features/ui/uiSlice';

export const store = configureStore({
  reducer: {
    conversations: conversationsReducer,
    customers: customersReducer,
    templates: templatesReducer,
    automations: automationsReducer,
    dashboard: dashboardReducer,
    ui: uiReducer,
  },
});

// Infer types from store — never write these manually
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

**Rules:**
- One store per app — never create a second `configureStore` call anywhere.
- `configureStore` automatically enables Redux DevTools Extension and Immer.
- Slice keys name the data stored, never the reducer (`conversations`, not `conversationsReducer`).
- Never import `store` directly in components — always use `useSelector`/`useDispatch`.

---

## 2. Typed Hooks — Single Source of Truth

### File: `client/src/app/hooks.ts`

```typescript
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';

// Use these throughout the app instead of plain useDispatch/useSelector
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
```

**Rule:** Every component must import `useAppDispatch` and `useAppSelector` from `app/hooks.ts`,
never the raw `useDispatch`/`useSelector` from `react-redux`. This gives full type safety
without manual annotations on every call site.

---

## 3. File Structure

```
client/src/
├── app/
│   ├── store.ts          ← configureStore + RootState/AppDispatch types
│   └── hooks.ts          ← typed useAppDispatch + useAppSelector
├── features/
│   ├── conversations/
│   │   ├── conversationsSlice.ts    ← state, reducers, thunks, selectors
│   │   └── (components co-located here or in components/)
│   ├── customers/
│   │   └── customersSlice.ts
│   ├── templates/
│   │   └── templatesSlice.ts
│   ├── automations/
│   │   └── automationsSlice.ts
│   ├── dashboard/
│   │   └── dashboardSlice.ts
│   └── ui/
│       └── uiSlice.ts    ← global UI state (sidebar, active modals)
```

**Rules:**
- One slice file per feature domain — no separate `actions/` or `reducers/` folders.
- Slice files follow the "ducks" pattern: state type, initial state, slice, thunks, selectors
  all in one file.
- State shape is organized by **data type**, not by component. No slice named `loginScreen`
  or `templateModal` — use `auth` and `templates`.

---

## 4. Slice Pattern (createSlice)

### Template for every slice:

```typescript
// features/conversations/conversationsSlice.ts

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../../lib/api';
import type { RootState } from '../../app/store';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Conversation {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  lastMessageAt: string | null;
  unreadCount: number;
  isWithin24hWindow: boolean;
}

interface Message {
  id: string;
  conversationId: string;
  direction: 'INBOUND' | 'OUTBOUND';
  type: string;
  content: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  waMessageId: string | null;
  createdAt: string;
}

// Discriminated union for async load state — never use separate boolean flags
type LoadStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface ConversationsState {
  list: Conversation[];
  listStatus: LoadStatus;
  listError: string | null;

  activeConversationId: string | null;

  // Normalized messages: keyed by conversationId for O(1) access
  messagesByConversationId: Record<string, Message[]>;
  messagesStatus: Record<string, LoadStatus>;
  messagesError: Record<string, string | null>;
}

// ─── Initial State ─────────────────────────────────────────────────────────────

const initialState: ConversationsState = {
  list: [],
  listStatus: 'idle',
  listError: null,
  activeConversationId: null,
  messagesByConversationId: {},
  messagesStatus: {},
  messagesError: {},
};

// ─── Thunks ────────────────────────────────────────────────────────────────────

export const fetchConversations = createAsyncThunk(
  'conversations/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get<{ data: Conversation[] }>('/conversations');
      return res.data.data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch conversations';
      return rejectWithValue(message);
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'conversations/fetchMessages',
  async (conversationId: string, { rejectWithValue }) => {
    try {
      const res = await api.get<{ data: Message[] }>(
        `/conversations/${conversationId}/messages`
      );
      return { conversationId, messages: res.data.data };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch messages';
      return rejectWithValue({ conversationId, message });
    }
  }
);

// ─── Slice ─────────────────────────────────────────────────────────────────────

const conversationsSlice = createSlice({
  name: 'conversations',
  initialState,
  reducers: {
    // Synchronous actions — model as events, not setters
    conversationSelected: (state, action: PayloadAction<string>) => {
      state.activeConversationId = action.payload;
    },
    messageReceived: (state, action: PayloadAction<Message>) => {
      const { conversationId } = action.payload;
      if (!state.messagesByConversationId[conversationId]) {
        state.messagesByConversationId[conversationId] = [];
      }
      state.messagesByConversationId[conversationId].push(action.payload);
    },
    messageStatusUpdated: (
      state,
      action: PayloadAction<{ waMessageId: string; status: Message['status'] }>
    ) => {
      const statusPriority: Record<Message['status'], number> = {
        PENDING: 0, SENT: 1, DELIVERED: 2, READ: 3, FAILED: 4,
      };
      for (const messages of Object.values(state.messagesByConversationId)) {
        const msg = messages.find((m) => m.waMessageId === action.payload.waMessageId);
        if (msg && statusPriority[action.payload.status] > statusPriority[msg.status]) {
          msg.status = action.payload.status;
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.listStatus = 'loading';
        state.listError = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.listStatus = 'succeeded';
        state.list = action.payload;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.listStatus = 'failed';
        state.listError = action.payload as string;
      })
      .addCase(fetchMessages.pending, (state, action) => {
        state.messagesStatus[action.meta.arg] = 'loading';
        state.messagesError[action.meta.arg] = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        const { conversationId, messages } = action.payload;
        state.messagesStatus[conversationId] = 'succeeded';
        state.messagesByConversationId[conversationId] = messages;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        const payload = action.payload as { conversationId: string; message: string };
        state.messagesStatus[payload.conversationId] = 'failed';
        state.messagesError[payload.conversationId] = payload.message;
      });
  },
});

// ─── Actions ───────────────────────────────────────────────────────────────────

export const {
  conversationSelected,
  messageReceived,
  messageStatusUpdated,
} = conversationsSlice.actions;

// ─── Selectors ─────────────────────────────────────────────────────────────────

export const selectAllConversations = (state: RootState) => state.conversations.list;
export const selectConversationsStatus = (state: RootState) => state.conversations.listStatus;
export const selectConversationsError = (state: RootState) => state.conversations.listError;
export const selectActiveConversationId = (state: RootState) => state.conversations.activeConversationId;

export const selectActiveConversation = (state: RootState) =>
  state.conversations.list.find((c) => c.id === state.conversations.activeConversationId) ?? null;

export const selectMessagesByConversationId = (conversationId: string) =>
  (state: RootState) => state.conversations.messagesByConversationId[conversationId] ?? [];

export const selectMessagesStatus = (conversationId: string) =>
  (state: RootState) => state.conversations.messagesStatus[conversationId] ?? 'idle';

export default conversationsSlice.reducer;
```

---

## 5. Selector Rules

### Naming
- Always prefix with `select`: `selectAllTemplates`, `selectTemplateById`, `selectApprovedTemplates`.
- Parameterized selectors (needing an ID) return a selector function:
  ```typescript
  export const selectTemplateById = (id: string) =>
    (state: RootState) => state.templates.entities[id] ?? null;
  ```

### Granularity
Call `useAppSelector` multiple times per component for smaller pieces — do **not** return a
large object from a single selector just to merge fields:

```typescript
// Good — each selector subscribes independently
const status = useAppSelector(selectConversationsStatus);
const conversations = useAppSelector(selectAllConversations);
const activeId = useAppSelector(selectActiveConversationId);

// Bad — unnecessary object creation causes re-render on any field change
const { status, conversations, activeId } = useAppSelector((state) => ({
  status: state.conversations.listStatus,
  conversations: state.conversations.list,
  activeId: state.conversations.activeConversationId,
}));
```

### Memoized Selectors (Reselect)
Use `createSelector` from `@reduxjs/toolkit` (re-exported from Reselect) for derived data that
involves filtering, mapping, or sorting. Only memoize if the computation is non-trivial:

```typescript
import { createSelector } from '@reduxjs/toolkit';

export const selectApprovedTemplates = createSelector(
  (state: RootState) => state.templates.list,
  (templates) => templates.filter((t) => t.status === 'APPROVED')
);

export const selectUnreadCount = createSelector(
  (state: RootState) => state.conversations.list,
  (conversations) => conversations.reduce((sum, c) => sum + c.unreadCount, 0)
);
```

Do **not** memoize trivial selectors like `state => state.templates.list` — the overhead adds
no benefit.

---

## 6. Async Thunks (createAsyncThunk)

### Pattern
```typescript
export const createTemplate = createAsyncThunk(
  'templates/create',                    // action type prefix: 'slice/verb'
  async (payload: CreateTemplateInput, { rejectWithValue }) => {
    try {
      const res = await api.post<{ data: Template }>('/templates', payload);
      return res.data.data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create template';
      return rejectWithValue(message);
    }
  }
);
```

### Rules
- Always wrap in `try/catch` and use `rejectWithValue` — never let thunks throw unhandled.
- The thunk is responsible for the API call only. Business logic (e.g., optimistic updates,
  side-effects) belongs in `extraReducers`, not in the thunk function body.
- Name the thunk action type as `'sliceName/verbNoun'`: `'conversations/fetchMessages'`,
  `'templates/syncAll'`, `'customers/importFromShopify'`.
- Never dispatch multiple actions sequentially in a thunk when one action can accomplish the
  same by updating multiple slice fields in `extraReducers`.

### After-dispatch side effects in components
```typescript
// Dispatching a thunk and acting on the result
const dispatch = useAppDispatch();

const handleSave = async () => {
  const result = await dispatch(createTemplate(formData));
  if (createTemplate.fulfilled.match(result)) {
    toast({ title: 'Template created' });
    navigate('/templates');
  } else {
    toast({ title: 'Error', description: result.payload as string, variant: 'destructive' });
  }
};
```

---

## 7. Action Naming Convention

Follow `domain/eventName` (camelCase event, past tense for events, imperative for commands):

| Type | Example |
|------|---------|
| UI event (sync) | `conversations/conversationSelected` |
| Real-time event (sync) | `conversations/messageReceived` |
| Async fetch (auto-generated) | `conversations/fetchAll/pending`, `fulfilled`, `rejected` |
| Mutation (async) | `templates/create/pending`, `fulfilled`, `rejected` |

**Model actions as events that happened, not as setter commands:**
```typescript
// Good — describes what happened
conversationSelected(id)
messageReceived(message)
templateSyncStarted()

// Bad — describes the setter operation
setActiveConversation(id)
updateMessages(messages)
setTemplateSyncLoading(true)
```

---

## 8. Reducers as State Machines

When state has a lifecycle (loading → success → error), use an explicit `status` field and
guard transitions:

```typescript
// In extraReducers — only update if transition is valid
.addCase(fetchConversations.fulfilled, (state, action) => {
  // Only transition to 'succeeded' if we were actually loading
  if (state.listStatus === 'loading') {
    state.listStatus = 'succeeded';
    state.list = action.payload;
  }
})
```

Valid status values: `'idle' | 'loading' | 'succeeded' | 'failed'`

Never use separate boolean flags:
```typescript
// Bad — allows impossible state: isLoading: true AND isError: true
isLoading: boolean;
isError: boolean;

// Good — finite states, only one can be active at a time
listStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
```

---

## 9. Immer & Immutability

Inside `createSlice` reducers and `extraReducers`, use **Immer's mutative style** — Immer
intercepts it and produces an immutable update:

```typescript
// Correct — mutate the draft, Immer handles immutability
addCase(fetchConversations.fulfilled, (state, action) => {
  state.list = action.payload;          // direct assignment is fine
  state.listStatus = 'succeeded';
})

reducers: {
  messageReceived: (state, action: PayloadAction<Message>) => {
    state.messagesByConversationId[action.payload.conversationId] ??= [];
    state.messagesByConversationId[action.payload.conversationId].push(action.payload);
  }
}
```

**Rules:**
- Never mutate state **outside** `createSlice` reducers (components, selectors, thunks).
- Never return a mutated draft AND a new value in the same case — do one or the other.
- Do not use Immutable.js — Immer is already included via RTK.

---

## 10. State Normalization

When storing collections that need item-level access by ID, normalize with an `entities` record
and an `ids` array:

```typescript
// Normalized shape — preferred for large collections
interface TemplatesState {
  ids: string[];
  entities: Record<string, Template>;
  status: LoadStatus;
  error: string | null;
}

// Denormalized — OK for small, simple collections
interface DashboardState {
  stats: DashboardStats | null;
  status: LoadStatus;
}
```

Use RTK's `createEntityAdapter` for normalized collections when they need sorting or
CRUD operations:

```typescript
import { createEntityAdapter } from '@reduxjs/toolkit';

const customersAdapter = createEntityAdapter<Customer>({
  sortComparer: (a, b) => a.name.localeCompare(b.name),
});

// Adapter generates: getInitialState(), getSelectors(), addOne/addMany/updateOne/removeOne, etc.
```

---

## 11. Socket.io Integration

Real-time events from Socket.io dispatch to the Redux store via a dedicated hook or a socket
middleware. **Never** set component state directly from socket events when that data belongs
in Redux:

```typescript
// client/src/hooks/use-socket-events.ts
import { useEffect } from 'react';
import { socket } from '../lib/socket';
import { useAppDispatch } from '../app/hooks';
import { messageReceived, messageStatusUpdated } from '../features/conversations/conversationsSlice';

export function useSocketEvents(): void {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const handleNewMessage = (message: Message) => {
      dispatch(messageReceived(message));
    };
    const handleStatusUpdate = (update: { waMessageId: string; status: Message['status'] }) => {
      dispatch(messageStatusUpdated(update));
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_status_updated', handleStatusUpdate);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_status_updated', handleStatusUpdate);
    };
  }, [dispatch]);
}
```

Mount this hook once at the app root level, not in individual page components.

---

## 12. Project-Specific Slices

This app requires the following slices. Each follows the template in Section 4:

| Slice | Key State Fields | Thunks |
|-------|-----------------|--------|
| `conversations` | `list`, `activeConversationId`, `messagesByConversationId` | `fetchConversations`, `fetchMessages`, `sendMessage`, `sendTemplate` |
| `customers` | `ids`, `entities`, `pagination` | `fetchCustomers`, `syncShopifyCustomers` |
| `templates` | `ids`, `entities`, `syncStatus` | `fetchTemplates`, `createTemplate`, `updateTemplate`, `deleteTemplate`, `syncAllTemplates` |
| `automations` | `list`, `logs` | `fetchAutomations`, `createAutomation`, `updateAutomation`, `deleteAutomation`, `fetchLogs` |
| `dashboard` | `stats`, `recentActivity` | `fetchDashboardStats` |
| `ui` | `sidebarOpen`, `activeModal`, `toasts` | _(sync only — no async)_ |

---

## 13. Provider Setup

### `client/src/main.tsx`

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './app/store';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
```

The `<Provider>` wraps everything so every component can access the store. No other approach
(manual store import, React Context re-wrapping) is acceptable.

---

## 14. Component Patterns

### Reading state (useAppSelector)
```typescript
// Multiple granular selectors — preferred
const status = useAppSelector(selectConversationsStatus);
const conversations = useAppSelector(selectAllConversations);

// Conditional/parameterized selector
const activeConversation = useAppSelector(selectActiveConversation);
const messages = useAppSelector(selectMessagesByConversationId(conversationId));
```

### Dispatching actions (useAppDispatch)
```typescript
const dispatch = useAppDispatch();

// Sync action
dispatch(conversationSelected(id));

// Async thunk
dispatch(fetchConversations());

// Async thunk with result handling
const result = await dispatch(sendMessage({ conversationId, content }));
if (sendMessage.fulfilled.match(result)) {
  // success path
}
```

### Triggering fetches
Fetch data where the component mounts, not in a parent "just in case":

```typescript
useEffect(() => {
  if (status === 'idle') {
    dispatch(fetchConversations());
  }
}, [status, dispatch]);
```

Only fetch if `status === 'idle'` — this prevents duplicate fetches on re-renders and avoids
duplicate API calls if the component mounts multiple times.

---

## 15. Anti-Patterns — Never Do These

### ❌ Importing the store directly in a component
```typescript
// WRONG — bypasses React-Redux subscription mechanism
import { store } from '../../app/store';
const state = store.getState();
```

### ❌ Non-serializable values in state
```typescript
// WRONG — functions, Promises, class instances are not serializable
state.onComplete = () => navigate('/');
state.pendingRequest = fetch('/api/conversations');
```

### ❌ Side effects in reducers
```typescript
// WRONG — reducers must be pure
reducers: {
  fetchStarted: (state) => {
    api.get('/conversations');   // ← side effect, breaks time-travel debugging
    state.status = 'loading';
  }
}
```

### ❌ Blind spread returns
```typescript
// WRONG — reducer gives up ownership of state shape
case 'users/updated': return action.payload;           // blind return
case 'users/patched': return { ...state, ...action.payload }; // blind spread
```

### ❌ Storing form state in Redux
```typescript
// WRONG — form field values while typing never belong in Redux
reducers: {
  templateNameChanged: (state, action) => { state.editingName = action.payload; }
}
// Use local useState in the form component instead
```

### ❌ Sequential dispatches for one conceptual transaction
```typescript
// WRONG — causes 3 separate renders and intermediate invalid states
dispatch(setLoading(true));
dispatch(setData(result));
dispatch(setLoading(false));

// CORRECT — one action, one render
dispatch(fetchConversations.fulfilled(result));
// Or define a single action that sets all fields atomically
```

### ❌ Raw `useSelector`/`useDispatch` instead of typed hooks
```typescript
// WRONG — loses type safety
import { useSelector, useDispatch } from 'react-redux';
const data = useSelector((state: any) => state.conversations);

// CORRECT
import { useAppSelector, useAppDispatch } from '../../app/hooks';
const data = useAppSelector(selectAllConversations);
```

---

## 16. TypeScript Conventions for Redux

- `RootState` and `AppDispatch` are inferred — never write them manually.
- Use `PayloadAction<T>` for all reducer action parameters.
- Use `createAsyncThunk<ReturnType, ArgType, { rejectValue: string }>()` for full type safety:
  ```typescript
  export const fetchTemplates = createAsyncThunk<Template[], void, { rejectValue: string }>(
    'templates/fetchAll',
    async (_, { rejectWithValue }) => { ... }
  );
  ```
- All state interfaces must be defined above the slice. No inline type definitions.
- `LoadStatus` type (`'idle' | 'loading' | 'succeeded' | 'failed'`) is reusable — define once
  in `client/src/types/index.ts` and import everywhere.

---

## 17. DevTools Verification Checklist

After implementing any slice, verify in Redux DevTools:

1. **Action log** — dispatched action names follow `sliceName/actionName` convention.
2. **State diff** — only the expected fields changed, no unintended mutations.
3. **No serialization warnings** — no Promises, functions, or class instances in state.
4. **Time-travel** — stepping back through actions restores correct UI state.
5. **Initial state** — store shape on first load matches expected `initialState` for all slices.

---

## 18. Migration Checklist (Local State → Redux)

When lifting state from a component to Redux:

- [ ] Identify all components that read or write the state being lifted.
- [ ] Create or update the slice with the new state fields, reducers, and selectors.
- [ ] Replace `useState`/`useReducer` in the source component with `useAppSelector` + `useAppDispatch`.
- [ ] Remove props that were previously drilling this state down to children — replace with `useAppSelector` in those children.
- [ ] Remove any custom hooks that were wrapping the local state if their sole purpose was to share it.
- [ ] Verify no intermediate "zombie" state remains in components.
- [ ] Confirm the DevTools action log is clean (no extra noise, correct action names).
- [ ] Keep form-specific state (current input values, validation errors) in local state unless another component needs it live.
