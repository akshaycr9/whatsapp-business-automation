---
name: express-route-generator
description: >
  Generates Express route + service file pairs for the Qwertees WhatsApp Automation backend.
  Activate when the user says "create route", "add route", "add endpoint", "new API",
  "add API for", "generate route", "create endpoint", "new endpoint", "add CRUD for",
  "scaffold route", or similar requests for backend API routes.
---

# Express Route + Service Generator

Generate a matched pair of route and service files for the Qwertees WhatsApp Automation
backend. Every API endpoint follows the same two-file pattern: a thin route file that
handles HTTP concerns and a service file that holds all business logic. This separation
keeps routes testable, swappable, and free of database coupling.

## Step-by-Step Process

### 1. Determine the Resource Name

Ask the user (or infer from context) what resource this route serves. Examples: `customer`,
`template`, `conversation`, `abandoned-cart`, `webhook`.

Derive the following from the resource name:

| Derived value       | Rule                              | Example (`abandoned-cart`) |
|---------------------|-----------------------------------|----------------------------|
| Route filename      | `{resource}.routes.ts`            | `abandoned-cart.routes.ts` |
| Service filename    | `{resource}.service.ts`           | `abandoned-cart.service.ts`|
| Route base path     | `/api/{resource}s`                | `/api/abandoned-carts`     |
| Router variable     | `{camelCase}Router`               | `abandonedCartRouter`      |
| Service class/obj   | `{camelCase}Service`              | `abandonedCartService`     |

Use kebab-case for filenames and URL paths. Use camelCase for variables. Pluralize the
URL path (customers, templates) unless the resource is uncountable.

### 2. Create the Service File

Place it at: `server/src/services/{resource}.service.ts`

The service file owns all business logic and database access. Routes never import Prisma
directly -- they call service functions instead. This means you can unit-test services
without spinning up Express, and you can swap the HTTP layer without touching logic.

#### Service Template

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// -- Types ------------------------------------------------------------------

export interface Create{Resource}Input {
  // Define the fields needed to create this resource.
  // Match these to the Prisma model but omit auto-generated fields (id, createdAt, etc.).
}

export interface Update{Resource}Input {
  // Partial version of create input. Use Partial<Create{Resource}Input> if appropriate,
  // or define explicitly when update has different rules.
}

// -- Service functions -------------------------------------------------------

export async function list{Resources}() {
  return prisma.{resource}.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function get{Resource}ById(id: string) {
  const record = await prisma.{resource}.findUnique({ where: { id } });
  if (!record) {
    throw new NotFoundError(`{Resource} ${id} not found`);
  }
  return record;
}

export async function create{Resource}(data: Create{Resource}Input) {
  return prisma.{resource}.create({ data });
}

export async function update{Resource}(id: string, data: Update{Resource}Input) {
  // Verify existence first so the caller gets a clear 404, not a Prisma error.
  await get{Resource}ById(id);
  return prisma.{resource}.update({ where: { id }, data });
}

export async function delete{Resource}(id: string) {
  await get{Resource}ById(id);
  return prisma.{resource}.delete({ where: { id } });
}
```

#### Service Rules

- Import `PrismaClient` at the top. Instantiate once per file (the module cache makes it
  a singleton in practice; a shared instance from a config file is even better if one
  exists at `server/src/config/prisma.ts`).
- Export plain async functions, not a class. Classes add ceremony without benefit here.
- Throw typed errors (`NotFoundError`, `ValidationError`, `ConflictError`) so the route
  layer can map them to HTTP status codes. If the project has a shared errors file at
  `server/src/utils/errors.ts`, import from there. Otherwise, create it (see Section 6).
- Never return HTTP status codes or response objects from services. Services know nothing
  about HTTP -- they return data or throw.
- Always `await` Prisma calls. Never return a dangling promise.
- Log errors before re-throwing when the error context would otherwise be lost.

### 3. Create the Route File

Place it at: `server/src/routes/{resource}.routes.ts`

The route file is a thin adapter between HTTP and the service layer. It parses request
data, calls the service, and formats the response. Keep it under ~80 lines for a standard
CRUD resource.

#### Route Template

```typescript
import { Router, Request, Response, NextFunction } from "express";
import * as {camelCase}Service from "../services/{resource}.service";

const router = Router();

// GET /api/{resources}
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await {camelCase}Service.list{Resources}();
    res.json(items);
  } catch (error) {
    next(error);
  }
});

// GET /api/{resources}/:id
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await {camelCase}Service.get{Resource}ById(req.params.id);
    res.json(item);
  } catch (error) {
    next(error);
  }
});

// POST /api/{resources}
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await {camelCase}Service.create{Resource}(req.body);
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

// PUT /api/{resources}/:id
router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await {camelCase}Service.update{Resource}(req.params.id, req.body);
    res.json(item);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/{resources}/:id
