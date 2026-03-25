---
name: Webhook Security Audit
description: >
  Audit all webhook endpoints (Shopify, Meta WhatsApp) for security vulnerabilities
  including HMAC verification, idempotency, timing attacks, raw body handling, and
  error isolation. Produces a findings report with fix recommendations.
triggers:
  - audit webhooks
  - webhook security
  - security review
  - check webhook
  - verify webhook safety
  - webhook audit
---

# Webhook Security Audit

Audit the Shopify and Meta WhatsApp webhook endpoints in this project for security vulnerabilities. Produce a structured report with findings and fixes.

## Audit Procedure

### Step 1: Locate Webhook Files

Search for webhook-related files:
- Glob for `server/src/routes/*webhook*` and `server/src/routes/*hook*`
- Glob for `server/src/services/*webhook*`
- Glob for `server/src/middleware/*` (look for verification middleware)
- Grep for `X-Shopify-Hmac-Sha256`, `X-Hub-Signature-256`, `hub.verify_token`
- Grep for `express.raw`, `bodyParser.raw`, `getRawBody` to find raw body handling

Read every file identified. Do not skip any.

### Step 2: Run the Security Checklist

Check each item below. Mark as PASS, FAIL, or WARN. Quote the relevant code.

---

## Security Checklist

### 1. HMAC Signature Verification

**Shopify webhooks:**
- [ ] Verify `X-Shopify-Hmac-Sha256` header is checked on every Shopify webhook route.
- [ ] HMAC is computed using `crypto.createHmac('sha256', SHOPIFY_WEBHOOK_SECRET)` over the **raw request body** (Buffer, not parsed JSON).
- [ ] Comparison uses `crypto.timingSafeEqual()`, not `===` or `==`.
- [ ] Requests with missing or invalid HMAC are rejected with 401 before any processing.

**Meta webhooks:**
- [ ] Verify `X-Hub-Signature-256` header is checked on every Meta POST webhook route.
- [ ] Signature is computed using `crypto.createHmac('sha256', META_APP_SECRET)` over the raw body.
- [ ] Comparison uses `crypto.timingSafeEqual()`.
- [ ] GET verification endpoint checks `hub.verify_token` against a stored secret and returns `hub.challenge`.
- [ ] GET endpoint returns 403 on token mismatch.

### 2. Raw Body Capture

- [ ] Express is configured to capture the raw body **before** JSON parsing for webhook routes.
- [ ] Confirm one of these patterns is used:
  - `express.json({ verify: (req, res, buf) => { req.rawBody = buf; } })`
  - `express.raw({ type: 'application/json' })` on webhook routes specifically
  - A dedicated middleware that stores `req.rawBody` from the stream
- [ ] Verify the HMAC is computed against this raw buffer, not `JSON.stringify(req.body)` (which may reorder keys or alter whitespace).

### 3. Timing-Safe Comparison

- [ ] All signature comparisons use `crypto.timingSafeEqual()`.
- [ ] Both buffers passed to `timingSafeEqual` are the same length (convert to Buffer first if comparing hex strings).
- [ ] No fallback to string equality anywhere in the verification path.

**Vulnerability:** String `===` leaks timing information, enabling byte-by-byte signature forgery.

### 4. Idempotency (Shopify)

- [ ] `X-Shopify-Webhook-Id` header is extracted on every Shopify webhook.
- [ ] The ID is checked against a store (database table, Redis set, or in-memory cache with TTL) before processing.
- [ ] Duplicate IDs are acknowledged with 200 but not reprocessed.
- [ ] The store has a TTL or cleanup strategy (Shopify retries for up to 48 hours).

### 5. Immediate 200 Response

- [ ] Webhook handlers respond with 200 (or 2xx) **before** doing any async work.
- [ ] Pattern: send response first, then call service functions.
- [ ] No `await` on business logic before `res.status(200).send()`.
- [ ] Shopify expects a response within 5 seconds -- confirm no blocking calls before response.

### 6. Error Isolation

- [ ] Async processing is wrapped in try/catch so failures do not crash the server.
- [ ] Errors in async processing are logged with full context (webhook type, ID, payload summary).
- [ ] Errors do **not** propagate back to the HTTP response (which has already been sent).
- [ ] If using a queue or event emitter, confirm error handlers are attached.

### 7. Secret Management

- [ ] `SHOPIFY_WEBHOOK_SECRET` is loaded from environment variables, not hardcoded.
- [ ] `META_APP_SECRET` (or equivalent) is loaded from environment variables, not hardcoded.
- [ ] `META_VERIFY_TOKEN` is loaded from environment variables, not hardcoded.
- [ ] All three are validated at startup in `server/src/config/env.ts`.
- [ ] No secrets appear in log output, error messages, or response bodies.

