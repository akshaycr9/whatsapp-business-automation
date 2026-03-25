---
name: socket-event-handler
description: >
  Add Socket.io event handling on the client side for real-time updates in the
  Qwertees WhatsApp Automation project. Covers typed event payloads, React hooks
  with proper cleanup, server-side emission, and reconnection handling.
  Triggers on: "listen for", "real-time", "socket event", "add socket listener",
  "websocket", "live updates", "subscribe to events", "socket hook".
---

# Socket Event Handler Skill

Wire up Socket.io event listeners on the React client and emit events from the Express server.

## Socket Client Singleton

The singleton lives at `client/src/lib/socket.ts`. Initialize it once and reuse everywhere.

```typescript
// client/src/lib/socket.ts
import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const socket: Socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10000,
  transports: ["websocket", "polling"],
});

export default socket;
```

Rules:
- Never create a second `io()` call. Import this singleton wherever needed.
- Do not store the socket instance in React state or context. Import it directly.
- The singleton connects on import. Disconnect only on app unmount if needed.

## Event Typing

Define all event payload interfaces in a shared types file at `client/src/types/socket-events.ts`. Keep server and client types in sync manually (no shared package in this monorepo).

```typescript
// client/src/types/socket-events.ts

export interface NewMessagePayload {
  id: string;
  conversationId: string;
  customerPhone: string;
  direction: "INBOUND" | "OUTBOUND";
  body: string;
  mediaUrl: string | null;
  mediaType: string | null;
  timestamp: string; // ISO 8601
  wamid: string;
}

export interface MessageStatusUpdatePayload {
  wamid: string;
  conversationId: string;
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: string;
  errorCode: string | null;
}

export interface AutomationTriggeredPayload {
  automationType: "abandoned_cart" | "order_confirmation" | "shipping_update";
  customerPhone: string;
  customerName: string;
  templateName: string;
  triggeredAt: string;
  metadata: Record<string, unknown>;
}

export interface ConversationUpdatedPayload {
  id: string;
  customerPhone: string;
  customerName: string;
  lastMessageBody: string;
  lastMessageAt: string;
  unreadCount: number;
}
```

Rules:
- Never use `any` for payloads. Define an interface for every event.
- Timestamps are ISO 8601 strings. Parse them on the client when needed.
- Phone numbers are E.164 without the `+` prefix (e.g., `"919876543210"`).

## Event Names

Use these constants to avoid typos. Place them in the same file as the payload types.

```typescript
// client/src/types/socket-events.ts (append to the file above)

export const SOCKET_EVENTS = {
  NEW_MESSAGE: "new_message",
  MESSAGE_STATUS_UPDATE: "message_status_update",
  AUTOMATION_TRIGGERED: "automation_triggered",
  CONVERSATION_UPDATED: "conversation_updated",
} as const;

export type SocketEventName = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
```

## useSocket Hook Pattern

Create reusable hooks in `client/src/hooks/`. Every hook that subscribes to socket events must follow this pattern.

```typescript
// client/src/hooks/use-socket-event.ts
import { useEffect } from "react";
import socket from "@/lib/socket";

export function useSocketEvent<T>(
  event: string,
  handler: (payload: T) => void
): void {
  useEffect(() => {
    socket.on(event, handler);

    return () => {
      socket.off(event, handler);
    };
  }, [event, handler]);
}
```

Rules:
- Always return a cleanup function from `useEffect` that calls `socket.off`.
- Pass the same function reference to `on` and `off`. Wrap the handler in `useCallback` at the call site.
- Never subscribe to events outside of `useEffect`.
- Never call `socket.on` in a render body, event handler, or `useMemo`.

### Consuming the Generic Hook

```typescript
import { useCallback } from "react";
import { useSocketEvent } from "@/hooks/use-socket-event";
import { NewMessagePayload, SOCKET_EVENTS } from "@/types/socket-events";

function MyComponent() {
  const handleNewMessage = useCallback((payload: NewMessagePayload) => {
    // Update state here
  }, []);

  useSocketEvent<NewMessagePayload>(SOCKET_EVENTS.NEW_MESSAGE, handleNewMessage);
}
```

