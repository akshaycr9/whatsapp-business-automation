---
name: api-test-generator
description: >
  Generates integration tests for API endpoints in the Qwertees WhatsApp Automation backend.
  Activate when the user says "write tests", "test endpoint", "integration test", "test API",
  "add tests", "test route", "test webhook", "generate test", "create test suite",
  "test this endpoint", or similar requests for backend API testing.
---

# API Integration Test Generator

Generate integration test files for Express API endpoints in the Qwertees WhatsApp Automation
backend. Tests use Vitest + supertest against a real Express app instance with a test database
managed by Prisma. Every test file follows the same structure: setup, factories, test suites,
teardown.

## Test File Structure and Naming

| Convention         | Rule                                       | Example                          |
|--------------------|--------------------------------------------|----------------------------------|
| File location      | Next to source in `__tests__/` directory   | `server/src/routes/__tests__/`   |
| File name          | `{resource}.routes.test.ts` (kebab-case)   | `template.routes.test.ts`        |
| Service tests      | `{resource}.service.test.ts`               | `template.service.test.ts`       |
| Webhook tests      | `{source}.webhook.routes.test.ts`          | `shopify.webhook.routes.test.ts` |
| Describe blocks    | `describe("VERB /api/path", ...)` per verb | `describe("GET /api/templates")` |
| Test names         | Start with "should" + expected behavior    | `it("should return 404 ...")`    |

## Step-by-Step Process

### 1. Identify the Target

Ask the user (or infer from context) which route or service to test. Read the source files
to understand the endpoints, request shapes, and response shapes before generating tests.

Determine:
- Resource name and base URL path
- HTTP methods exposed (GET, POST, PUT, DELETE)
- Request body shapes (from service input interfaces)
- Prisma models involved (for seeding and asserting DB state)
- Whether it is a CRUD route or a webhook route

### 2. Set Up the Test Helpers

Create a shared test setup file at `server/src/test/setup.ts` if it does not already exist.
This file configures the test database, Prisma client, and Express app instance.

```typescript
// server/src/test/setup.ts
import { PrismaClient } from "@prisma/client";
import express from "express";
import { errorHandler } from "../middleware/error-handler";

// Use a dedicated test database. Set DATABASE_URL in .env.test or vitest config.
export const prisma = new PrismaClient();

/**
 * Build a fresh Express app with the given router mounted at the given path.
 * Use this in each test file to isolate route testing.
 */
export function buildApp(path: string, router: express.Router): express.Express {
  const app = express();
  app.use(
    express.json({
      verify: (req: express.Request, _res, buf) => {
        (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
      },
    }),
  );
  app.use(path, router);
  app.use(errorHandler);
  return app;
}

/**
 * Delete all rows from every table. Run this in beforeEach or afterEach
 * to guarantee test isolation.
 */
export async function resetDatabase(): Promise<void> {
  const tableNames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != '_prisma_migrations'`;

  for (const { tablename } of tableNames) {
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "public"."${tablename}" CASCADE`,
    );
  }
}
```

#### Vitest Configuration

Add test-specific config to `server/vitest.config.ts` if it does not exist:

```typescript
// server/vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./src/test/global-setup.ts"],
    testTimeout: 10000,
    hookTimeout: 15000,
  },
});
```

Create the global setup file at `server/src/test/global-setup.ts`:

```typescript
// server/src/test/global-setup.ts
import { prisma } from "./setup";

export async function setup() {
  // Connect to the test database.
  await prisma.$connect();
}

export async function teardown() {
  await prisma.$disconnect();
}
```

### 3. Create Mock Data Factories

Place factories at `server/src/test/factories/`. One file per domain. Factories return
plain objects that match Prisma `create` input shapes. Use incremental IDs or UUIDs
generated at call time so each test gets unique data.

#### Shopify Payload Factory

```typescript
// server/src/test/factories/shopify-payloads.ts
import crypto from "node:crypto";

let orderCounter = 1000;

export function buildShopifyOrderPayload(
  overrides: Record<string, unknown> = {},
) {
  const id = ++orderCounter;
  return {
    id,
    name: `#${id}`,
    email: `customer-${id}@example.com`,
    created_at: new Date().toISOString(),
    total_price: "49.99",
    currency: "INR",
    financial_status: "paid",
    fulfillment_status: null,
    customer: {
      id: id + 5000,
      email: `customer-${id}@example.com`,
      first_name: "Test",
      last_name: "Customer",
      phone: `+9198765${String(id).padStart(5, "0")}`,
    },
    line_items: [
      {
        id: id + 10000,
        title: "Test T-Shirt",
        quantity: 1,
        price: "49.99",
      },
    ],
    shipping_address: {
      first_name: "Test",
      last_name: "Customer",
      city: "Mumbai",
      country: "India",
    },
    ...overrides,
  };
}

