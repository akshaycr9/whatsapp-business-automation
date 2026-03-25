---
description: Rules for handling Shopify and Meta WhatsApp webhooks safely
globs: ["server/src/routes/webhooks/**/*.ts", "server/src/services/**/*.ts"]
---

# Webhook Rules

## Universal Rules (Both Shopify and Meta)

1. **Respond immediately** — Send `res.sendStatus(200)` BEFORE any processing
2. **Process asynchronously** — Business logic runs after the response is sent
3. **Never let errors affect the response** — Processing failures are logged, not thrown
4. **Verify authenticity** — Always validate HMAC/signature before processing
5. **Idempotency** — Handle duplicate deliveries gracefully

## Shopify Webhooks

### HMAC Verification
- Shopify sends `X-Shopify-Hmac-Sha256` header
- Compute HMAC-SHA256 of the **raw request body** using `SHOPIFY_WEBHOOK_SECRET`
- Compare using `crypto.timingSafeEqual` (constant-time comparison prevents timing attacks)
- CRITICAL: Capture raw body BEFORE Express JSON parsing using the `verify` callback in `express.json()`

### Idempotency
- Check `X-Shopify-Webhook-Id` header — if already processed, skip
- Store processed webhook IDs (in database or short-term cache)

### Timeout
- Shopify expects a response within **5 seconds** or considers it failed
- This is why processing MUST be async after the 200 response

### Event Routing
- Read `X-Shopify-Topic` header to determine event type
- Route `orders/create` by `financial_status`: `paid` = prepaid, `pending` = COD
- `fulfillments/create` = order shipped
- `checkouts/create` = track for potential abandonment

### Duplicate Events
- Shopify can fire the same webhook multiple times
- Always check: "Have I already processed this order/checkout?"

## Meta WhatsApp Webhooks

### Verification (GET)
- Meta sends `hub.mode`, `hub.verify_token`, `hub.challenge`
- Compare `hub.verify_token` against `META_VERIFY_TOKEN` env var
- Return `hub.challenge` as plain text with 200 status

### Signature Verification (POST)
- Meta sends `X-Hub-Signature-256` header
- Compute HMAC-SHA256 of raw body using `META_APP_SECRET`
- Compare with header value (prefix: `sha256=`)

### Payload Navigation
- Messages: `body.entry[0].changes[0].value.messages[0]`
- Statuses: `body.entry[0].changes[0].value.statuses[0]`
- Always check if arrays exist and have elements before accessing
- A single payload can contain BOTH messages and statuses

### Message Status Updates
- Only upgrade status: `sent` → `delivered` → `read`
- Never downgrade (e.g., don't go from `read` back to `delivered`)
- Use a status priority map for comparison

### Processing Pattern
```
POST /api/webhooks/meta
  1. res.sendStatus(200)
  2. Verify signature
  3. Extract messages[] and statuses[] from payload
  4. For each message: find/create customer → find/create conversation → create Message → emit Socket.io event
  5. For each status: find Message by waMessageId → update status → emit Socket.io event
  6. .catch(err => logger.error('Meta webhook processing failed:', err))
```
