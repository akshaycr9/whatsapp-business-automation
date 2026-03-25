---
name: prisma-query-builder
description: Write complex Prisma queries for the Qwertees WhatsApp Automation project. Use when users want to query, prisma query, fetch data, database query, paginate, filter, search, aggregate, count, group by, sort, order, join, include relations, select fields, cursor pagination, offset pagination, transaction, or build any database read/write operation.
---

# Prisma Query Builder

Write performant, type-safe Prisma queries for the Qwertees WhatsApp Automation project. Never write raw SQL. Always use the Prisma client.

## Prerequisites

Read `server/prisma/schema.prisma` before writing any query to confirm current model names, field names, relations, and enums.

## Key Models Reference

- **Customer** — phone (unique, E.164 without +), name, shopifyCustomerId
- **Conversation** — 1:1 with Customer, has many Messages, lastMessageAt, status
- **Message** — belongs to Conversation, wamId (WhatsApp message ID), direction (INBOUND/OUTBOUND), type, content, status, templateId, createdAt
- **Template** — name, language, category, status, components (JSON), wabaTemplateId
- **Automation** — event (e.g., ORDER_CONFIRMED, ABANDONED_CART), templateId, active
- **AutomationLog** — automationId, customerId, shopifyEventId, status, sentAt
- **CheckoutTracker** — shopifyCheckoutId, customerId, status, abandonedAt

## 1. Basic CRUD

### Create

```typescript
const customer = await prisma.customer.create({
  data: {
    phone: "919876543210",
    name: "Akshay",
    shopifyCustomerId: "gid://shopify/Customer/123",
  },
});
```

### Read (findUnique / findFirst / findMany)

```typescript
// By unique field
const customer = await prisma.customer.findUnique({
  where: { phone: "919876543210" },
});

// First match
const conversation = await prisma.conversation.findFirst({
  where: { customerId: customer.id },
});

// Multiple records
const templates = await prisma.template.findMany({
  where: { status: "APPROVED" },
});
```

### Update

```typescript
const updated = await prisma.conversation.update({
  where: { id: conversationId },
  data: { lastMessageAt: new Date() },
});
```

### Upsert (prefer for webhook-driven data)

```typescript
const customer = await prisma.customer.upsert({
  where: { phone: "919876543210" },
  create: {
    phone: "919876543210",
    name: "Akshay",
    shopifyCustomerId: "gid://shopify/Customer/123",
  },
  update: {
    name: "Akshay",
    shopifyCustomerId: "gid://shopify/Customer/123",
  },
});
```

### Delete

```typescript
await prisma.automationLog.delete({
  where: { id: logId },
});
```

## 2. Relation Queries

### include (load full related records)

```typescript
const conversation = await prisma.conversation.findUnique({
  where: { id: conversationId },
  include: {
    customer: true,
    messages: {
      orderBy: { createdAt: "desc" },
      take: 1,
    },
  },
});
```

### select (pick specific fields — reduces payload)

```typescript
const conversations = await prisma.conversation.findMany({
  select: {
    id: true,
    lastMessageAt: true,
    customer: {
      select: { name: true, phone: true },
    },
  },
});
```

### Nested includes (avoid going deeper than 2 levels)

```typescript
const conversation = await prisma.conversation.findUnique({
  where: { id: conversationId },
  include: {
    customer: true,
    messages: {
      include: { template: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    },
  },
});
```

**Rule**: Do not mix `include` and `select` at the same level. Use one or the other.

## 3. Filtering

### Basic where

```typescript
const active = await prisma.automation.findMany({
  where: { active: true, event: "ABANDONED_CART" },
});
```

### AND / OR / NOT

```typescript
const results = await prisma.customer.findMany({
  where: {
    AND: [
      { name: { not: null } },
      {
        OR: [
          { phone: { startsWith: "91" } },
          { phone: { startsWith: "44" } },
        ],
      },
    ],
  },
});
```

### Text search (contains — case-insensitive with mode)

```typescript
const customers = await prisma.customer.findMany({
  where: {
    OR: [
      { name: { contains: searchTerm, mode: "insensitive" } },
      { phone: { contains: searchTerm, mode: "insensitive" } },
    ],
  },
});
```

### Date ranges

```typescript
const recentMessages = await prisma.message.findMany({
  where: {
    createdAt: {
      gte: new Date("2026-03-01"),
      lt: new Date("2026-04-01"),
    },
  },
});
```

### Filter on related records

```typescript
// Conversations that have at least one inbound message
const withInbound = await prisma.conversation.findMany({
  where: {
    messages: {
      some: { direction: "INBOUND" },
    },
  },
});
```

## 4. Pagination

### Cursor-based (use for messages — infinite scroll in chat)

Use `createdAt` + `id` compound cursor for stable ordering.