export function buildShopifyCheckoutPayload(
  overrides: Record<string, unknown> = {},
) {
  const id = ++orderCounter;
  return {
    id,
    token: crypto.randomUUID(),
    cart_token: crypto.randomUUID(),
    email: `customer-${id}@example.com`,
    created_at: new Date().toISOString(),
    abandoned_checkout_url: `https://qwertees.myshopify.com/checkouts/${id}/recover`,
    total_price: "49.99",
    customer: {
      id: id + 5000,
      email: `customer-${id}@example.com`,
      first_name: "Test",
      last_name: "Customer",
      phone: `+9198765${String(id).padStart(5, "0")}`,
    },
    line_items: [
      {
        title: "Test T-Shirt",
        quantity: 1,
        price: "49.99",
      },
    ],
    ...overrides,
  };
}

/**
 * Compute a valid Shopify HMAC-SHA256 signature for the given body and secret.
 * Use this to build authenticated test requests.
 */
export function computeShopifyHmac(body: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(body, "utf8")
    .digest("base64");
}
```

#### Meta Payload Factory

```typescript
// server/src/test/factories/meta-payloads.ts
import crypto from "node:crypto";

let messageCounter = 0;

export function buildMetaTextMessagePayload(
  overrides: {
    from?: string;
    text?: string;
    phoneNumberId?: string;
  } = {},
) {
  const msgId = `wamid.test${++messageCounter}`;
  const from = overrides.from ?? "919876543210";
  return {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "BUSINESS_ACCOUNT_ID",
        changes: [
          {
            value: {
              messaging_product: "whatsapp",
              metadata: {
                display_phone_number: "15551234567",
                phone_number_id: overrides.phoneNumberId ?? "PHONE_NUMBER_ID",
              },
              contacts: [
                {
                  profile: { name: "Test User" },
                  wa_id: from,
                },
              ],
              messages: [
                {
                  from,
                  id: msgId,
                  timestamp: String(Math.floor(Date.now() / 1000)),
                  type: "text",
                  text: { body: overrides.text ?? "Hello from test" },
                },
              ],
            },
            field: "messages",
          },
        ],
      },
    ],
  };
}

export function buildMetaStatusPayload(
  status: "sent" | "delivered" | "read" | "failed" = "delivered",
) {
  return {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "BUSINESS_ACCOUNT_ID",
        changes: [
          {
            value: {
              messaging_product: "whatsapp",
              metadata: {
                display_phone_number: "15551234567",
                phone_number_id: "PHONE_NUMBER_ID",
              },
              statuses: [
                {
                  id: `wamid.status${++messageCounter}`,
                  status,
                  timestamp: String(Math.floor(Date.now() / 1000)),
                  recipient_id: "919876543210",
                },
              ],
            },
            field: "messages",
          },
        ],
      },
    ],
  };
}

/**
 * Compute a valid Meta SHA-256 signature for the given body and secret.
 */
export function computeMetaSignature(body: string, secret: string): string {
  return (
    "sha256=" +
    crypto.createHmac("sha256", secret).update(body, "utf8").digest("hex")
  );
}
```

#### Database Seed Factory

```typescript
// server/src/test/factories/db-seeds.ts
import { prisma } from "../setup";

let seedCounter = 0;

export async function seedCustomer(
  overrides: Record<string, unknown> = {},
) {
  const i = ++seedCounter;
  return prisma.customer.create({
    data: {
      phone: `9198765${String(i).padStart(5, "0")}`,
      name: `Test Customer ${i}`,
      email: `customer-${i}@example.com`,
      ...overrides,
    },
  });
}

export async function seedTemplate(
  overrides: Record<string, unknown> = {},
) {
  const i = ++seedCounter;
  return prisma.template.create({
    data: {
      name: `test_template_${i}`,
      language: "en",
      category: "MARKETING",
      metaTemplateId: `meta-tmpl-${i}`,
      components: [],
      ...overrides,
    },
  });
}

export async function seedConversation(customerId: string) {
  return prisma.conversation.create({
    data: { customerId },
  });
}
```

### 4. Testing Patterns

#### Pattern A: CRUD Endpoint Tests

Use supertest to send HTTP requests to the Express app. Assert status codes, response body
shape, and database state after each request.

```typescript
// server/src/routes/__tests__/template.routes.test.ts
import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { buildApp, prisma, resetDatabase } from "../../test/setup";
import templateRouter from "../template.routes";
import { seedTemplate } from "../../test/factories/db-seeds";

const app = buildApp("/api/templates", templateRouter);

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await resetDatabase();
});

