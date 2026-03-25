---
name: env-validator
description: Manage environment variables for the Qwertees WhatsApp Automation project. Use when users want to add env var, environment variable, config, new secret, validate environment, add API key, update .env.example, or modify server config validation.
---

# Environment Variable Manager

Add, validate, and manage environment variables across the Qwertees WhatsApp Automation project. Every new env var requires updates to three files in a specific order.

## Three-File Update Pattern

When adding or modifying an environment variable, always update these three files in order:

### 1. `server/src/config/env.ts` — Validation and typed config object
### 2. `.env.example` — Documentation and source of truth for required vars
### 3. Any consuming service file that needs the new variable

Never skip a file. Never add an env var to application code without first adding it to the validation layer.

---

## File 1: `server/src/config/env.ts`

This file validates all environment variables at startup and exports a typed config object. Use Zod for schema validation.

### Template for adding a new variable

Add the new field to the Zod schema inside `envSchema`:

```typescript
import { z } from "zod";

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),

  // Meta WhatsApp Cloud API
  META_ACCESS_TOKEN: z.string().min(1),
  META_PHONE_NUMBER_ID: z.string().min(1),
  META_WABA_ID: z.string().min(1),
  META_VERIFY_TOKEN: z.string().min(1),
  META_APP_SECRET: z.string().min(1),

  // Shopify
  SHOPIFY_STORE_URL: z.string().url(),
  SHOPIFY_ACCESS_TOKEN: z.string().min(1),
  SHOPIFY_WEBHOOK_SECRET: z.string().min(1),

  // Server
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // === ADD NEW VARIABLE HERE ===
  // NEW_API_KEY: z.string().min(1),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:");
  for (const issue of parsed.error.issues) {
    console.error(`  ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
```

### Validation rules by variable type

| Type | Zod validator | Example |
|------|--------------|---------|
| Required string | `z.string().min(1)` | API keys, secrets |
| URL | `z.string().url()` | `DATABASE_URL`, store URLs |
| Port number | `z.coerce.number().int().positive().default(3000)` | `PORT` |
| Enum | `z.enum(["development", "production", "test"])` | `NODE_ENV` |
| Optional string | `z.string().optional()` | Feature flags |
| Optional with default | `z.string().default("fallback")` | Non-critical config |
| Phone number (E.164 no +) | `z.string().regex(/^\d{10,15}$/)` | Phone IDs |
| Boolean flag | `z.coerce.boolean().default(false)` | Debug toggles |

### Rules for env.ts

- Import and use Zod (`z`) for all validation. Do not write manual `if (!process.env.X)` checks.
- Call `process.exit(1)` on validation failure. The server must not start with invalid config.
- Log each missing/invalid variable name and the Zod error message. Never log the actual value of secrets.
- Group variables by service with comments (Meta, Shopify, Database, Server).
- Export `env` as a const (the parsed result) and `Env` as a type.

---

## File 2: `.env.example`

This file is the source of truth for which variables exist and what they do. It is committed to version control.

### Template for adding a new variable

```bash
# === Service Name ===
# Description of what this variable does and where to get it.
# Format: describe expected format if non-obvious
NEW_API_KEY=
```

### Rules for .env.example

- Never put real values in `.env.example`. Use empty strings or clearly fake placeholders like `your-api-key-here`.
- Add a comment above each variable explaining its purpose and where to obtain it.
- Group variables by service, matching the grouping in `env.ts`.
- Keep variables in the same order as `env.ts`.
- If a variable has a default in `env.ts`, note the default in the comment.

### Existing .env.example structure

```bash
# === Database ===
# PostgreSQL connection string
DATABASE_URL=

# === Meta WhatsApp Cloud API ===
# Permanent access token from Meta Business Suite
META_ACCESS_TOKEN=
# Phone number ID from WhatsApp Business API setup
META_PHONE_NUMBER_ID=
# WhatsApp Business Account ID
META_WABA_ID=
# Verify token you define for webhook verification
META_VERIFY_TOKEN=
# App secret from Meta App Dashboard (used for webhook signature verification)
META_APP_SECRET=