## Server-Side Emission Pattern

Emit events from services after successful database writes. Access the `io` instance through a module-level getter.

### Socket Server Setup

```typescript
// server/src/socket/index.ts
import { Server as HttpServer } from "http";
import { Server as SocketServer } from "socket.io";

let io: SocketServer | null = null;

export function initializeSocket(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.info(`Client connected: ${socket.id}`);

    socket.on("disconnect", () => {
      console.info(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): SocketServer {
  if (!io) {
    throw new Error("Socket.io not initialized. Call initializeSocket first.");
  }
  return io;
}
```

### Emitting from Services

```typescript
// server/src/services/message.service.ts
import { getIO } from "../socket";
import { SOCKET_EVENTS } from "../types/socket-events";

export async function handleIncomingMessage(
  webhookPayload: WebhookMessage
): Promise<void> {
  // 1. Write to database first
  const message = await prisma.message.create({ data: { /* ... */ } });

  // 2. Update conversation
  const conversation = await prisma.conversation.update({
    where: { id: message.conversationId },
    data: { lastMessageAt: message.timestamp, unreadCount: { increment: 1 } },
  });

  // 3. Emit AFTER successful writes
  const io = getIO();
  io.emit(SOCKET_EVENTS.NEW_MESSAGE, {
    id: message.id,
    conversationId: message.conversationId,
    customerPhone: message.customerPhone,
    direction: message.direction,
    body: message.body,
    mediaUrl: message.mediaUrl,
    mediaType: message.mediaType,
    timestamp: message.timestamp.toISOString(),
    wamid: message.wamid,
  });

  io.emit(SOCKET_EVENTS.CONVERSATION_UPDATED, {
    id: conversation.id,
    customerPhone: conversation.customerPhone,
    customerName: conversation.customerName,
    lastMessageBody: message.body,
    lastMessageAt: conversation.lastMessageAt.toISOString(),
    unreadCount: conversation.unreadCount,
  });
}
```

Rules:
- Always emit after the database write succeeds, never before.
- Emit to all connected clients with `io.emit()`. This is a single-user app, no rooms needed.
- Serialize dates to ISO 8601 strings before emitting.
- Never emit from route handlers. Keep emission in services.

## Reconnection Handling

When the socket reconnects after a disconnect, the client may have missed events. Fetch fresh data from the API to re-sync.

```typescript
// client/src/hooks/use-socket-reconnect.ts
import { useEffect } from "react";
import socket from "@/lib/socket";

export function useSocketReconnect(onReconnect: () => void): void {
  useEffect(() => {
    const handler = () => {
      console.info("Socket reconnected, re-syncing data");
      onReconnect();
    };

    socket.on("connect", handler);

    return () => {
      socket.off("connect", handler);
    };
  }, [onReconnect]);
}
```

Usage in a page component:

```typescript
import { useCallback } from "react";
import { useSocketReconnect } from "@/hooks/use-socket-reconnect";

function ConversationsPage() {
  const fetchConversations = useCallback(async () => {
    const response = await api.get("/api/conversations");
    setConversations(response.data);
  }, []);

  // Re-fetch full list on reconnect to catch missed updates
  useSocketReconnect(fetchConversations);
}
```

Rules:
- Re-fetch the full resource list on reconnect, not just the delta.
- Do not attempt to track missed events. A full fetch is simpler and reliable.
- Wrap the reconnect callback in `useCallback` to avoid re-subscribing on every render.

## App-Specific Event Patterns

### New Incoming Message

Update both the conversation list and the active message thread.

```typescript
// In a conversations page or layout component:
const handleNewMessage = useCallback(
  (payload: NewMessagePayload) => {
    // Update message list if viewing this conversation
    if (activeConversationId === payload.conversationId) {
      setMessages((prev) => [...prev, payload]);
    }

    // Update conversation sidebar (last message preview, unread count)
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === payload.conversationId
          ? {
              ...conv,
              lastMessageBody: payload.body,
              lastMessageAt: payload.timestamp,
              unreadCount:
                activeConversationId === payload.conversationId
                  ? 0
                  : conv.unreadCount + 1,
            }
          : conv
      )
    );
  },
  [activeConversationId]
);
```

