---
name: api-hook-generator
description: >
  Generate custom React hooks for API calls in the Qwertees WhatsApp Automation
  project. Produces typed hooks with loading/error state, refetch, pagination,
  mutations, and real-time Socket.io integration. Triggers on: "create hook for",
  "api hook", "data fetching hook", "create a hook", "fetch data from",
  "hook for X", "add hook", "list hook for X", "mutation hook for X".
---

# API Hook Generator Skill

Generate React hooks under `client/src/hooks/` that fetch data from the backend
API and optionally subscribe to real-time Socket.io events.

## File Naming

Use kebab-case with a `use-` prefix.

```
client/src/hooks/use-<resource>.ts
```

Examples: `use-customers.ts`, `use-conversation-messages.ts`, `use-create-template.ts`.

One hook per file. Name the exported hook function in camelCase: `useCustomers`, `useConversationMessages`, `useCreateTemplate`.

## Required Imports

Every hook file starts with these imports (include only what the hook uses):

```typescript
import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../lib/api";
import { useToast } from "../components/ui/use-toast";
```

For real-time hooks, also import the socket singleton:

```typescript
import { socket } from "../lib/socket";
```

Never import Axios directly. Always use the centralized `api` instance.

## Response and Error Types

Define response types above the hook. Never use `any`.

```typescript
interface Customer {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

interface CursorPaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
}

interface ApiError {
  message: string;
  statusCode: number;
}
```

If the backend already has shared types, import them from `../types/` instead of
redefining.

## Base Hook Pattern

Every data-fetching hook follows this skeleton:

```typescript
export function useResource() {
  const [data, setData] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<Resource>("/api/resource");
      setData(response.data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load resource";
      setError(message);
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
```

Key rules:
- Wrap the fetch function in `useCallback` so it is stable across renders.
- Call `setLoading(true)` and `setError(null)` at the start of every fetch.
- Always use `finally` to set `setLoading(false)`.
- Show a destructive toast on error.
- Return `refetch` so callers can reload on demand.

## Hook Variants

### 1. List Hook (Paginated)

Use for resources with page-based pagination.

```typescript
interface UseCustomersOptions {
  page?: number;
  pageSize?: number;
  search?: string;
}

export function useCustomers(options: UseCustomersOptions = {}) {
  const { page = 1, pageSize = 20, search } = options;
  const [data, setData] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<PaginatedResponse<Customer>>(
        "/api/customers",
        { params: { page, pageSize, search } }
      );
      setData(response.data.data);
      setTotal(response.data.total);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load customers";
      setError(message);
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, toast]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const hasMore = page * pageSize < total;

  return { data, total, hasMore, loading, error, refetch: fetch };
}
```

Include `page`, `pageSize`, and optional `search` in the `useCallback` dependency
array so the hook re-fetches when they change.

### 2. List Hook (Cursor-Paginated / Infinite Scroll)

Use for feeds or message lists where offset pagination is impractical.

```typescript
export function useConversationMessages(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<CursorPaginatedResponse<Message>>(
        `/api/conversations/${conversationId}/messages`
      );
      setMessages(response.data.data);
      setNextCursor(response.data.nextCursor);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load messages";
      setError(message);
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [conversationId, toast]);

  const fetchMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    try {
      setLoadingMore(true);
      const response = await api.get<CursorPaginatedResponse<Message>>(
        `/api/conversations/${conversationId}/messages`,
        { params: { cursor: nextCursor } }
      );
      setMessages((prev) => [...prev, ...response.data.data]);
      setNextCursor(response.data.nextCursor);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load more messages";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoadingMore(false);
    }
  }, [conversationId, nextCursor, loadingMore, toast]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    messages,
    loading,
    loadingMore,
    hasMore: nextCursor !== null,
    error,
    fetchMore,
    refetch: fetch,
    setMessages,
  };
}
```

Key rules:
- Track `loadingMore` separately from the initial `loading`.
- `fetchMore` appends to the existing array; it never replaces.
- Expose `setMessages` so real-time handlers can prepend incoming messages.
- Guard `fetchMore` with `if (!nextCursor || loadingMore) return`.

### 3. Single Resource Hook

Use when fetching a single item by ID.

```typescript
export function useCustomer(customerId: string) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<Customer>(
        `/api/customers/${customerId}`
      );
      setCustomer(response.data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load customer";
      setError(message);
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [customerId, toast]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { customer, loading, error, refetch: fetch };
}
```

Name the returned data field after the resource (`customer`, not `data`).