# === Shopify ===
# Store URL (e.g., https://your-store.myshopify.com)
SHOPIFY_STORE_URL=
# Admin API access token from Shopify custom app
SHOPIFY_ACCESS_TOKEN=
# Webhook signing secret from Shopify
SHOPIFY_WEBHOOK_SECRET=

# === Server ===
# Port for the Express server (default: 3000)
PORT=3000
# Environment: development | production | test
NODE_ENV=development
```

---

## File 3: Consuming code

### Accessing env vars in application code

Always import from the config module. Never use `process.env` directly outside of `env.ts`.

```typescript
// Correct
import { env } from "../config/env.js";

const client = new SomeAPI({ apiKey: env.NEW_API_KEY });

// WRONG - never do this
const key = process.env.NEW_API_KEY;
```

### Rules for consuming code

- Import `env` from `server/src/config/env.ts` using a relative path with `.js` extension (ES modules).
- Access variables as `env.VARIABLE_NAME` — they are fully typed via Zod inference.
- Never read `process.env` directly in routes, services, or middleware.
- Never pass the entire `env` object to external libraries. Extract only the needed fields.

---

## Security Rules

1. **Never log secret values.** Log the variable name only (e.g., `"META_ACCESS_TOKEN is missing"`, not the token itself).
2. **Never commit `.env`.** Verify `.env` is in `.gitignore`. Only `.env.example` is committed.
3. **Never hardcode secrets.** No API keys, tokens, or passwords in source code. Always read from `env`.
4. **Never expose secrets to the frontend.** The client/ directory must never import from server config. If the frontend needs a value, create a non-secret server endpoint.
5. **Rotate compromised secrets immediately.** If a secret is accidentally logged or committed, rotate it at the source (Meta, Shopify, etc.) and update `.env`.

---

## End-to-End Example: Adding a New API Key

Suppose you need to add a `SENTRY_DSN` for error tracking.

### Step 1: Update `server/src/config/env.ts`

Add to the Zod schema inside `envSchema`:

```typescript
const envSchema = z.object({
  // ... existing vars ...

  // Monitoring
  SENTRY_DSN: z.string().url().optional(),
});
```

Use `.optional()` because Sentry is not required for the server to function.

### Step 2: Update `.env.example`

Add at the bottom with a service group comment:

```bash
# === Monitoring ===
# Sentry DSN for error tracking (optional, get from sentry.io project settings)
SENTRY_DSN=
```

### Step 3: Update `.env` (local only, never committed)

```bash
SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
```

### Step 4: Use in application code

Create or update the relevant service file:

```typescript
// server/src/services/sentry.service.ts
import * as Sentry from "@sentry/node";
import { env } from "../config/env.js";

export function initSentry(): void {
  if (!env.SENTRY_DSN) {
    console.log("SENTRY_DSN not set, skipping Sentry initialization");
    return;
  }

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
  });
}
```

### Step 5: Verify

1. Remove the variable from `.env` and confirm the server starts (since it is optional).
2. Add an invalid value and confirm Zod prints a clear error.
3. Add the correct value and confirm the consuming service works.

---

## Checklist

Use this checklist every time you add or modify an environment variable:

- [ ] Added to `envSchema` in `server/src/config/env.ts` with appropriate Zod validator
- [ ] Added to `.env.example` with descriptive comment and service group
- [ ] Added to local `.env` file with actual value
- [ ] Consuming code imports from `config/env.js`, not `process.env`
- [ ] No secret values logged anywhere
- [ ] `.env` is in `.gitignore`
- [ ] Optional variables use `.optional()` or `.default()` in Zod schema
- [ ] Server starts cleanly with the new variable set
- [ ] Server fails fast with a clear error when a required variable is missing
