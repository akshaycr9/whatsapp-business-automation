# Conversations Screen — Hardcoded Elements Tracker

Track all UI elements in the conversations screen that are currently hardcoded and need real data/functionality wired up.

---

## 1. "online" Status in Chat Header

**File:** `client/src/components/conversations/ChatPanel.tsx`

**Current behavior:** Always renders `online` in teal next to the phone number.

**What's needed:** WhatsApp Cloud API does not expose real-time presence. Options:
- Remove it entirely and show just the phone number
- Replace with a static label like "WhatsApp" or "via WhatsApp"
- Show last seen if Meta ever exposes it

**Priority:** Low — cosmetic only, no broken functionality

---

## 2. `AUTO` Badge on Conversation List Items

**File:** `client/src/components/conversations/ConversationListItem.tsx`
**Also:** `client/src/pages/ConversationsPage.tsx` (passes `isAuto={false}`)

**Current behavior:** `isAuto` prop is always `false` — badge never appears.

**What's needed:**
- Add an `isAutoManaged` (or similar) boolean flag to the `Conversation` model/type
- Populate it server-side: `true` when the last outbound message was sent by an automation (not manually)
- Return it in `GET /api/conversations`
- Pass it through `ConversationsPage` → `ConversationListItem`

**Prisma/backend changes required:**
- Possibly a `lastMessageSource: 'AUTOMATION' | 'MANUAL'` field on `Conversation`
- Or derive it by checking if the last outbound `Message` has a linked `AutomationLog`

**Priority:** Medium

---

## 3. Order Card in Chat Header

**File:** `client/src/components/conversations/ChatPanel.tsx`

**Current behavior:** The order card UI exists in the design but is not rendered — `orderInfo` prop is `undefined`.

**What's needed:**
- Join the most recent Shopify order to the Conversation (via Customer → phone → Shopify orders)
- Expose via `GET /api/conversations` or a separate `GET /api/conversations/:id/order` endpoint
- Shape: `{ id: string; total: string; items: string }` (e.g. `{ id: '#10482', total: '₹2,498', items: 'Classic Crew Tee (M · Navy) · 2' }`)
- Add `orderInfo` prop to `ChatPanel` and render the compact order card in the header

**Backend changes required:**
- New service method: `getLatestOrderForConversation(conversationId)`
- Query Shopify Admin API or local `shopifyData` JSON on `CheckoutTracker`

**Priority:** Medium — adds useful context for support

---

## 4. Auto-Tag Label on Template Message Bubbles

**File:** `client/src/components/conversations/MessageBubble.tsx`

**Current behavior:** All outbound TEMPLATE messages show `Sent by automation · template` — the automation name is generic.

**What's needed:**
- Server should populate `message.metadata.automationName` when sending a template via an automation
- In `automation.service.ts` or wherever `POST /conversations/:id/messages/template` is called from an automation job, set `metadata.automationName = automation.name`
- `MessageBubble` already reads from `message.metadata` — just change the label to `meta?.automationName ?? 'automation'`

**Backend changes required:**
- `processAutomation()` or equivalent should pass `automationName` into the message metadata at creation time

**Priority:** Low — label is informational only

---

## 5. "Auto" Tab Count in Conversation List

**File:** `client/src/pages/ConversationsPage.tsx`

**Current behavior:** Auto tab count is hardcoded as `0`. Clicking "Auto" shows all conversations (same as "All").

**What's needed:**
- Same as item #2 — needs `isAutoManaged` flag on `Conversation`
- Once available: `conversations.filter(c => c.isAutoManaged).length` for count
- Filter logic: `conversations.filter(c => c.isAutoManaged)` for the tab view

**Priority:** Medium (blocked by item #2)

---

## 6. Quick Replies Content

**File:** `client/src/components/conversations/ChatInput.tsx`

**Current behavior:** Hardcoded array:
```ts
const QUICK_REPLIES = [
  'Ships today 📦',
  'Thanks for your order!',
  'Tracking link inbound',
  'Yes, in stock',
  'Sorry, out of stock',
  'Send order details',
];
```

**What's needed:** Options (pick one):
- **Simple:** A settings page where the user can add/edit/delete quick replies, stored in the DB (new `QuickReply` model)
- **Minimal:** Store as a JSON array in an existing settings/config table
- **No-op:** Keep hardcoded if the replies are always the same — just update the array manually

**Backend changes required (if dynamic):**
- New `QuickReply` model with `id`, `text`, `order`, `createdAt`
- `GET /api/quick-replies` and `PUT /api/quick-replies` endpoints

**Priority:** Low — current hardcoded values are useful as-is

---

## 7. Emoji Picker Button

**File:** `client/src/components/conversations/ChatInput.tsx`

**Current behavior:** Smile icon button renders but does nothing on click.

**What's needed:**
- Install an emoji picker library (e.g. `emoji-mart`)
- Render a popover/dropdown on button click with the picker
- On emoji select, insert the emoji at the cursor position in the textarea

**Package required:** `@emoji-mart/react` + `@emoji-mart/data`

**Priority:** Low — nice-to-have, not blocking any core functionality

---

## 8. Attachment / Media Send Button

**File:** `client/src/components/conversations/ChatInput.tsx`

**Current behavior:** Paperclip icon button renders but does nothing on click.

**What's needed:**
- File input trigger on button click
- Upload selected file to Meta via `POST https://graph.facebook.com/v21.0/{phone-number-id}/media`
- Use returned `media_id` to send a media message via `POST /api/conversations/:id/messages` with `{ type: 'IMAGE'|'VIDEO'|'DOCUMENT', mediaId, caption }`

**Backend changes required:**
- New route/service: `POST /api/media/upload` — proxies the file to Meta's media upload endpoint and returns `mediaId`
- Update `POST /conversations/:id/messages` to accept `{ type, mediaId, caption }` payload in addition to `{ text }`

**Meta API docs:** `POST /{phone-number-id}/media` with `multipart/form-data`

**Priority:** Medium — enables richer customer communication

---

## Status Summary

| # | Element | Priority | Blocked by |
|---|---|---|---|
| 1 | "online" status | Low | — |
| 2 | AUTO badge on list items | Medium | Backend: `isAutoManaged` flag on Conversation |
| 3 | Order card in chat header | Medium | Backend: latest Shopify order join |
| 4 | Auto-tag automation name | Low | Backend: `automationName` in message metadata |
| 5 | "Auto" tab count/filter | Medium | Item #2 |
| 6 | Quick replies content | Low | — |
| 7 | Emoji picker | Low | — |
| 8 | Attachment/media send | Medium | Backend: media upload proxy + message route update |
