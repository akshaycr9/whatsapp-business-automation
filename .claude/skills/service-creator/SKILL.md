---
name: service-creator
description: >
  Generate backend service files for the Qwertees WhatsApp Automation project.
  Produces TypeScript service modules with Prisma DB access, typed interfaces,
  structured error handling, and logging. Triggers on: "create service",
  "add service for X", "new service", "business logic for X",
  "service layer for X", "implement X service".
---

# Service Creator Skill

Generate service files under `server/src/services/` that follow project conventions.

## File Naming

Use kebab-case with a `.service.ts` suffix.

```
server/src/services/<domain>.service.ts
```

Examples: `customer.service.ts`, `abandoned-cart.service.ts`, `whatsapp-template.service.ts`.

## Imports and Setup

Start every service file with these imports:

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
```

If the service calls another service, import it directly:

```typescript
import { sendTemplateMessage } from "./whatsapp.service";
```

If the service needs logging, import the project logger:

```typescript
import { logger } from "../config/logger";
```

If no project logger exists yet, use `console.error` / `console.info` as a placeholder and note it in comments.

## TypeScript Interfaces

Define input and output interfaces at the top of the file, directly above the functions that use them. Do not use `any`. Use `unknown` and narrow when the shape is genuinely unknown.

```typescript
interface CreateCustomerInput {
  phone: string; // E.164 without + prefix, e.g. "919876543210"
  name: string;
  email?: string;
}

interface CustomerResult {
  id: string;
  phone: string;
  name: string;
  email: string | null;
  createdAt: Date;
}
```

Rules:
- Prefix input interfaces with the function purpose and `Input` (e.g., `UpdateOrderInput`).
- Prefix output interfaces with the domain and `Result` (e.g., `OrderResult`).
- Export interfaces only when routes or other services need them.
- Mark optional fields with `?`, not `| undefined`.
- Phone numbers are always strings in E.164 format without the `+` prefix.

## Error Handling Pattern

Use a custom `AppError` class. If the file does not exist yet, create it at `server/src/utils/app-error.ts`:

```typescript
// server/src/utils/app-error.ts
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
```

In services, always log before throwing:

```typescript
import { AppError } from "../utils/app-error";
import { logger } from "../config/logger";

// Inside a function:
logger.error(`Customer not found: ${phone}`);
throw new AppError("Customer not found", 404);
```

Common status codes:
- `400` — bad input / validation failure
- `404` — resource not found
- `409` — conflict / duplicate (use for idempotency violations)
- `422` — unprocessable entity (valid format, invalid semantics)
- `500` — unexpected internal error (set `isOperational` to `false`)

Wrap unexpected errors in a try/catch and re-throw as `AppError`:

```typescript
try {
  const result = await prisma.customer.create({ data });
  return result;
} catch (error: unknown) {
  logger.error("Failed to create customer", error);
  if (error instanceof AppError) throw error;
  throw new AppError("Failed to create customer", 500, false);
}
```

## Service Function Pattern

Export named async functions. Do not export a class or default export.

```typescript
export async function functionName(input: InputType): Promise<ReturnType> {
  // 1. Validate input (throw 400 on failure)
  // 2. Business logic / Prisma queries
  // 3. Return typed result
}
```

Keep functions focused on a single responsibility. If a function exceeds ~60 lines, split it.

## Example: Simple CRUD Service

```typescript
// server/src/services/customer.service.ts
import { PrismaClient } from "@prisma/client";
import { AppError } from "../utils/app-error";
import { logger } from "../config/logger";

const prisma = new PrismaClient();

// --- Interfaces ---

interface CreateCustomerInput {
  phone: string;
  name: string;
  email?: string;
}

interface UpdateCustomerInput {
  name?: string;
  email?: string;
}

interface CustomerResult {
  id: string;
  phone: string;
  name: string;
  email: string | null;
  createdAt: Date;
}

// --- Functions ---

