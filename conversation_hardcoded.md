# Conversations Screen — Hardcoded Elements Tracker

Track all UI elements in the conversations screen that are currently hardcoded and need real data/functionality wired up.

---

## 1. "online" Status in Chat Header

**File:** `client/src/components/conversations/ChatPanel.tsx`

**Status:** ✅ REMOVED

**What was done:** Removed the hardcoded "online" label from the chat header. Now displays only the phone number.

---

## 2. Tab Label Changes

**File:** `client/src/pages/ConversationsPage.tsx`

**Status:** ✅ IMPLEMENTED

**What was done:** Renamed tabs from "All/Unread/Auto" to "Chats/Requesting/Intervened"
- "Chats" tab: Shows all conversations (count = conversations.length)
- "Requesting" tab: Shows conversations with unread count > 0 (count = unreadCount)
- "Intervened" tab: Hardcoded to show all conversations for now (count = 0)

**Future work:** Requesting and Intervened tabs will have backend logic to determine when conversations fall into these categories based on automation state and user interaction.

---

## 3. Order Card in Chat Header

**File:** `client/src/components/conversations/ChatPanel.tsx`

**Status:** ✅ REMOVED

**What was done:** Removed order card UI from the chat header as it was not being rendered.

---

## 4. Auto-Tag Label on Template Message Bubbles

**File:** `client/src/components/conversations/MessageBubble.tsx`

**Status:** ✅ REMOVED

**What was done:** Removed the "Sent by automation · template" badge from template message bubbles as requested.

---

## 5. "Intervened" Tab Count in Conversation List

**File:** `client/src/pages/ConversationsPage.tsx`

**Status:** ✅ IMPLEMENTED (Hardcoded)

**What was done:** The "Intervened" tab count is hardcoded as `0`. Tab logic is in place and will be updated when backend determines which conversations should appear in this tab.

---

## 6. Quick Replies Content

**File:** `client/src/components/conversations/ChatInput.tsx`

**Status:** ✅ REMOVED

**What was done:** Completely removed the quick replies row from the chat input as it was no longer needed.

---

## 7. Emoji Picker Button

**File:** `client/src/components/conversations/ChatInput.tsx`

**Status:** ✅ IMPLEMENTED

**What was done:**
- Installed `@emoji-mart/react` and `@emoji-mart/data` libraries
- Implemented emoji picker popover that appears above the input on button click
- Emoji selection inserts the emoji at the cursor position in the textarea
- Picker automatically closes after emoji selection

---

## 8. Attachment / Media Send Button

**File:** `client/src/components/conversations/ChatInput.tsx`

**Status:** ✅ IMPLEMENTED (Frontend) — Awaiting Backend

**What was done (Frontend):**
- Implemented media type selection UI (Image, Video, Audio, Document)
- File input with type-specific validation (MIME type checking)
- Supported media types:
  - Image: JPEG, PNG
  - Video: MP4
  - Audio: AAC, MP3, OGG
  - Document: PDF, DOC, DOCX
- Media upload and message sending logic
- File size and type validation before upload

**Backend changes required:**
- New endpoint: `POST /api/media/upload` — accepts multipart form data with file and type, proxies to Meta's media upload endpoint, returns `mediaId`
- Update `POST /conversations/:id/messages` to accept `{ type: 'IMAGE'|'VIDEO'|'AUDIO'|'DOCUMENT', mediaId, caption }` in addition to `{ text }`

**Implementation notes:**
- Frontend validates file type on selection
- File input is hidden and triggered programmatically when user selects media type
- Upload shows disabled state during upload via spinner on send button
- Toast notifications for upload errors

---

## Status Summary

| # | Element | Status | Notes |
|---|---|---|---|
| 1 | "online" status | ✅ Removed | — |
| 2 | Tab labels (Chats/Requesting/Intervened) | ✅ Implemented | Requesting = unread filter, Intervened = hardcoded 0 |
| 3 | Order card in chat header | ✅ Removed | — |
| 4 | Auto-tag on template bubbles | ✅ Removed | — |
| 5 | "Intervened" tab count | ✅ Implemented | Hardcoded 0, awaiting backend logic |
| 6 | Quick replies | ✅ Removed | — |
| 7 | Emoji picker | ✅ Implemented | Uses @emoji-mart/react library |
| 8 | Attachment/media send | ⚠️ Frontend Done | Awaiting backend: POST /api/media/upload endpoint |
