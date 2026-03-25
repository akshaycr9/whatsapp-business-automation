---
description: "Add input validation and sanitization to Express API endpoints using Zod schemas. Normalize phone numbers to E.164 without + prefix, validate request bodies/params/queries, sanitize strings against XSS."
triggers:
  - "validate input"
  - "sanitize"
  - "normalize phone"
  - "input validation"
  - "request validation"
  - "zod schema"
---

# Input Sanitizer Skill

Add Zod-based input validation and sanitization to API endpoints in the Qwertees WhatsApp Automation server.

## Setup

Install Zod if not already present:

```bash
cd server && npm install zod
```

## Core Validation Middleware

Create `server/src/middleware/validate.ts`:

```typescript
import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError, ZodEffects } from "zod";

type ValidatableSchema = AnyZodObject | ZodEffects<AnyZodObject>;

export const validate =
  (schema: ValidatableSchema) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: "Validation failed",
          details: error.errors.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
```

## Phone Number Normalization

Use this Zod transform everywhere phone numbers are accepted. Strip `+`, spaces, dashes, and parentheses, then validate E.164 format without the `+` prefix.

```typescript
import { z } from "zod";

export const phoneSchema = z
  .string()
  .transform((val) => val.replace(/[\s\-\(\)\+]/g, ""))
  .pipe(
    z
      .string()
      .regex(/^\d{10,15}$/, "Phone must be 10-15 digits in E.164 format without + prefix")
  );
```

Store as `919876543210`, never as `+91 98765 43210`.

## String Sanitization

Trim whitespace and strip HTML tags from user-supplied text to prevent stored XSS:

```typescript
export const sanitizedString = (opts?: { min?: number; max?: number }) =>
  z
    .string()
    .trim()
    .transform((val) => val.replace(/<[^>]*>/g, ""))
    .pipe(
      z.string()
        .min(opts?.min ?? 1, `Must be at least ${opts?.min ?? 1} characters`)
        .max(opts?.max ?? 500, `Must be at most ${opts?.max ?? 500} characters`)
    );
```

## Common Reusable Schemas

Place these in `server/src/schemas/common.schemas.ts`:

```typescript
import { z } from "zod";

// Pagination
export const paginationSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

// URL param with numeric ID
export const idParamSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive("ID must be a positive integer"),
  }),
});

// Email
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Invalid email address");

// URL
export const urlSchema = z
  .string()
  .trim()
  .url("Invalid URL")
  .refine((val) => val.startsWith("https://"), "URL must use HTTPS");

// Enum helper — use with Prisma enums
export const enumSchema = <T extends readonly [string, ...string[]]>(values: T) =>
  z.enum(values);

// Optional nullable string (common in Shopify data)
export const optionalString = z
  .string()
  .trim()
  .nullish()
  .transform((val) => val || null);
```

## Schema Patterns for Requests

### Body Validation

```typescript
const createCustomerSchema = z.object({
  body: z.object({
    phone: phoneSchema,
    name: sanitizedString({ min: 1, max: 200 }),
    email: emailSchema.optional(),
    shopifyCustomerId: z.string().optional(),
  }),
});
```

### Query Params Validation

Query params arrive as strings. Use `z.coerce` for numbers and booleans:

```typescript
const listCustomersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: sanitizedString({ max: 100 }).optional(),
    hasConversation: z.coerce.boolean().optional(),
  }),
});
```

### URL Params Validation

```typescript
const customerByIdSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});
```

### Combined Validation (params + body)

```typescript
const updateCustomerSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z.object({
    name: sanitizedString({ min: 1, max: 200 }).optional(),
    email: emailSchema.optional(),
    phone: phoneSchema.optional(),
  }),
});
```

## Example: Customer Routes

```typescript
import { Router } from "express";
import { validate } from "../middleware/validate";
import { createCustomerSchema, listCustomersSchema, customerByIdSchema } from "../schemas/customer.schemas";
import * as customerService from "../services/customer.service";

const router = Router();

router.post("/", validate(createCustomerSchema), async (req, res, next) => {
  try {
    const customer = await customerService.create(req.body);
    res.status(201).json(customer);
  } catch (error) {
    next(error);
  }
});

router.get("/", validate(listCustomersSchema), async (req, res, next) => {
  try {
    const result = await customerService.list(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", validate(customerByIdSchema), async (req, res, next) => {
  try {
    const customer = await customerService.getById(Number(req.params.id));
    res.json(customer);
  } catch (error) {
    next(error);
  }
});

export default router;
```

## Example: Template Creation Validation

```typescript
// server/src/schemas/template.schemas.ts
import { z } from "zod";
import { sanitizedString } from "./common.schemas";

const templateComponentSchema = z.object({
  type: z.enum(["HEADER", "BODY", "FOOTER", "BUTTONS"]),
  text: sanitizedString({ max: 1024 }).optional(),
  format: z.enum(["TEXT", "IMAGE", "VIDEO", "DOCUMENT"]).optional(),
  example: z.record(z.unknown()).optional(),
});

export const createTemplateSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .regex(/^[a-z0-9_]+$/, "Template name must be lowercase alphanumeric with underscores only")
      .min(1)
      .max(512),
    language: z
      .string()
      .trim()
      .regex(/^[a-z]{2}(_[A-Z]{2})?$/, "Language must be ISO format (e.g., en, en_US)"),
    category: z.enum(["MARKETING", "UTILITY", "AUTHENTICATION"]),
    components: z.array(templateComponentSchema).min(1).max(10),
  }),
});

export const sendTemplateSchema = z.object({
  body: z.object({
    templateName: z.string().trim().min(1),
    phone: phoneSchema,
    variables: z.record(z.string()).optional(),
  }),
});
```

## Rules

- Place all schemas in `server/src/schemas/` with the naming pattern `<resource>.schemas.ts`.
- Import `validate` middleware and apply it as the second argument in route handlers.
- Never skip validation on POST, PUT, or PATCH routes.
- Use `z.coerce` for query params and URL params that should be numbers or booleans.
- Always apply `phoneSchema` when accepting phone numbers — never store unformatted numbers.
- Run `sanitizedString()` on any free-text field that will be stored in the database.
- Keep route handlers thin: validate in middleware, process in services.
- Return 400 with structured error details on validation failure, never 500.
