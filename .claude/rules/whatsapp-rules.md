---
description: WhatsApp Business API rules and Meta Cloud API constraints
globs: ["server/src/services/whatsapp*.ts", "server/src/services/template*.ts", "server/src/services/conversation*.ts"]
---

# WhatsApp Business API Rules

## 24-Hour Messaging Window
- After a customer sends you a message, you have **24 hours** to reply with free-form text/media
- Outside the 24-hour window, you can ONLY send **approved template messages**
- The chat UI must check the window and warn the user before they try to send a free-form reply
- Track `lastInboundMessageAt` on the Conversation model to calculate the window

## Phone Number Format
- All phone numbers stored and sent in **E.164 format WITHOUT the `+` prefix**
- Example: `919876543210` (India), not `+919876543210`
- Normalize on ingress: strip `+`, spaces, dashes, parentheses
- Validate: must be 10-15 digits after normalization

## Template Messages
- Template variables are **positional**: `{{1}}`, `{{2}}`, `{{3}}`
- Variables are mapped to Shopify data paths in the Automation's `variableMapping` JSON
- Templates have components: `header` (text/image/video/document), `body` (text with variables), `footer` (text), `buttons` (quick_reply/url)
- Template names must be lowercase with underscores: `order_confirmed`, `cod_verification`
- Templates require Meta approval before use — approval can take minutes to days

## Template Status Lifecycle
- `PENDING` → submitted to Meta, awaiting review
- `APPROVED` → can be used to send messages
- `REJECTED` → cannot be used, check `rejectedReason` for details
- Sync template statuses from Meta periodically or on-demand via `/api/templates/sync-all`

## Media Messages
- Meta retains media for **30 days** — after that, media URLs return 404
- Media URLs from the API expire in **~5 minutes** — use the media proxy endpoint to fetch on demand
- The proxy at `/api/media/:mediaId` fetches from Meta with auth and streams to the client
- UI must show a graceful "Media expired" placeholder for media older than 30 days
- Supported media types: image (JPEG, PNG), video (MP4), audio (AAC, MP3, OGG), document (PDF, DOC)

## Rate Limits
- Unverified businesses: **250 messages per 24 hours**
- Verified businesses: tier-based (1K, 10K, 100K per 24h)
- Handle HTTP 429 responses with retry-after header
- Log rate limit hits — they indicate you need to request a tier upgrade

## API Version
- Pin to a specific Meta Graph API version (e.g., `v21.0`)
- Base URL: `https://graph.facebook.com/v21.0/`
- Check Meta's changelog before upgrading versions

## Message Status Flow
```
PENDING → SENT → DELIVERED → READ
                → FAILED
```
- `PENDING`: queued locally, not yet sent to Meta
- `SENT`: accepted by Meta's servers
- `DELIVERED`: delivered to the customer's device
- `READ`: customer opened/read the message
- `FAILED`: delivery failed (check error code in Meta's response)