---

## Common Vulnerabilities and Detection

### V1: Missing HMAC check
**Detect:** Grep for route handlers that accept POST on webhook paths. Verify each calls the HMAC middleware or inline check. Any route without it is vulnerable.
**Risk:** Attackers can forge webhook payloads and trigger arbitrary actions.

### V2: HMAC computed on parsed body instead of raw body
**Detect:** Look for `JSON.stringify(req.body)` in HMAC computation. This produces a different byte sequence than the original payload.
**Risk:** Legitimate webhooks may intermittently fail verification; attackers can craft payloads that pass verification with a known signature.

### V3: String comparison for signatures
**Detect:** Grep for `=== computed` or `hmac === ` or `.digest('hex') ===` near signature verification code.
**Risk:** Timing side-channel allows brute-forcing the signature one byte at a time.

### V4: No idempotency guard
**Detect:** Grep for `X-Shopify-Webhook-Id`. If absent, duplicates will be processed multiple times.
**Risk:** Duplicate order confirmations, double inventory adjustments, repeated messages sent to customers.

### V5: Blocking before response
**Detect:** Look for `await` calls between the start of the handler and `res.send()`/`res.status(200)`. Any database call, API call, or heavy computation here is a problem.
**Risk:** Shopify marks the webhook as failed after 5 seconds and retries, causing duplicate delivery and eventual webhook removal.

### V6: Secrets in logs
**Detect:** Grep for `console.log` or logger calls that output `req.headers` unfiltered, or that interpolate secret variables.
**Risk:** Secrets leak to log aggregators, CI output, or terminal history.

---

## Fix Patterns

### Fix for V1: Add HMAC verification middleware

```typescript
// server/src/middleware/verify-shopify-webhook.ts
import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

export function verifyShopifyWebhook(req: Request, res: Response, next: NextFunction) {
  const hmacHeader = req.headers["x-shopify-hmac-sha256"] as string | undefined;
  if (!hmacHeader || !req.rawBody) {
    return res.status(401).send("Unauthorized");
  }
  const computed = crypto
    .createHmac("sha256", env.SHOPIFY_WEBHOOK_SECRET)
    .update(req.rawBody)
    .digest();
  const provided = Buffer.from(hmacHeader, "base64");
  if (computed.length !== provided.length || !crypto.timingSafeEqual(computed, provided)) {
    return res.status(401).send("Unauthorized");
  }
  next();
}
```

### Fix for V2: Capture raw body

```typescript
// In Express setup, before routes
app.use(express.json({
  verify: (req: Request, _res: Response, buf: Buffer) => {
    (req as any).rawBody = buf;
  },
}));
```

### Fix for V3: Timing-safe comparison

Replace any `===` signature check with:
```typescript
const a = Buffer.from(computedSignature, "hex");
const b = Buffer.from(providedSignature, "hex");
if (a.length === b.length && crypto.timingSafeEqual(a, b)) { /* valid */ }
```

### Fix for V4: Add idempotency check

```typescript
const webhookId = req.headers["x-shopify-webhook-id"] as string;
const existing = await prisma.processedWebhook.findUnique({ where: { webhookId } });
if (existing) {
  return res.status(200).send("Already processed");
}
await prisma.processedWebhook.create({ data: { webhookId } });
```

Add a Prisma model and a cron job to purge records older than 48 hours.

### Fix for V5: Respond before processing

```typescript
router.post("/shopify/orders/create", verifyShopifyWebhook, (req, res) => {
  res.status(200).send("OK");
  // Fire and forget -- errors caught internally
  orderService.handleNewOrder(req.body).catch((err) => {
    logger.error("Failed to process order webhook", { error: err, webhookId: req.headers["x-shopify-webhook-id"] });
  });
});
```

### Fix for V6: Redact secrets from logs

Never log full headers. If logging request metadata, explicitly pick safe fields:
```typescript
logger.info("Webhook received", {
  topic: req.headers["x-shopify-topic"],
  webhookId: req.headers["x-shopify-webhook-id"],
});
```

---

## Report Format

After auditing, produce a summary table:

| # | Check | Status | File:Line | Notes |
|---|-------|--------|-----------|-------|
| 1 | Shopify HMAC verification | PASS/FAIL/WARN | path:line | detail |
| 2 | Meta signature verification | PASS/FAIL/WARN | path:line | detail |
| ... | ... | ... | ... | ... |

Follow with a prioritized list of fixes, most critical first. Include exact code changes using the Edit tool for any FAIL items.