describe("GET /api/templates", () => {
  it("should return an empty array when no templates exist", async () => {
    const res = await request(app).get("/api/templates");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("should return all templates ordered by createdAt desc", async () => {
    const t1 = await seedTemplate({ name: "first_template" });
    const t2 = await seedTemplate({ name: "second_template" });

    const res = await request(app).get("/api/templates");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].id).toBe(t2.id);
    expect(res.body[1].id).toBe(t1.id);
  });
});

describe("GET /api/templates/:id", () => {
  it("should return the template when it exists", async () => {
    const template = await seedTemplate();

    const res = await request(app).get(`/api/templates/${template.id}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(template.id);
    expect(res.body.name).toBe(template.name);
  });

  it("should return 404 when the template does not exist", async () => {
    const res = await request(app).get(
      "/api/templates/00000000-0000-0000-0000-000000000000",
    );

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });
});

describe("POST /api/templates", () => {
  it("should create a template and return 201", async () => {
    const input = {
      name: "order_confirmation",
      language: "en",
      category: "UTILITY",
      metaTemplateId: "meta-123",
      components: [{ type: "BODY", text: "Your order {{1}} is confirmed." }],
    };

    const res = await request(app).post("/api/templates").send(input);

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("order_confirmation");
    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("createdAt");

    // Verify database state.
    const dbRecord = await prisma.template.findUnique({
      where: { id: res.body.id },
    });
    expect(dbRecord).not.toBeNull();
    expect(dbRecord!.name).toBe("order_confirmation");
  });

  it("should return 400 when required fields are missing", async () => {
    const res = await request(app).post("/api/templates").send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
});

describe("PUT /api/templates/:id", () => {
  it("should update the template and return the updated record", async () => {
    const template = await seedTemplate();

    const res = await request(app)
      .put(`/api/templates/${template.id}`)
      .send({ name: "updated_name" });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("updated_name");

    // Verify database state.
    const dbRecord = await prisma.template.findUnique({
      where: { id: template.id },
    });
    expect(dbRecord!.name).toBe("updated_name");
  });

  it("should return 404 when updating a nonexistent template", async () => {
    const res = await request(app)
      .put("/api/templates/00000000-0000-0000-0000-000000000000")
      .send({ name: "nope" });

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/templates/:id", () => {
  it("should delete the template and return 204", async () => {
    const template = await seedTemplate();

    const res = await request(app).delete(`/api/templates/${template.id}`);

    expect(res.status).toBe(204);

    // Verify removal from database.
    const dbRecord = await prisma.template.findUnique({
      where: { id: template.id },
    });
    expect(dbRecord).toBeNull();
  });

  it("should return 404 when deleting a nonexistent template", async () => {
    const res = await request(app).delete(
      "/api/templates/00000000-0000-0000-0000-000000000000",
    );

    expect(res.status).toBe(404);
  });
});
```

#### Pattern B: Webhook Endpoint Tests

Webhook tests differ from CRUD tests: verify signature checking, immediate 200 response,
idempotency, and async processing. Mock or spy on the service layer for async behavior.

```typescript
// server/src/routes/__tests__/shopify.webhook.routes.test.ts
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import request from "supertest";
import { buildApp, prisma, resetDatabase } from "../../test/setup";
import shopifyWebhookRouter from "../webhooks/shopify.webhook.routes";
import { buildShopifyOrderPayload, computeShopifyHmac } from "../../test/factories/shopify-payloads";

// Mock the env module to provide a known webhook secret.
vi.mock("../../config/env", () => ({
  env: {
    SHOPIFY_WEBHOOK_SECRET: "test-webhook-secret",
  },
}));

const app = buildApp("/api/webhooks/shopify", shopifyWebhookRouter);
const WEBHOOK_SECRET = "test-webhook-secret";

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await resetDatabase();
});

describe("POST /api/webhooks/shopify", () => {
  it("should return 200 for a valid signed request", async () => {
    const payload = buildShopifyOrderPayload();
    const body = JSON.stringify(payload);
    const hmac = computeShopifyHmac(body, WEBHOOK_SECRET);

    const res = await request(app)
      .post("/api/webhooks/shopify")
      .set("Content-Type", "application/json")
      .set("X-Shopify-Hmac-Sha256", hmac)
      .set("X-Shopify-Topic", "orders/create")
      .set("X-Shopify-Webhook-Id", "test-webhook-id-1")
      .set("X-Shopify-Shop-Domain", "qwertees.myshopify.com")
      .send(body);

    expect(res.status).toBe(200);
  });

  it("should return 401 when HMAC header is missing", async () => {
    const res = await request(app)
      .post("/api/webhooks/shopify")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ test: true }));

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/HMAC/i);
  });

  it("should return 401 when HMAC signature is invalid", async () => {
    const payload = buildShopifyOrderPayload();
    const body = JSON.stringify(payload);

    const res = await request(app)
      .post("/api/webhooks/shopify")
      .set("Content-Type", "application/json")
      .set("X-Shopify-Hmac-Sha256", "invalid-hmac-value")
      .set("X-Shopify-Topic", "orders/create")
      .set("X-Shopify-Webhook-Id", "test-webhook-id-2")
      .send(body);

    expect(res.status).toBe(401);
  });

  it("should skip duplicate webhook events", async () => {
    const payload = buildShopifyOrderPayload();
    const body = JSON.stringify(payload);
    const hmac = computeShopifyHmac(body, WEBHOOK_SECRET);
    const webhookId = "duplicate-test-id";

    // Seed a pre-existing webhook event record.
    await prisma.webhookEvent.create({
      data: {
        externalId: webhookId,
        source: "SHOPIFY",
        topic: "orders/create",
      },
    });

    const res = await request(app)
      .post("/api/webhooks/shopify")
      .set("Content-Type", "application/json")
      .set("X-Shopify-Hmac-Sha256", hmac)
      .set("X-Shopify-Topic", "orders/create")
      .set("X-Shopify-Webhook-Id", webhookId)
      .send(body);

    // Still returns 200 (webhook responded immediately).
    expect(res.status).toBe(200);
  });
});
```

#### Pattern C: Meta Webhook Verification Challenge

```typescript
describe("GET /api/webhooks/meta", () => {
  it("should return the challenge when verify token matches", async () => {
    const res = await request(app)
      .get("/api/webhooks/meta")
      .query({
        "hub.mode": "subscribe",
        "hub.verify_token": "test-verify-token",
        "hub.challenge": "challenge-string-123",
      });

    expect(res.status).toBe(200);
    expect(res.text).toBe("challenge-string-123");
  });

  it("should return 403 when verify token does not match", async () => {
    const res = await request(app)
      .get("/api/webhooks/meta")
      .query({
        "hub.mode": "subscribe",
        "hub.verify_token": "wrong-token",
        "hub.challenge": "challenge-string-123",
      });

    expect(res.status).toBe(403);
  });
});
```

### 5. Assertion Patterns Reference

Use these assertion patterns consistently across all test files.

**Status codes:**
```typescript
expect(res.status).toBe(200);   // Successful GET, PUT
expect(res.status).toBe(201);   // Successful POST (resource created)
expect(res.status).toBe(204);   // Successful DELETE (no content)
expect(res.status).toBe(400);   // Validation error
expect(res.status).toBe(401);   // Auth / signature failure
expect(res.status).toBe(404);   // Resource not found
expect(res.status).toBe(409);   // Conflict / duplicate
```

**Response body shape:**
```typescript
// Check specific fields exist.
expect(res.body).toHaveProperty("id");
expect(res.body).toHaveProperty("createdAt");

// Check exact values.
expect(res.body.name).toBe("expected_name");

// Check array length.
expect(res.body).toHaveLength(3);

// Check error response shape.
expect(res.body).toHaveProperty("error");
expect(res.body.error).toMatch(/not found/i);
```

**Database state after request:**
```typescript
// Verify record was created.
const record = await prisma.template.findUnique({ where: { id: res.body.id } });
expect(record).not.toBeNull();
expect(record!.name).toBe("expected_name");

// Verify record was deleted.
const deleted = await prisma.template.findUnique({ where: { id } });
expect(deleted).toBeNull();

// Verify record count.
const count = await prisma.template.count();
expect(count).toBe(1);
```

**Webhook-specific assertions:**
```typescript
// Verify idempotency record was created.
const event = await prisma.webhookEvent.findUnique({
  where: { externalId: webhookId },
});
expect(event).not.toBeNull();
expect(event!.source).toBe("SHOPIFY");
```

### 6. Test Generation Checklist

Before writing the test file:

- [ ] Read the source route file to understand all endpoints and their shapes.
- [ ] Read the source service file to understand business logic and error cases.
- [ ] Check which Prisma models are involved (for seed factories and DB assertions).
- [ ] Confirm `server/src/test/setup.ts` exists. Create it if not.
- [ ] Confirm factory files exist for the relevant domain. Create if not.

After writing the test file:

- [ ] Every endpoint has at least one happy-path test and one error-path test.
- [ ] POST tests verify both the response AND the database state.
- [ ] DELETE tests verify the record is removed from the database.
- [ ] GET-by-ID tests cover both found and not-found cases.
- [ ] Webhook tests verify signature rejection (missing and invalid).
- [ ] Webhook tests verify idempotency (duplicate event is skipped).
- [ ] All tests use `beforeEach(resetDatabase)` for isolation.
- [ ] No `any` types in test code. Use factory return types or infer.
- [ ] Test file name is kebab-case with `.test.ts` suffix.
- [ ] All imports use ES modules.
- [ ] Tests do not depend on execution order within a describe block.