### 4. Mutation Hook

Use for create, update, and delete operations. Return an `execute` function
that the caller invokes on form submit or button click.

```typescript
interface CreateTemplateInput {
  name: string;
  language: string;
  category: string;
  components: TemplateComponent[];
}

export function useCreateTemplate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const execute = useCallback(
    async (input: CreateTemplateInput): Promise<Template | null> => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.post<Template>("/api/templates", input);
        toast({ title: "Success", description: "Template created" });
        return response.data;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to create template";
        setError(message);
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  return { execute, loading, error };
}
```

Key rules:
- `loading` defaults to `false` (no initial fetch).
- `execute` returns the created/updated resource or `null` on failure.
- Show a success toast after mutation completes.
- For delete mutations, return `boolean` instead of the resource.

#### Optimistic Updates

When a mutation modifies a list that is already loaded, accept a callback:

```typescript
export function useDeleteCustomer(
  onSuccess?: (deletedId: string) => void
) {
  // ...
  const execute = useCallback(async (customerId: string) => {
    try {
      setLoading(true);
      await api.delete(`/api/customers/${customerId}`);
      onSuccess?.(customerId);
      toast({ title: "Success", description: "Customer deleted" });
      return true;
    } catch (err: unknown) {
      // error handling
      return false;
    } finally {
      setLoading(false);
    }
  }, [onSuccess, toast]);

  return { execute, loading, error };
}
```

The calling component passes `onSuccess` to remove the item from local state
before refetching.

### 5. Real-Time Hook (API + Socket.io)

Combine an initial API fetch with a Socket.io listener so the UI updates
instantly when the server pushes events.

```typescript
export function useConversationMessagesRealtime(conversationId: string) {
  const {
    messages,
    loading,
    loadingMore,
    hasMore,
    error,
    fetchMore,
    refetch,
    setMessages,
  } = useConversationMessages(conversationId);

  useEffect(() => {
    function handleNewMessage(message: Message) {
      if (message.conversationId === conversationId) {
        setMessages((prev) => [message, ...prev]);
      }
    }

    socket.on("message:received", handleNewMessage);
    socket.on("message:sent", handleNewMessage);

    return () => {
      socket.off("message:received", handleNewMessage);
      socket.off("message:sent", handleNewMessage);
    };
  }, [conversationId, setMessages]);

  return { messages, loading, loadingMore, hasMore, error, fetchMore, refetch };
}
```

Key rules:
- Compose on top of the base fetch hook; do not duplicate fetch logic.
- Always clean up listeners in the `useEffect` return function.
- Filter incoming events by the relevant ID (conversation, customer, etc.)
  to avoid updating the wrong view.
- Use `setMessages` (exposed by the base hook) to merge real-time data.
- Prepend new items for chronological feeds; append for reverse-chronological.

## Socket.io Event Naming

Follow the `resource:action` pattern for event names:

| Event                  | Payload       | Use case                          |
|------------------------|---------------|-----------------------------------|
| `message:received`    | `Message`     | Incoming WhatsApp message         |
| `message:sent`        | `Message`     | Outgoing message confirmation     |
| `message:status`      | `StatusUpdate`| Delivery/read receipt             |
| `conversation:updated`| `Conversation`| Conversation metadata changed     |
| `customer:created`    | `Customer`    | New customer from Shopify webhook  |

## Error Handling Rules

1. Catch errors as `unknown`. Narrow with `err instanceof Error`.
2. Extract Axios error details when available:
   ```typescript
   import { isAxiosError } from "axios";

   // inside catch block
   let message = "An unexpected error occurred";
   if (isAxiosError(err)) {
     message = err.response?.data?.message ?? err.message;
   } else if (err instanceof Error) {
     message = err.message;
   }
   ```
3. Always call `toast()` with `variant: "destructive"` for errors.
4. Always call `setError(message)` so the component can render inline errors.
5. Never swallow errors silently.

## Generation Checklist

When generating a hook, verify:

- [ ] File placed in `client/src/hooks/` with `use-<resource>.ts` naming
- [ ] One hook per file
- [ ] All types defined or imported (no `any`)
- [ ] `useCallback` wraps async functions with correct dependency array
- [ ] `useEffect` triggers initial fetch with `[fetch]` dependency
- [ ] `loading`, `error`, and `refetch` are always returned
- [ ] Errors caught, toasted, and stored in state
- [ ] Socket.io listeners cleaned up in effect return
- [ ] `async/await` used (no `.then()` chains)
- [ ] Named export (not default export)