```typescript
interface CursorPaginationParams {
  conversationId: string;
  cursor?: { id: string; createdAt: Date };
  take?: number;
}

async function getMessages({ conversationId, cursor, take = 30 }: CursorPaginationParams) {
  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: take + 1, // fetch one extra to detect hasMore
    ...(cursor && {
      cursor: { id: cursor.id },
      skip: 1, // skip the cursor itself
    }),
  });

  const hasMore = messages.length > take;
  const data = hasMore ? messages.slice(0, take) : messages;
  const nextCursor = hasMore
    ? { id: data[data.length - 1].id, createdAt: data[data.length - 1].createdAt }
    : null;

  return { data, nextCursor, hasMore };
}
```

### Offset-based (use for admin tables — conversations, templates, customers)

```typescript
interface OffsetPaginationParams {
  page: number;
  pageSize: number;
  search?: string;
}

async function getCustomers({ page, pageSize, search }: OffsetPaginationParams) {
  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.customer.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
```

## 5. Sorting

### Single field

```typescript
const conversations = await prisma.conversation.findMany({
  orderBy: { lastMessageAt: "desc" },
});
```

### Multiple fields (applied in order)

```typescript
const messages = await prisma.message.findMany({
  where: { conversationId },
  orderBy: [
    { createdAt: "desc" },
    { id: "desc" },
  ],
});
```

### Sort on related field

```typescript
const conversations = await prisma.conversation.findMany({
  orderBy: {
    customer: { name: "asc" },
  },
  include: { customer: true },
});
```

## 6. Aggregation

### Count

```typescript
const totalCustomers = await prisma.customer.count();

const unreadCount = await prisma.message.count({
  where: {
    direction: "INBOUND",
    status: "DELIVERED",
    conversation: { status: "OPEN" },
  },
});
```

### groupBy (dashboard stats)

```typescript
// Messages sent per day over the last 7 days
const stats = await prisma.message.groupBy({
  by: ["direction"],
  _count: { id: true },
  where: {
    createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
  },
});

// Automation logs grouped by status
const logStats = await prisma.automationLog.groupBy({
  by: ["status"],
  _count: { id: true },
  where: {
    sentAt: {
      gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
  },
});
```

### Aggregate (sum, avg, min, max)

```typescript
const messageStats = await prisma.message.aggregate({
  _count: { id: true },
  _max: { createdAt: true },
  _min: { createdAt: true },
  where: { conversationId },
});
```

## 7. Transactions

Use `prisma.$transaction` when multiple writes must succeed or fail together.

### Sequential transaction (most common)

```typescript
// Create a message and update conversation's lastMessageAt atomically
const [message, conversation] = await prisma.$transaction([
  prisma.message.create({
    data: {
      conversationId,
      direction: "OUTBOUND",
      type: "TEMPLATE",
      content: "Order confirmed for #1234",
      status: "SENT",
      wamId: waMessageId,
      templateId,
    },
  }),
  prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: new Date() },
  }),
]);
```

### Interactive transaction (when later operations depend on earlier results)

```typescript
const result = await prisma.$transaction(async (tx) => {
  // Find or create customer
  const customer = await tx.customer.upsert({
    where: { phone },
    create: { phone, name },
    update: { name },
  });

  // Find or create conversation
  const conversation = await tx.conversation.upsert({
    where: { customerId: customer.id },
    create: { customerId: customer.id, lastMessageAt: new Date() },
    update: { lastMessageAt: new Date() },
  });

  // Create the message
  const message = await tx.message.create({
    data: {
      conversationId: conversation.id,
      direction: "INBOUND",
      type: "TEXT",
      content: messageBody,
      status: "RECEIVED",
      wamId,
    },
  });

  return { customer, conversation, message };
});
```

**Rule**: Keep transactions short. Do not call external APIs inside a transaction.

## 8. Performance Guidelines

### Select only needed fields

```typescript
// Bad — fetches all columns
const conversations = await prisma.conversation.findMany({
  include: { customer: true, messages: true },
});

// Good — fetches only what the UI needs
const conversations = await prisma.conversation.findMany({
  select: {
    id: true,
    lastMessageAt: true,
    status: true,
    customer: { select: { name: true, phone: true } },
    messages: {
      select: { content: true, direction: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 1,
    },
  },
});
```

### Avoid N+1 — use include/select with nested queries

```typescript
// Bad — N+1 problem
const conversations = await prisma.conversation.findMany();
for (const conv of conversations) {
  const messages = await prisma.message.findMany({
    where: { conversationId: conv.id },
  });
}

// Good — single query
const conversations = await prisma.conversation.findMany({
  include: {
    messages: {
      orderBy: { createdAt: "desc" },
      take: 1,
    },
  },
});
```

### Use indexes for frequently filtered/sorted fields