### Message Status Update (Tick Marks)

Map status to tick mark display: `sent` = single grey tick, `delivered` = double grey ticks, `read` = double blue ticks, `failed` = red error icon.

```typescript
const handleStatusUpdate = useCallback(
  (payload: MessageStatusUpdatePayload) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.wamid === payload.wamid
          ? { ...msg, status: payload.status }
          : msg
      )
    );
  },
  []
);
```

### Automation Triggered

Show a toast notification. Do not update any list state.

```typescript
import { useToast } from "@/components/ui/use-toast";

const { toast } = useToast();

const handleAutomation = useCallback(
  (payload: AutomationTriggeredPayload) => {
    toast({
      title: "Automation Sent",
      description: `${payload.templateName} sent to ${payload.customerName}`,
    });
  },
  [toast]
);
```

### Conversation Updated

Re-sort the conversation sidebar so the most recently active conversation appears first.

```typescript
const handleConversationUpdated = useCallback(
  (payload: ConversationUpdatedPayload) => {
    setConversations((prev) => {
      const updated = prev.map((conv) =>
        conv.id === payload.id ? { ...conv, ...payload } : conv
      );
      return updated.sort(
        (a, b) =>
          new Date(b.lastMessageAt).getTime() -
          new Date(a.lastMessageAt).getTime()
      );
    });
  },
  []
);
```

## Complete Example: useConversationSocket Hook

A single hook that handles all conversation-related socket events.

```typescript
// client/src/hooks/use-conversation-socket.ts
import { useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useSocketEvent } from "@/hooks/use-socket-event";
import { useSocketReconnect } from "@/hooks/use-socket-reconnect";
import {
  SOCKET_EVENTS,
  NewMessagePayload,
  MessageStatusUpdatePayload,
  AutomationTriggeredPayload,
  ConversationUpdatedPayload,
} from "@/types/socket-events";
import type { Conversation, Message } from "@/types/models";

interface UseConversationSocketParams {
  activeConversationId: string | null;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  refetchConversations: () => Promise<void>;
}

export function useConversationSocket({
  activeConversationId,
  setMessages,
  setConversations,
  refetchConversations,
}: UseConversationSocketParams): void {
  const { toast } = useToast();

  // --- New message: append to thread + update sidebar ---
  const handleNewMessage = useCallback(
    (payload: NewMessagePayload) => {
      if (activeConversationId === payload.conversationId) {
        setMessages((prev) => [...prev, payload]);
      }

      setConversations((prev) =>
        prev
          .map((conv) =>
            conv.id === payload.conversationId
              ? {
                  ...conv,
                  lastMessageBody: payload.body,
                  lastMessageAt: payload.timestamp,
                  unreadCount:
                    activeConversationId === payload.conversationId
                      ? 0
                      : conv.unreadCount + 1,
                }
              : conv
          )
          .sort(
            (a, b) =>
              new Date(b.lastMessageAt).getTime() -
              new Date(a.lastMessageAt).getTime()
          )
      );
    },
    [activeConversationId, setMessages, setConversations]
  );

  // --- Status update: update tick marks ---
  const handleStatusUpdate = useCallback(
    (payload: MessageStatusUpdatePayload) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.wamid === payload.wamid
            ? { ...msg, status: payload.status }
            : msg
        )
      );
    },
    [setMessages]
  );

  // --- Automation triggered: toast notification ---
  const handleAutomation = useCallback(
    (payload: AutomationTriggeredPayload) => {
      toast({
        title: "Automation Sent",
        description: `${payload.templateName} sent to ${payload.customerName}`,
      });
    },
    [toast]
  );

  // --- Conversation updated: merge + re-sort ---
  const handleConversationUpdated = useCallback(
    (payload: ConversationUpdatedPayload) => {
      setConversations((prev) => {
        const exists = prev.some((conv) => conv.id === payload.id);

        const updated = exists
          ? prev.map((conv) =>
              conv.id === payload.id ? { ...conv, ...payload } : conv
            )
          : [...prev, payload as unknown as Conversation];

        return updated.sort(
          (a, b) =>
            new Date(b.lastMessageAt).getTime() -
            new Date(a.lastMessageAt).getTime()
        );
      });
    },
    [setConversations]
  );

  // --- Subscribe ---
  useSocketEvent<NewMessagePayload>(
    SOCKET_EVENTS.NEW_MESSAGE,
    handleNewMessage
  );
  useSocketEvent<MessageStatusUpdatePayload>(
    SOCKET_EVENTS.MESSAGE_STATUS_UPDATE,
    handleStatusUpdate
  );
  useSocketEvent<AutomationTriggeredPayload>(
    SOCKET_EVENTS.AUTOMATION_TRIGGERED,
    handleAutomation
  );
  useSocketEvent<ConversationUpdatedPayload>(
    SOCKET_EVENTS.CONVERSATION_UPDATED,
    handleConversationUpdated
  );

  // --- Reconnect: full re-fetch ---
  useSocketReconnect(refetchConversations);
}
```

