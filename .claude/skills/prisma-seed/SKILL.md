---
description: Generate Prisma seed data for the Qwertees WhatsApp Automation project. Use when asked to "seed database", "add test data", "seed", "sample data", or "dev data".
---

# Prisma Seed Data Generator

Generate or update the seed file at `server/prisma/seed.ts` with realistic test data for local development.

## Seed File Structure

Use this skeleton for every seed file:

```ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 1. Clean up existing data (respect foreign key order)
  await prisma.automationLog.deleteMany();
  await prisma.checkoutTracker.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.automation.deleteMany();
  await prisma.template.deleteMany();
  await prisma.customer.deleteMany();

  // 2. Seed each model (see sections below)
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

## package.json Configuration

Ensure `server/package.json` contains:

```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

If the project uses `tsx`, prefer:

```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

## Running Seeds

```bash
cd server && npx prisma db seed
```

## Idempotent Seeding with Upserts

Use `upsert` to avoid duplicates on repeated runs. Identify records by their natural key (phone number for customers, WABAId for templates, etc.):

```ts
const customer = await prisma.customer.upsert({
  where: { phone: "919876543210" },
  update: {},
  create: { phone: "919876543210", name: "Rahul Sharma" },
});
```

Apply this pattern to every model. When a natural unique key is unavailable, use `deleteMany` followed by `createMany` as shown in the skeleton above.

## Seed Data Patterns

### Customers

Use realistic Indian names and phone numbers in E.164 without the `+` prefix. Keep 5-8 customers:

```ts
const customers = [
  { phone: "919876543210", name: "Rahul Sharma", shopifyCustomerId: "7000000001" },
  { phone: "919823456789", name: "Priya Patel", shopifyCustomerId: "7000000002" },
  { phone: "918765432109", name: "Amit Kumar", shopifyCustomerId: "7000000003" },
  { phone: "919988776655", name: "Sneha Reddy", shopifyCustomerId: "7000000004" },
  { phone: "919112233445", name: "Vikram Singh", shopifyCustomerId: "7000000005" },
  { phone: "918899001122", name: "Ananya Desai", shopifyCustomerId: "7000000006" },
];
```

### Templates

Cover all categories and statuses. Use positional variables `{{1}}`, `{{2}}`:

```ts
const templates = [
  {
    name: "order_confirmation",
    wabaId: "seed_order_confirm_001",
    language: "en",
    category: "UTILITY",
    status: "APPROVED",
    components: JSON.stringify([
      { type: "BODY", text: "Hi {{1}}, your order #{{2}} is confirmed! Total: Rs. {{3}}." },
    ]),
  },
  {
    name: "cod_order_confirmation",
    wabaId: "seed_cod_confirm_001",
    language: "en",
    category: "UTILITY",
    status: "APPROVED",
    components: JSON.stringify([
      { type: "BODY", text: "Hi {{1}}, your COD order #{{2}} is placed. Keep Rs. {{3}} ready." },
    ]),
  },
  {
    name: "order_shipped",
    wabaId: "seed_order_shipped_001",
    language: "en",
    category: "UTILITY",
    status: "APPROVED",
    components: JSON.stringify([
      { type: "BODY", text: "Hi {{1}}, order #{{2}} has been shipped! Track: {{3}}" },
    ]),
  },
  {
    name: "abandoned_cart_reminder",
    wabaId: "seed_abandoned_cart_001",
    language: "en",
    category: "MARKETING",
    status: "APPROVED",
    components: JSON.stringify([
      { type: "BODY", text: "Hey {{1}}, you left something in your cart! Complete your order: {{2}}" },
    ]),
  },
  {
    name: "new_arrivals",
    wabaId: "seed_new_arrivals_001",
    language: "en",
    category: "MARKETING",
    status: "PENDING",
    components: JSON.stringify([
      { type: "BODY", text: "Hi {{1}}, check out our latest t-shirt designs at Qwertees!" },
    ]),
  },
];
```

### Conversations

One conversation per customer. Set `lastMessageAt` to staggered recent timestamps:

```ts
const conversation = await prisma.conversation.create({
  data: {
    customerId: customer.id,
    lastMessageAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
});
```

### Messages

Mix inbound customer messages and outbound template/text messages. Use realistic message types:

```ts
const messages = [
  {
    conversationId: conversation.id,
    wamid: "wamid.seed_001",
    direction: "OUTBOUND",
    type: "TEMPLATE",
    body: "Hi Rahul, your order #1042 is confirmed! Total: Rs. 899.",
    status: "DELIVERED",
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
  },
  {
    conversationId: conversation.id,
    wamid: "wamid.seed_002",
    direction: "INBOUND",
    type: "TEXT",
    body: "When will my order arrive?",
    status: "RECEIVED",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    conversationId: conversation.id,
    wamid: "wamid.seed_003",
    direction: "OUTBOUND",
    type: "TEXT",
    body: "Hi Rahul! Your order should arrive in 3-5 business days.",
    status: "READ",
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
  },
];
```

### Automations

Link templates to Shopify events:

```ts
const automations = [
  { shopifyEvent: "PREPAID_ORDER_CONFIRMED", templateId: template.id, isActive: true, delayMinutes: 0 },
  { shopifyEvent: "COD_ORDER_CONFIRMED", templateId: codTemplate.id, isActive: true, delayMinutes: 0 },
  { shopifyEvent: "ORDER_FULFILLED", templateId: shippedTemplate.id, isActive: true, delayMinutes: 0 },
  { shopifyEvent: "ABANDONED_CART", templateId: cartTemplate.id, isActive: true, delayMinutes: 60 },
];
```

### AutomationLogs

Record a few successful and failed sends:

```ts
const logs = [
  {
    automationId: automation.id,
    customerId: customer.id,
    shopifyEvent: "PREPAID_ORDER_CONFIRMED",
    shopifyPayload: JSON.stringify({ orderId: "5000000001", orderNumber: "1042" }),
    status: "SUCCESS",
    messageId: message.id,
  },
  {
    automationId: automation.id,
    customerId: customer2.id,
    shopifyEvent: "ABANDONED_CART",
    shopifyPayload: JSON.stringify({ checkoutId: "6000000001" }),
    status: "FAILED",
    errorMessage: "24-hour window expired, template required",
    messageId: null,
  },
];
```

### CheckoutTrackers

Track abandoned checkout state:

```ts
const trackers = [
  {
    shopifyCheckoutId: "6000000001",
    customerId: customer.id,
    checkoutPayload: JSON.stringify({ lineItems: [{ title: "Retro Gaming Tee", quantity: 1 }] }),
    status: "ABANDONED",
    scheduledAt: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    shopifyCheckoutId: "6000000002",
    customerId: customer2.id,
    checkoutPayload: JSON.stringify({ lineItems: [{ title: "Minimalist Logo Tee", quantity: 2 }] }),
    status: "COMPLETED",
    scheduledAt: new Date(Date.now() - 90 * 60 * 1000),
    completedAt: new Date(Date.now() - 60 * 60 * 1000),
  },
];
```

## Rules

- Always check the Prisma schema (`server/prisma/schema.prisma`) for the current model fields before generating seed data. Do not assume field names from this skill alone.
- Use `upsert` when the model has a suitable unique field. Fall back to `deleteMany` + `createMany` otherwise.
- Store phone numbers as `"91XXXXXXXXXX"` (E.164 without `+`).
- Store JSON fields (components, payloads) with `JSON.stringify()`.
- Generate 5-8 customers, 4-6 templates, and 2-3 messages per conversation for a useful but fast seed.
- Never seed production credentials or real API keys.
- Keep `wamid` values prefixed with `wamid.seed_` so they are visually distinct from real WhatsApp message IDs.