router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await {camelCase}Service.delete{Resource}(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
```

#### Route Rules

- Always wrap handler bodies in `try/catch` and call `next(error)` in the catch block.
  This hands errors to the centralized error middleware instead of crashing the process or
  swallowing failures silently.
- Use correct HTTP status codes:
  - `200` for successful GET/PUT
  - `201` for successful POST that creates a resource
  - `204` for successful DELETE (no body)
  - `400` for validation errors
  - `404` for not-found errors
  - `409` for conflict/duplicate errors
  - `500` falls through from the centralized error handler
- Type request params and body when the shape is known. Use Express generics:
  `Request<{ id: string }, unknown, CreateTemplateInput>`.
- Do not put business logic in route handlers. If you need an `if` statement that checks
  business rules, it belongs in the service.
- Export `default router` so the index file can import it cleanly.

### 4. Register the Route

Open `server/src/index.ts` (or `server/src/app.ts` or wherever routes are mounted) and
add:

```typescript
import {camelCase}Router from "./routes/{resource}.routes";

app.use("/api/{resources}", {camelCase}Router);
```

Place the import with the other route imports, sorted alphabetically. Mount the route
with the other `app.use` calls, in the same order.

### 5. Typed Errors (create once, reuse everywhere)

If `server/src/utils/errors.ts` does not exist, create it. The centralized error handler
inspects these classes to pick the right HTTP status code.

```typescript
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed") {
    super(message, 400);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource already exists") {
    super(message, 409);
  }
}
```

And the centralized error handler middleware (mount it last in Express):

```typescript
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  console.error(`[ERROR] ${err.name}: ${err.message}`, err.stack);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  res.status(500).json({ error: "Internal server error" });
}
```

### 6. Concrete Example: Template Resource

**`server/src/services/template.service.ts`**

```typescript
import { PrismaClient } from "@prisma/client";
import { NotFoundError } from "../utils/errors";

const prisma = new PrismaClient();

export interface CreateTemplateInput {
  name: string;
  language: string;
  category: string;
  components: Record<string, unknown>[];
  metaTemplateId: string;
}

export interface UpdateTemplateInput {
  name?: string;
  language?: string;
  category?: string;
  components?: Record<string, unknown>[];
}

export async function listTemplates() {
  return prisma.template.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function getTemplateById(id: string) {
  const template = await prisma.template.findUnique({ where: { id } });
  if (!template) {
    throw new NotFoundError(`Template ${id} not found`);
  }
  return template;
}

export async function createTemplate(data: CreateTemplateInput) {
  return prisma.template.create({ data });
}

export async function updateTemplate(id: string, data: UpdateTemplateInput) {
  await getTemplateById(id);
  return prisma.template.update({ where: { id }, data });
}

export async function deleteTemplate(id: string) {
  await getTemplateById(id);
  return prisma.template.delete({ where: { id } });
}
```

**`server/src/routes/template.routes.ts`**

```typescript
import { Router, Request, Response, NextFunction } from "express";
import * as templateService from "../services/template.service";

const router = Router();

router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const templates = await templateService.listTemplates();
    res.json(templates);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const template = await templateService.getTemplateById(req.params.id);
    res.json(template);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const template = await templateService.createTemplate(req.body);
    res.status(201).json(template);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const template = await templateService.updateTemplate(
      req.params.id,
      req.body,
    );
    res.json(template);
  } catch (error) {
    next(error);
  }
});

router.delete(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await templateService.deleteTemplate(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
);

export default router;
```

Registered in `server/src/index.ts`:

```typescript
import templateRouter from "./routes/template.routes";
app.use("/api/templates", templateRouter);
```

### 7. Non-CRUD Routes (Webhooks, Actions)

Not every route is CRUD. For action-oriented endpoints (e.g., `/api/sync-shopify`,
`/api/webhooks/shopify`), follow the same two-file pattern but tailor the handlers:

- Use POST for actions that trigger side effects.
- Webhook routes must respond 200 immediately, then process async. This prevents the
  sender from retrying while you are still working.
- Name the service function after the action: `syncShopifyProducts()`,
  `processShopifyWebhook()`.

```typescript
// server/src/routes/webhook.routes.ts
router.post(
  "/shopify",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Respond immediately so Shopify does not retry.
      res.status(200).json({ received: true });

      // Process asynchronously. Errors are logged inside the service.
      webhookService.processShopifyWebhook(req.body, req.headers).catch(
        (err) => console.error("[Webhook] Shopify processing failed:", err),
      );
    } catch (error) {
      next(error);
    }
  },
);
```

### 8. Pre-Generation Checklist

Before writing files, verify:

- [ ] Resource name is confirmed (kebab-case, singular for the file, plural for URL).
- [ ] Prisma model exists in `prisma/schema.prisma` for the resource. If not, prompt the
      user to create/update the schema first.
- [ ] `server/src/utils/errors.ts` exists. Create it if not.
- [ ] The centralized error handler middleware is mounted in the app entry point.

### 9. Post-Generation Checklist

After writing both files:

- [ ] Route file is at `server/src/routes/{resource}.routes.ts`.
- [ ] Service file is at `server/src/services/{resource}.service.ts`.
- [ ] Route is registered in `server/src/index.ts` (or `app.ts`).
- [ ] All service functions use `async/await`, not `.then()`.
- [ ] No `any` types anywhere. Use `unknown` and narrow, or define interfaces.
- [ ] Service throws typed errors (`NotFoundError`, `ValidationError`, etc.).
- [ ] Route handlers wrap everything in `try/catch` and call `next(error)`.
- [ ] POST returns `201`, DELETE returns `204`, GET/PUT return `200`.
- [ ] ES module imports/exports throughout (no `require`, no `module.exports`).
- [ ] File names are kebab-case, URL paths are kebab-case and pluralized.
- [ ] If this is a webhook route, it responds 200 before async processing.