### Using the Hook in a Page

```typescript
// client/src/pages/ConversationsPage.tsx
import { useState, useCallback } from "react";
import { useConversationSocket } from "@/hooks/use-conversation-socket";
import api from "@/lib/api";

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const refetchConversations = useCallback(async () => {
    const response = await api.get("/api/conversations");
    setConversations(response.data);
  }, []);

  useConversationSocket({
    activeConversationId,
    setMessages,
    setConversations,
    refetchConversations,
  });

  // ... render UI
}
```

## Anti-Patterns

### Never subscribe without cleanup

```typescript
// BAD: listener leaks on every render / remount
useEffect(() => {
  socket.on("new_message", handler);
}, []);

// GOOD: always return cleanup
useEffect(() => {
  socket.on("new_message", handler);
  return () => {
    socket.off("new_message", handler);
  };
}, [handler]);
```

### Never use untyped payloads

```typescript
// BAD: no type safety, bugs hide until runtime
socket.on("new_message", (data: any) => { /* ... */ });

// GOOD: typed payload caught at compile time
socket.on("new_message", (data: NewMessagePayload) => { /* ... */ });
```

### Never update state outside React lifecycle

```typescript
// BAD: updating component state from a module-level listener
socket.on("new_message", (data) => {
  globalMessages.push(data); // not reactive, React won't re-render
});

// GOOD: use setState inside a useEffect-registered handler
const handler = useCallback((data: NewMessagePayload) => {
  setMessages((prev) => [...prev, data]);
}, []);
```

### Never create duplicate handler references

```typescript
// BAD: new function on every render, socket.off won't match
useEffect(() => {
  const handler = (data: NewMessagePayload) => { /* ... */ };
  socket.on("new_message", handler);
  return () => socket.off("new_message", handler);
}); // missing dependency array = runs every render

// GOOD: stable reference via useCallback + proper deps
const handler = useCallback((data: NewMessagePayload) => {
  setMessages((prev) => [...prev, data]);
}, []);

useEffect(() => {
  socket.on("new_message", handler);
  return () => socket.off("new_message", handler);
}, [handler]);
```

### Never emit from route handlers

```typescript
// BAD: emission logic in the route
router.post("/messages", async (req, res, next) => {
  const message = await createMessage(req.body);
  getIO().emit("new_message", message); // should be in service
  res.json(message);
});

// GOOD: service handles both DB write and emission
router.post("/messages", async (req, res, next) => {
  const message = await createMessage(req.body); // emits internally
  res.json(message);
});
```

## Checklist Before Generating

When adding a new socket event handler, verify:

1. The event payload interface is defined in `client/src/types/socket-events.ts`.
2. The event name constant is added to `SOCKET_EVENTS`.
3. The handler is wrapped in `useCallback` with correct dependencies.
4. The `useEffect` cleanup calls `socket.off` with the same handler reference.
5. Server-side emission happens after the database write, inside the service.
6. Dates are serialized as ISO 8601 strings in the emitted payload.
7. The corresponding server-side event name matches the client constant exactly.
8. Reconnection logic re-fetches full data rather than attempting delta sync.
9. Toast notifications use shadcn/ui `useToast`, not `window.alert` or custom modals.
10. No `any` types appear in event payloads or handlers.
