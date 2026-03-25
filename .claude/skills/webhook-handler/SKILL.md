---
name: webhook-handler
description: >
  Creates webhook handler endpoints for Shopify and Meta WhatsApp Cloud API integrations.
  Activate when the user says "webhook", "add webhook", "handle shopify event",
  "handle meta event", "webhook endpoint", "shopify webhook", "meta webhook",
  "whatsapp webhook", "create webhook handler", or similar requests involving
  inbound webhook processing.
---

# Webhook Handler Generator

Generate webhook route and service files for the Qwertees WhatsApp Automation backend.
Webhook handlers differ from standard CRUD routes: they must respond immediately, verify
request authenticity, deduplicate events, and process payloads asynchronously. This skill
covers both Shopify and Meta WhatsApp Cloud API webhook sources.

## Core Principles

1. **Respond first, process later.** Always send `res.sendStatus(200)` before doing any
   real work. Shopify retries if it does not get a response within 5 seconds. Meta behaves
   similarly. Never let processing errors prevent the 200 response.

2. **Verify authenticity.** Shopify signs payloads with HMAC-SHA256. Meta signs with
   SHA-256. Always verify before processing. Use `crypto.timingSafeEqual` to prevent
   timing attacks.

3. **Deduplicate events.** Shopify can send the same webhook multiple times. Use the
   `X-Shopify-Webhook-Id` header as an idempotency key. For Meta, derive a key from
   the message ID or status timestamp.

4. **Capture raw body.** HMAC verification requires the raw request body. Capture it
   via the `verify` callback in `express.json()` before Express parses it.

## Step-by-Step Process

### 1. Determine the Webhook Source

Ask the user (or infer from context) which webhook source to handle:

| Source   | Route path                   | Verification method        |
|----------|------------------------------|----------------------------|
| Shopify  | `/api/webhooks/shopify`      | HMAC-SHA256 header         |
| Meta     | `/api/webhooks/meta`         | GET verification + SHA-256 |

Place all webhook routes in `server/src/routes/webhooks/`. Place matching services in
`server/src/services/`.

### 2. Set Up Raw Body Capture

The raw body must be available for HMAC verification. Configure this in the Express app
setup (e.g., `server/src/index.ts` or `server/src/app.ts`) BEFORE any route mounting.

```typescript
// server/src/index.ts (or app.ts)
import express from "express";

const app = express();

// Capture raw body for webhook signature verification.
// The verify callback runs before JSON parsing and attaches the raw buffer.
app.use(
  express.json({
    verify: (req: express.Request, _res, buf) => {
      // Attach raw body buffer to the request for downstream HMAC checks.
      (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
    },
  }),
);
```

Define the extended request type in a shared types file:

```typescript
// server/src/types/express.d.ts
import { Request } from "express";

export interface RawBodyRequest extends Request {
  rawBody?: Buffer;
}
```

### 3. Create the Shopify Webhook Handler

#### 3a. Shopify Verification Middleware

Place at `server/src/middleware/verify-shopify.ts`.

```typescript
import crypto from "node:crypto";
import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

interface RawBodyRequest extends Request {
  rawBody?: Buffer;
}

export function verifyShopifyWebhook(
  req: RawBodyRequest,
  res: Response,
  next: NextFunction,
): void {
  const hmacHeader = req.get("X-Shopify-Hmac-Sha256");

  if (!hmacHeader) {
    console.error("[Shopify Webhook] Missing HMAC header");
    res.status(401).json({ error: "Missing HMAC header" });
    return;
  }

  if (!req.rawBody) {
    console.error("[Shopify Webhook] Raw body not available");
    res.status(500).json({ error: "Raw body not captured" });
    return;
  }

  const computedHmac = crypto
    .createHmac("sha256", env.SHOPIFY_WEBHOOK_SECRET)
    .update(req.rawBody)
    .digest("base64");

  const hmacBuffer = Buffer.from(hmacHeader, "base64");
  const computedBuffer = Buffer.from(computedHmac, "base64");

  if (
    hmacBuffer.length !== computedBuffer.length ||
    !crypto.timingSafeEqual(hmacBuffer, computedBuffer)
  ) {
    console.error("[Shopify Webhook] HMAC verification failed");
    res.status(401).json({ error: "Invalid HMAC" });
    return;
  }

  next();
}
```

#### 3b. Shopify Webhook Route

Place at `server/src/routes/webhooks/shopify.webhook.routes.ts`.