export async function createCustomer(
  input: CreateCustomerInput
): Promise<CustomerResult> {
  const existing = await prisma.customer.findUnique({
    where: { phone: input.phone },
  });

  if (existing) {
    logger.error(`Duplicate customer phone: ${input.phone}`);
    throw new AppError("Customer with this phone already exists", 409);
  }

  try {
    const customer = await prisma.customer.create({
      data: {
        phone: input.phone,
        name: input.name,
        email: input.email ?? null,
      },
    });
    return customer;
  } catch (error: unknown) {
    logger.error("Failed to create customer", error);
    throw new AppError("Failed to create customer", 500, false);
  }
}

export async function getCustomerByPhone(
  phone: string
): Promise<CustomerResult> {
  const customer = await prisma.customer.findUnique({
    where: { phone },
  });

  if (!customer) {
    logger.error(`Customer not found: ${phone}`);
    throw new AppError("Customer not found", 404);
  }

  return customer;
}

export async function updateCustomer(
  phone: string,
  input: UpdateCustomerInput
): Promise<CustomerResult> {
  await getCustomerByPhone(phone); // throws 404 if missing

  try {
    const updated = await prisma.customer.update({
      where: { phone },
      data: input,
    });
    return updated;
  } catch (error: unknown) {
    logger.error(`Failed to update customer: ${phone}`, error);
    throw new AppError("Failed to update customer", 500, false);
  }
}

export async function deleteCustomer(phone: string): Promise<void> {
  await getCustomerByPhone(phone);

  try {
    await prisma.customer.delete({ where: { phone } });
  } catch (error: unknown) {
    logger.error(`Failed to delete customer: ${phone}`, error);
    throw new AppError("Failed to delete customer", 500, false);
  }
}
```

## Example: Complex Service with Business Logic

```typescript
// server/src/services/abandoned-cart.service.ts
import { PrismaClient } from "@prisma/client";
import { AppError } from "../utils/app-error";
import { logger } from "../config/logger";
import { sendTemplateMessage } from "./whatsapp.service";

const prisma = new PrismaClient();

// --- Interfaces ---

interface ShopifyCheckout {
  id: string;
  token: string;
  cart_token: string;
  email: string | null;
  phone: string | null;
  abandoned_checkout_url: string;
  total_price: string;
  currency: string;
  line_items: Array<{ title: string; quantity: number }>;
  created_at: string;
}

interface AbandonedCartResult {
  id: string;
  shopifyCheckoutId: string;
  customerPhone: string;
  totalPrice: string;
  currency: string;
  messageSent: boolean;
  sentAt: Date | null;
}

// --- Constants ---

const ABANDONED_CART_DELAY_MS = 60 * 60 * 1000; // 60 minutes

// --- Functions ---

export async function processAbandonedCheckout(
  checkout: ShopifyCheckout
): Promise<AbandonedCartResult> {
  if (!checkout.phone) {
    logger.error(`Checkout ${checkout.id} has no phone number`);
    throw new AppError("Checkout has no phone number", 422);
  }

  const phone = normalizePhone(checkout.phone);

  // Idempotency: skip if already processed
  const existing = await prisma.abandonedCart.findUnique({
    where: { shopifyCheckoutId: checkout.id },
  });

  if (existing) {
    logger.info(`Checkout ${checkout.id} already processed, skipping`);
    return existing;
  }

  try {
    const record = await prisma.abandonedCart.create({
      data: {
        shopifyCheckoutId: checkout.id,
        customerPhone: phone,
        totalPrice: checkout.total_price,
        currency: checkout.currency,
        checkoutUrl: checkout.abandoned_checkout_url,
        itemSummary: buildItemSummary(checkout.line_items),
        messageSent: false,
        sentAt: null,
      },
    });

    // Schedule the message after the delay
    scheduleAbandonedCartMessage(record.id, ABANDONED_CART_DELAY_MS);

    return record;
  } catch (error: unknown) {
    logger.error(`Failed to process checkout ${checkout.id}`, error);
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to process abandoned checkout", 500, false);
  }
}

