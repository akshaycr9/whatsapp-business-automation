---
description: "Scaffold Meta WhatsApp Cloud API calls — Axios setup, send template/text/media messages, media download, template CRUD, error handling, phone normalization"
triggers:
  - "send message"
  - "whatsapp api"
  - "meta api"
  - "send template"
  - "template message"
  - "media api"
  - "cloud api"
---

# Meta WhatsApp Cloud API Integration

## Axios Instance Setup

Create or reuse `server/src/lib/meta-api.ts`. Configure a shared Axios instance:

```typescript
import axios from "axios";
import { env } from "../config/env";

export const metaApi = axios.create({
  baseURL: `https://graph.facebook.com/v21.0`,
  headers: {
    Authorization: `Bearer ${env.META_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  },
});
```

All endpoints below use this instance. The phone number ID from `env.META_PHONE_NUMBER_ID` is interpolated into paths as needed.

---

## 1. Send Template Message

**POST** `/{META_PHONE_NUMBER_ID}/messages`

Use templates when outside the 24-hour messaging window or for structured outbound messages.

```typescript
interface TemplateComponent {
  type: "header" | "body" | "button";
  sub_type?: "quick_reply" | "url";
  index?: number; // button index, 0-based
  parameters: TemplateParameter[];
}

interface TemplateParameter {
  type: "text" | "currency" | "date_time" | "image" | "video" | "document";
  text?: string;
  image?: { id?: string; link?: string };
  video?: { id?: string; link?: string };
  document?: { id?: string; link?: string; filename?: string };
}

interface SendTemplatePayload {
  messaging_product: "whatsapp";
  to: string; // E.164 without +, e.g. "919876543210"
  type: "template";
  template: {
    name: string;
    language: { code: string }; // e.g. "en_US"
    components?: TemplateComponent[];
  };
}
```

Build the service function in `server/src/services/whatsapp.service.ts`:

```typescript
async function sendTemplateMessage(
  to: string,
  templateName: string,
  languageCode: string,
  components?: TemplateComponent[]
): Promise<MetaMessageResponse> {
  const payload: SendTemplatePayload = {
    messaging_product: "whatsapp",
    to: normalizePhone(to),
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      ...(components && { components }),
    },
  };

  const { data } = await metaApi.post(
    `/${env.META_PHONE_NUMBER_ID}/messages`,
    payload
  );
  return data;
}
```

### Template Variable Mapping

Variables are positional: `{{1}}`, `{{2}}`, etc. Map them in the `parameters` array in order.

For a body with `{{1}}` = customer name and `{{2}}` = order number:

```typescript
const bodyComponent: TemplateComponent = {
  type: "body",
  parameters: [
    { type: "text", text: customerName },  // fills {{1}}
    { type: "text", text: orderNumber },    // fills {{2}}
  ],
};
```

---

## 2. Send Text Message (Free-form)

**POST** `/{META_PHONE_NUMBER_ID}/messages`

Only send within the 24-hour window after the customer's last inbound message. Check `lastInboundAt` before calling.

```typescript
interface SendTextPayload {
  messaging_product: "whatsapp";
  recipient_type: "individual";
  to: string;
  type: "text";
  text: {
    preview_url?: boolean;
    body: string;
  };
}

async function sendTextMessage(
  to: string,
  body: string,
  lastInboundAt: Date
): Promise<MetaMessageResponse> {
  const hoursSinceLastInbound =
    (Date.now() - lastInboundAt.getTime()) / (1000 * 60 * 60);

  if (hoursSinceLastInbound > 24) {
    throw new WindowClosedError(
      "24-hour messaging window expired. Use a template message instead."
    );
  }

  const payload: SendTextPayload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: normalizePhone(to),
    type: "text",
    text: { preview_url: false, body },
  };

  const { data } = await metaApi.post(
    `/${env.META_PHONE_NUMBER_ID}/messages`,
    payload
  );
  return data;
}
```

---

## 3. Send Media Message

**POST** `/{META_PHONE_NUMBER_ID}/messages`

Supported types: `image`, `video`, `audio`, `document`. Provide either a `link` (public URL) or an `id` (uploaded media ID).

```typescript
type MediaType = "image" | "video" | "audio" | "document";

interface MediaObject {
  id?: string;
  link?: string;
  caption?: string;
  filename?: string; // document only
}

interface SendMediaPayload {
  messaging_product: "whatsapp";
  recipient_type: "individual";
  to: string;
  type: MediaType;
  [key: string]: unknown; // image | video | audio | document object
}

async function sendMediaMessage(
  to: string,
  mediaType: MediaType,
  media: MediaObject,
  lastInboundAt: Date
): Promise<MetaMessageResponse> {
  const hoursSinceLastInbound =
    (Date.now() - lastInboundAt.getTime()) / (1000 * 60 * 60);

  if (hoursSinceLastInbound > 24) {
    throw new WindowClosedError(
      "24-hour messaging window expired. Use a template message instead."
    );
  }

  const payload: SendMediaPayload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: normalizePhone(to),
    type: mediaType,
    [mediaType]: media,
  };

  const { data } = await metaApi.post(
    `/${env.META_PHONE_NUMBER_ID}/messages`,
    payload
  );
  return data;
}
```

---

## 4. Get Media URL and Download

Meta hosts media for 30 days. Do not cache locally. Retrieve the URL when needed.

### Step 1: Get Media URL

**GET** `/{media_id}`

```typescript
interface MediaUrlResponse {
  url: string;
  mime_type: string;
  sha256: string;
  file_size: number;
  id: string;
  messaging_product: "whatsapp";
}

async function getMediaUrl(mediaId: string): Promise<MediaUrlResponse> {
  const { data } = await metaApi.get<MediaUrlResponse>(`/${mediaId}`);
  return data;
}
```

### Step 2: Download Media Binary

**GET** the returned `url` with the auth header.

```typescript
async function downloadMedia(
  mediaUrl: string
): Promise<{ buffer: Buffer; mimeType: string }> {
  const { data, headers } = await axios.get(mediaUrl, {
    headers: { Authorization: `Bearer ${env.META_ACCESS_TOKEN}` },
    responseType: "arraybuffer",
  });

  return {
    buffer: Buffer.from(data),
    mimeType: headers["content-type"] as string,
  };
}
```

---

## 5. Template Management (Business Management API)

Use `META_WABA_ID` for template CRUD operations.

### List Templates

**GET** `/{META_WABA_ID}/message_templates`

```typescript
interface TemplateListParams {
  fields?: string;
  limit?: number;
  status?: "APPROVED" | "PENDING" | "REJECTED";
}

async function getTemplates(
  params?: TemplateListParams
): Promise<MetaTemplateListResponse> {
  const { data } = await metaApi.get(
    `/${env.META_WABA_ID}/message_templates`,
    {
      params: {
        fields: params?.fields ?? "name,status,category,language,components",
        limit: params?.limit ?? 100,
        ...(params?.status && { status: params.status }),
      },
    }
  );
  return data;
}
```

### Create Template

**POST** `/{META_WABA_ID}/message_templates`

```typescript
interface CreateTemplatePayload {
  name: string;
  category: "MARKETING" | "UTILITY" | "AUTHENTICATION";
  language: string;
  components: TemplateDefinitionComponent[];
}

interface TemplateDefinitionComponent {
  type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS";
  format?: "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT"; // HEADER only
  text?: string; // supports {{1}}, {{2}} placeholders
  example?: {
    header_text?: string[];
    body_text?: string[][];
    header_handle?: string[]; // media sample handle
  };
  buttons?: TemplateButton[];
}

interface TemplateButton {
  type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER";
  text: string;
  url?: string;       // URL button: supports {{1}} suffix
  phone_number?: string;
}

async function createTemplate(
  payload: CreateTemplatePayload
): Promise<MetaCreateTemplateResponse> {
  const { data } = await metaApi.post(
    `/${env.META_WABA_ID}/message_templates`,
    payload
  );
  return data;
}
```

### Delete Template

**DELETE** `/{META_WABA_ID}/message_templates?name={template_name}`

```typescript
async function deleteTemplate(templateName: string): Promise<void> {
  await metaApi.delete(`/${env.META_WABA_ID}/message_templates`, {
    params: { name: templateName },
  });
}
```

---

## 6. Error Handling

Add an Axios response interceptor or handle errors in a wrapper. Key error codes:

| HTTP Status | Meta Error Code | Meaning | Action |
|---|---|---|---|
| 429 | 130429 | Rate limit hit | Retry after `Retry-After` header (seconds) |
| 401 | 190 | Invalid/expired token | Refresh token or alert admin |
| 400 | 131030 | Recipient not on WhatsApp | Mark customer phone invalid |
| 400 | 131047 | Re-engagement message outside window | Switch to template |
| 400 | 132000 | Template parameter count mismatch | Fix parameter array |
| 400 | 100 | Invalid phone number format | Run through normalizePhone |

### Rate Limit Retry

```typescript
import { AxiosError } from "axios";

metaApi.interceptors.response.use(undefined, async (error: AxiosError) => {
  if (!error.config || !error.response) throw error;

  const status = error.response.status;

  if (status === 429) {
    const retryAfter = Number(error.response.headers["retry-after"]) || 60;
    await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
    return metaApi.request(error.config);
  }

  if (status === 401) {
    throw new MetaAuthError("META_ACCESS_TOKEN is invalid or expired.");
  }

  const metaError = (error.response.data as { error?: { code: number; message: string } })?.error;
  throw new MetaApiError(
    metaError?.message ?? "Unknown Meta API error",
    status,
    metaError?.code
  );
});
```

### Custom Error Classes

Place in `server/src/errors/meta.errors.ts`:

```typescript
export class MetaApiError extends Error {
  constructor(
    message: string,
    public httpStatus: number,
    public metaCode?: number
  ) {
    super(message);
    this.name = "MetaApiError";
  }
}

export class MetaAuthError extends MetaApiError {
  constructor(message: string) {
    super(message, 401, 190);
    this.name = "MetaAuthError";
  }
}

export class WindowClosedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WindowClosedError";
  }
}
```

---

## 7. Phone Number Normalization

Place in `server/src/utils/phone.ts`. Store all numbers in E.164 without `+`.

```typescript
export function normalizePhone(raw: string): string {
  // Strip whitespace, dashes, parens, plus sign
  const digits = raw.replace(/[\s\-\(\)\+]/g, "");

  if (digits.length < 10 || digits.length > 15) {
    throw new Error(`Invalid phone number: ${raw}`);
  }

  // If 10 digits and looks like Indian number (starts with 6-9), prepend 91
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return `91${digits}`;
  }

  return digits;
}
```

---

## 8. Response Types

```typescript
interface MetaMessageResponse {
  messaging_product: "whatsapp";
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string }>;
}

interface MetaTemplateListResponse {
  data: MetaTemplate[];
  paging?: { cursors: { before: string; after: string }; next?: string };
}

interface MetaTemplate {
  id: string;
  name: string;
  status: "APPROVED" | "PENDING" | "REJECTED";
  category: string;
  language: string;
  components: TemplateDefinitionComponent[];
}

interface MetaCreateTemplateResponse {
  id: string;
  status: "APPROVED" | "PENDING" | "REJECTED";
  category: string;
}
```

---

## 9. Complete Example: Send Template with Header Image + Body Variables

Scenario: Send the `order_confirmation` template with a product image header and body variables for customer name and order number.

```typescript
import { metaApi } from "../lib/meta-api";
import { normalizePhone } from "../utils/phone";
import { env } from "../config/env";

async function sendOrderConfirmation(
  customerPhone: string,
  customerName: string,
  orderNumber: string,
  productImageUrl: string
): Promise<MetaMessageResponse> {
  const payload = {
    messaging_product: "whatsapp" as const,
    to: normalizePhone(customerPhone),
    type: "template" as const,
    template: {
      name: "order_confirmation",
      language: { code: "en_US" },
      components: [
        {
          type: "header" as const,
          parameters: [
            {
              type: "image" as const,
              image: { link: productImageUrl },
            },
          ],
        },
        {
          type: "body" as const,
          parameters: [
            { type: "text" as const, text: customerName },   // {{1}}
            { type: "text" as const, text: orderNumber },     // {{2}}
          ],
        },
      ],
    },
  };

  const { data } = await metaApi.post<MetaMessageResponse>(
    `/${env.META_PHONE_NUMBER_ID}/messages`,
    payload
  );

  return data;
}
```

---

## Quick Reference

| Operation | Method | Endpoint |
|---|---|---|
| Send template | POST | `/{phone_id}/messages` |
| Send text | POST | `/{phone_id}/messages` |
| Send media | POST | `/{phone_id}/messages` |
| Get media URL | GET | `/{media_id}` |
| List templates | GET | `/{waba_id}/message_templates` |
| Create template | POST | `/{waba_id}/message_templates` |
| Delete template | DELETE | `/{waba_id}/message_templates?name=X` |
| Mark as read | POST | `/{phone_id}/messages` with `status: "read"` |

### Mark Message as Read

```typescript
async function markAsRead(messageId: string): Promise<void> {
  await metaApi.post(`/${env.META_PHONE_NUMBER_ID}/messages`, {
    messaging_product: "whatsapp",
    status: "read",
    message_id: messageId,
  });
}
```