```typescript
import { Router, Request, Response } from "express";
import { verifyShopifyWebhook } from "../../middleware/verify-shopify";
import * as shopifyWebhookService from "../../services/shopify-webhook.service";

interface RawBodyRequest extends Request {
  rawBody?: Buffer;
}

const router = Router();

// Apply HMAC verification to all Shopify webhook routes.
router.use(verifyShopifyWebhook);

router.post("/", async (req: RawBodyRequest, res: Response) => {
  // Respond immediately. Shopify requires a response within 5 seconds.
  res.sendStatus(200);

  // Extract routing info from headers.
  const topic = req.get("X-Shopify-Topic") ?? "unknown";
  const webhookId = req.get("X-Shopify-Webhook-Id") ?? "";
  const shopDomain = req.get("X-Shopify-Shop-Domain") ?? "";

  // Process asynchronously. Never let errors bubble up -- the 200 is already sent.
  shopifyWebhookService
    .processShopifyWebhook({
      topic,
      webhookId,
      shopDomain,
      payload: req.body,
    })
    .catch((err) => {
      console.error(
        `[Shopify Webhook] Processing failed for ${topic} (${webhookId}):`,
        err,
      );
    });
});

export default router;
```

#### 3c. Shopify Webhook Service

Place at `server/src/services/shopify-webhook.service.ts`.

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// -- Types ------------------------------------------------------------------

interface ShopifyWebhookEvent {
  topic: string;
  webhookId: string;
  shopDomain: string;
  payload: Record<string, unknown>;
}

// -- Idempotency ------------------------------------------------------------

async function isDuplicate(webhookId: string): Promise<boolean> {
  if (!webhookId) return false;

  const existing = await prisma.webhookEvent.findUnique({
    where: { externalId: webhookId },
  });

  return existing !== null;
}

async function recordWebhookEvent(
  webhookId: string,
  topic: string,
): Promise<void> {
  await prisma.webhookEvent.create({
    data: {
      externalId: webhookId,
      source: "SHOPIFY",
      topic,
    },
  });
}

// -- Event Routing ----------------------------------------------------------

export async function processShopifyWebhook(
  event: ShopifyWebhookEvent,
): Promise<void> {
  const { topic, webhookId, payload } = event;

  // Idempotency check: skip duplicates.
  if (await isDuplicate(webhookId)) {
    console.log(
      `[Shopify Webhook] Duplicate skipped: ${topic} (${webhookId})`,
    );
    return;
  }

  // Record event to prevent future duplicates.
  await recordWebhookEvent(webhookId, topic);

  // Route to the correct handler based on the Shopify topic.
  switch (topic) {
    case "orders/create":
      await handleOrderCreated(payload);
      break;
    case "orders/fulfilled":
      await handleOrderFulfilled(payload);
      break;
    case "checkouts/create":
      await handleCheckoutCreated(payload);
      break;
    case "customers/create":
      await handleCustomerCreated(payload);
      break;
    default:
      console.log(`[Shopify Webhook] Unhandled topic: ${topic}`);
  }
}

// -- Topic Handlers ---------------------------------------------------------

async function handleOrderCreated(
  payload: Record<string, unknown>,
): Promise<void> {
  console.log("[Shopify Webhook] Processing orders/create");
  // Extract order data, find or create customer, trigger WhatsApp template.
}

async function handleOrderFulfilled(
  payload: Record<string, unknown>,
): Promise<void> {
  console.log("[Shopify Webhook] Processing orders/fulfilled");
  // Extract fulfillment data, send shipping notification template.
}

async function handleCheckoutCreated(
  payload: Record<string, unknown>,
): Promise<void> {
  console.log("[Shopify Webhook] Processing checkouts/create");
  // Schedule abandoned cart message (60-minute delay via node-cron or setTimeout).
}

async function handleCustomerCreated(
  payload: Record<string, unknown>,
): Promise<void> {
  console.log("[Shopify Webhook] Processing customers/create");
  // Create or update customer record in local database.
}
```

### 4. Create the Meta Webhook Handler

#### 4a. Meta Verification Middleware

Place at `server/src/middleware/verify-meta.ts`.

```typescript
import crypto from "node:crypto";
import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

interface RawBodyRequest extends Request {
  rawBody?: Buffer;
}