Add `@@index` in the schema for fields used in `where` and `orderBy`:
- `Message`: `@@index([conversationId, createdAt])` (chat pagination)
- `Customer`: `@@index([phone])` (lookup on webhook)
- `AutomationLog`: `@@index([shopifyEventId])` (idempotency check)
- `CheckoutTracker`: `@@index([shopifyCheckoutId])` (dedup)

### Limit results — always use `take`

Never call `findMany` without a `take` or `where` clause that naturally limits results. Unbounded queries risk memory issues.

## 9. App-Specific Query Patterns

### Conversation list with last message (sidebar)

```typescript
async function getConversationList(page: number, pageSize: number) {
  const [conversations, total] = await Promise.all([
    prisma.conversation.findMany({
      select: {
        id: true,
        status: true,
        lastMessageAt: true,
        customer: {
          select: { id: true, name: true, phone: true },
        },
        messages: {
          select: { content: true, direction: true, type: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { lastMessageAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.conversation.count(),
  ]);

  return { conversations, total, totalPages: Math.ceil(total / pageSize) };
}
```

### Chat messages with cursor pagination

```typescript
async function getChatMessages(conversationId: string, cursorId?: string) {
  const take = 30;

  const messages = await prisma.message.findMany({
    where: { conversationId },
    select: {
      id: true,
      direction: true,
      type: true,
      content: true,
      status: true,
      createdAt: true,
      template: { select: { name: true } },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: take + 1,
    ...(cursorId && { cursor: { id: cursorId }, skip: 1 }),
  });

  const hasMore = messages.length > take;
  const data = hasMore ? messages.slice(0, take) : messages;

  return {
    messages: data.reverse(), // chronological order for UI
    nextCursor: hasMore ? data[data.length - 1].id : null,
    hasMore,
  };
}
```

### Dashboard stats

```typescript
async function getDashboardStats() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [
    totalCustomers,
    activeConversations,
    messagesSent30d,
    messagesReceived30d,
    automationsSent24h,
    templateCount,
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.conversation.count({ where: { status: "OPEN" } }),
    prisma.message.count({
      where: { direction: "OUTBOUND", createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.message.count({
      where: { direction: "INBOUND", createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.automationLog.count({
      where: { status: "SENT", sentAt: { gte: twentyFourHoursAgo } },
    }),
    prisma.template.count({ where: { status: "APPROVED" } }),
  ]);

  return {
    totalCustomers,
    activeConversations,
    messagesSent30d,
    messagesReceived30d,
    automationsSent24h,
    templateCount,
  };
}
```

### Customer search with filters

```typescript
interface CustomerSearchParams {
  search?: string;
  hasConversation?: boolean;
  createdAfter?: Date;
  page: number;
  pageSize: number;
}

async function searchCustomers({
  search,
  hasConversation,
  createdAfter,
  page,
  pageSize,
}: CustomerSearchParams) {
  const where: Prisma.CustomerWhereInput = {
    AND: [
      ...(search
        ? [
            {
              OR: [
                { name: { contains: search, mode: "insensitive" as const } },
                { phone: { contains: search } },
              ],
            },
          ]
        : []),
      ...(hasConversation !== undefined
        ? [{ conversation: hasConversation ? { isNot: null } : { is: null } }]
        : []),
      ...(createdAfter ? [{ createdAt: { gte: createdAfter } }] : []),
    ],
  };

  const [data, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      select: {
        id: true,
        name: true,
        phone: true,
        shopifyCustomerId: true,
        createdAt: true,
        conversation: {
          select: { id: true, lastMessageAt: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.customer.count({ where }),
  ]);

  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
```

### Idempotency check for Shopify webhooks

```typescript
async function hasProcessedEvent(shopifyEventId: string): Promise<boolean> {
  const existing = await prisma.automationLog.findFirst({
    where: { shopifyEventId },
    select: { id: true },
  });
  return existing !== null;
}
```

### Abandoned cart lookup

```typescript
async function getPendingAbandonedCarts(cutoffMinutes: number) {
  const cutoff = new Date(Date.now() - cutoffMinutes * 60 * 1000);

  return prisma.checkoutTracker.findMany({
    where: {
      status: "PENDING",
      createdAt: { lte: cutoff },
    },
    include: {
      customer: {
        select: { phone: true, name: true },
      },
    },
  });
}
```

## 10. Checklist Before Writing a Query

1. Read `server/prisma/schema.prisma` to confirm field names and types.
2. Use `select` instead of `include` when the UI only needs a subset of fields.
3. Add `take` to every `findMany` call.
4. Use cursor-based pagination for messages, offset-based for admin tables.
5. Wrap multi-write operations in `prisma.$transaction`.
6. Check for existing indexes before adding `orderBy` on large tables.
7. Use `upsert` for webhook-driven data to handle duplicates gracefully.
8. Type the `where` input as `Prisma.<Model>WhereInput` for type safety on dynamic filters.