export async function sendAbandonedCartMessage(
  recordId: string
): Promise<void> {
  const record = await prisma.abandonedCart.findUnique({
    where: { id: recordId },
  });

  if (!record) {
    logger.error(`Abandoned cart record not found: ${recordId}`);
    throw new AppError("Abandoned cart record not found", 404);
  }

  if (record.messageSent) {
    logger.info(`Message already sent for record ${recordId}, skipping`);
    return;
  }

  // Check if the checkout was completed in the meantime
  const isRecovered = await checkIfCartRecovered(record.shopifyCheckoutId);
  if (isRecovered) {
    logger.info(`Cart ${record.shopifyCheckoutId} recovered, skipping message`);
    await prisma.abandonedCart.update({
      where: { id: recordId },
      data: { messageSent: false },
    });
    return;
  }

  try {
    await sendTemplateMessage({
      phone: record.customerPhone,
      templateName: "abandoned_cart_reminder",
      variables: [record.totalPrice, record.checkoutUrl],
    });

    await prisma.abandonedCart.update({
      where: { id: recordId },
      data: { messageSent: true, sentAt: new Date() },
    });
  } catch (error: unknown) {
    logger.error(`Failed to send abandoned cart message: ${recordId}`, error);
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to send abandoned cart message", 500, false);
  }
}

// --- Internal Helpers (not exported) ---

function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-\+\(\)]/g, "");
}

function buildItemSummary(
  items: Array<{ title: string; quantity: number }>
): string {
  return items.map((i) => `${i.title} x${i.quantity}`).join(", ");
}

function scheduleAbandonedCartMessage(
  recordId: string,
  delayMs: number
): void {
  setTimeout(() => {
    sendAbandonedCartMessage(recordId).catch((error) => {
      logger.error(
        `Scheduled abandoned cart message failed: ${recordId}`,
        error
      );
    });
  }, delayMs);
}

async function checkIfCartRecovered(
  shopifyCheckoutId: string
): Promise<boolean> {
  const order = await prisma.order.findFirst({
    where: { shopifyCheckoutId },
  });
  return order !== null;
}
```

## Connecting Services to Routes

Routes live in `server/src/routes/` and act as thin wrappers. They parse the request, call the service, and return the response. The centralized error handler catches any `AppError` thrown by services.

```typescript
// server/src/routes/customer.routes.ts
import { Router, Request, Response, NextFunction } from "express";
import {
  createCustomer,
  getCustomerByPhone,
  updateCustomer,
  deleteCustomer,
} from "../services/customer.service";

const router = Router();

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await createCustomer(req.body);
    res.status(201).json(customer);
  } catch (error) {
    next(error);
  }
});

router.get("/:phone", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await getCustomerByPhone(req.params.phone);
    res.json(customer);
  } catch (error) {
    next(error);
  }
});

router.patch("/:phone", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await updateCustomer(req.params.phone, req.body);
    res.json(customer);
  } catch (error) {
    next(error);
  }
});

router.delete("/:phone", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await deleteCustomer(req.params.phone);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
```

## Calling Other Services

Import named exports directly. Do not create barrel files or re-export through index files.

```typescript
import { getCustomerByPhone } from "./customer.service";
import { sendTemplateMessage } from "./whatsapp.service";

export async function notifyCustomer(phone: string): Promise<void> {
  const customer = await getCustomerByPhone(phone); // throws 404 if missing
  await sendTemplateMessage({
    phone: customer.phone,
    templateName: "order_update",
    variables: [customer.name],
  });
}
```

## Checklist Before Generating

When creating a new service, verify:

1. The file name is kebab-case with `.service.ts` suffix.
2. All functions are exported as named async functions.
3. Input and output interfaces are defined with proper types (no `any`).
4. Phone numbers use E.164 format without `+` prefix.
5. Errors are logged before being thrown as `AppError` instances.
6. Unexpected errors are caught and re-wrapped as `AppError` with status 500.
7. Idempotency is handled where Shopify webhooks may send duplicates.
8. Prisma is used for all database access (no raw SQL).
9. The `server/src/utils/app-error.ts` file exists (create it if not).
10. The corresponding route file is thin and delegates to the service.