export function verifyMetaSignature(
  req: RawBodyRequest,
  res: Response,
  next: NextFunction,
): void {
  const signature = req.get("X-Hub-Signature-256");

  if (!signature) {
    console.error("[Meta Webhook] Missing signature header");
    res.status(401).json({ error: "Missing signature" });
    return;
  }

  if (!req.rawBody) {
    console.error("[Meta Webhook] Raw body not available");
    res.status(500).json({ error: "Raw body not captured" });
    return;
  }

  const expectedSignature =
    "sha256=" +
    crypto
      .createHmac("sha256", env.META_APP_SECRET)
      .update(req.rawBody)
      .digest("hex");

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    sigBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    console.error("[Meta Webhook] Signature verification failed");
    res.status(401).json({ error: "Invalid signature" });
    return;
  }

  next();
}
```

#### 4b. Meta Webhook Route

Place at `server/src/routes/webhooks/meta.webhook.routes.ts`.

```typescript
import { Router, Request, Response } from "express";
import { env } from "../../config/env";
import { verifyMetaSignature } from "../../middleware/verify-meta";
import * as metaWebhookService from "../../services/meta-webhook.service";

interface RawBodyRequest extends Request {
  rawBody?: Buffer;
}

const router = Router();

// GET /api/webhooks/meta — Meta verification challenge.
// Meta sends a GET request when you register the webhook URL.
// Respond with the hub.challenge value if the verify token matches.
router.get("/", (req: Request, res: Response) => {
  const mode = req.query["hub.mode"] as string | undefined;
  const token = req.query["hub.verify_token"] as string | undefined;
  const challenge = req.query["hub.challenge"] as string | undefined;

  if (mode === "subscribe" && token === env.META_WEBHOOK_VERIFY_TOKEN) {
    console.log("[Meta Webhook] Verification successful");
    res.status(200).send(challenge);
    return;
  }

  console.error("[Meta Webhook] Verification failed — token mismatch");
  res.sendStatus(403);
});

// POST /api/webhooks/meta — Inbound events (messages, statuses, errors).
// Apply signature verification middleware only to POST.
router.post(
  "/",
  verifyMetaSignature,
  async (req: RawBodyRequest, res: Response) => {
    // Respond immediately. Meta will retry on timeout.
    res.sendStatus(200);

    // Process asynchronously.
    metaWebhookService.processMetaWebhook(req.body).catch((err) => {
      console.error("[Meta Webhook] Processing failed:", err);
    });
  },
);

export default router;
```

#### 4c. Meta Webhook Service

Place at `server/src/services/meta-webhook.service.ts`.

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// -- Types ------------------------------------------------------------------

interface MetaWebhookPayload {
  object: string;
  entry: MetaEntry[];
}

interface MetaEntry {
  id: string;
  changes: MetaChange[];
}

interface MetaChange {
  value: MetaChangeValue;
  field: string;
}

interface MetaChangeValue {
  messaging_product: string;
  metadata: {
    display_phone_number: string;
    phone_number_id: string;
  };
  contacts?: MetaContact[];
  messages?: MetaMessage[];
  statuses?: MetaStatus[];
  errors?: MetaError[];
}

interface MetaContact {
  profile: { name: string };
  wa_id: string;
}

interface MetaMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  image?: { id: string; mime_type: string; sha256: string; caption?: string };
  button?: { text: string; payload: string };
  interactive?: Record<string, unknown>;
}

interface MetaStatus {
  id: string;
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: string;
  recipient_id: string;
  errors?: MetaError[];
}

interface MetaError {
  code: number;
  title: string;
  message: string;
}

// -- Idempotency ------------------------------------------------------------

async function isMessageProcessed(messageId: string): Promise<boolean> {
  const existing = await prisma.webhookEvent.findUnique({
    where: { externalId: messageId },
  });
  return existing !== null;
}

async function recordProcessedMessage(messageId: string): Promise<void> {
  await prisma.webhookEvent.create({
    data: {
      externalId: messageId,
      source: "META",
      topic: "message",
    },
  });
}

// -- Payload Navigation -----------------------------------------------------

export async function processMetaWebhook(
  payload: MetaWebhookPayload,
): Promise<void> {
  if (payload.object !== "whatsapp_business_account") {
    console.log(`[Meta Webhook] Ignoring non-WhatsApp object: ${payload.object}`);
    return;
  }

  // Navigate the nested Meta payload structure.
  // Meta wraps everything: entry[] -> changes[] -> value -> messages[] / statuses[]
  for (const entry of payload.entry) {
    for (const change of entry.changes) {
      const value = change.value;

      // Handle inbound messages.
      if (value.messages && value.messages.length > 0) {
        for (const message of value.messages) {
          await handleInboundMessage(message, value.contacts ?? [], value.metadata);
        }
      }

      // Handle message status updates.
      if (value.statuses && value.statuses.length > 0) {
        for (const status of value.statuses) {
          await handleStatusUpdate(status);
        }
      }

      // Handle errors.
      if (value.errors && value.errors.length > 0) {
        for (const error of value.errors) {
          console.error(
            `[Meta Webhook] API error: ${error.code} — ${error.title}: ${error.message}`,
          );
        }
      }
    }
  }
}

// -- Message Handler --------------------------------------------------------

async function handleInboundMessage(
  message: MetaMessage,
  contacts: MetaContact[],
  metadata: { display_phone_number: string; phone_number_id: string },
): Promise<void> {
  // Idempotency: skip already-processed messages.
  if (await isMessageProcessed(message.id)) {
    console.log(`[Meta Webhook] Duplicate message skipped: ${message.id}`);
    return;
  }

  await recordProcessedMessage(message.id);

  // The sender phone number is in E.164 format without the + prefix.
  const senderPhone = message.from;
  const senderName =
    contacts.find((c) => c.wa_id === senderPhone)?.profile.name ?? "Unknown";

  console.log(
    `[Meta Webhook] Inbound ${message.type} from ${senderPhone} (${senderName})`,
  );

  // Route by message type.
  switch (message.type) {
    case "text":
      // Store message, update conversation, update 24h window timestamp.
      break;
    case "image":
      // Store media reference (Meta retains media for 30 days).
      break;
    case "button":
      // Handle quick-reply button taps.
      break;
    case "interactive":
      // Handle list replies or button replies.
      break;
    default:
      console.log(`[Meta Webhook] Unhandled message type: ${message.type}`);
  }
}

// -- Status Handler ---------------------------------------------------------

async function handleStatusUpdate(status: MetaStatus): Promise<void> {
  console.log(
    `[Meta Webhook] Status update: ${status.id} -> ${status.status}`,
  );

  // Update the message record in the database with the new delivery status.
  // Statuses progress: sent -> delivered -> read (or failed at any point).

  if (status.errors && status.errors.length > 0) {
    for (const error of status.errors) {
      console.error(
        `[Meta Webhook] Message ${status.id} failed: ${error.code} — ${error.title}`,
      );
    }
  }
}
```

### 5. Register Webhook Routes

Open the app entry point and mount both webhook routes:

```typescript
// server/src/index.ts (or app.ts)
import shopifyWebhookRouter from "./routes/webhooks/shopify.webhook.routes";
import metaWebhookRouter from "./routes/webhooks/meta.webhook.routes";

app.use("/api/webhooks/shopify", shopifyWebhookRouter);
app.use("/api/webhooks/meta", metaWebhookRouter);
```

Mount webhook routes AFTER the `express.json()` middleware with the `verify` callback
(Section 2) so that `req.rawBody` is populated.

### 6. Idempotency Table (Prisma Schema Addition)

Add a `WebhookEvent` model to track processed events:

```prisma
model WebhookEvent {
  id         String   @id @default(uuid())
  externalId String   @unique
  source     String   // "SHOPIFY" | "META"
  topic      String
  createdAt  DateTime @default(now())
}
```

Run `npx prisma migrate dev --name add-webhook-event` after adding the model.

### 7. Required Environment Variables

Verify these exist in `server/src/config/env.ts`:

| Variable                    | Purpose                                    |
|-----------------------------|--------------------------------------------|
| `SHOPIFY_WEBHOOK_SECRET`    | Shopify webhook HMAC signing secret        |
| `META_APP_SECRET`           | Meta app secret for signature verification |
| `META_WEBHOOK_VERIFY_TOKEN` | Token for Meta GET verification challenge  |

### 8. Pre-Generation Checklist

Before writing files, verify:

- [ ] Webhook source is confirmed (Shopify, Meta, or both).
- [ ] Raw body capture is configured in `express.json({ verify })`.
- [ ] Required env vars are defined in `server/src/config/env.ts`.
- [ ] `WebhookEvent` model exists in `prisma/schema.prisma` for idempotency.
- [ ] `server/src/routes/webhooks/` directory exists.

### 9. Post-Generation Checklist

After writing files:

- [ ] Verification middleware rejects requests with invalid/missing signatures.
- [ ] `crypto.timingSafeEqual` is used for all signature comparisons.
- [ ] Route responds with `res.sendStatus(200)` BEFORE any async processing.
- [ ] Async processing errors are caught and logged, never thrown.
- [ ] Duplicate events are detected and skipped via `WebhookEvent` lookup.
- [ ] Shopify topic routing uses `X-Shopify-Topic` header.
- [ ] Meta payload navigation handles the full nested structure.
- [ ] Phone numbers are stored without `+` prefix (E.164 format).
- [ ] All imports use ES modules. No `require()`.
- [ ] No `any` types. Interfaces defined for all payload shapes.
- [ ] Files are kebab-case. Route file ends with `.webhook.routes.ts`.
- [ ] Service file ends with `-webhook.service.ts`.
- [ ] Routes are registered in the app entry point.
