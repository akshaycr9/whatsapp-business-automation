---
description: Security rules and practices for the application
globs: ["**/*.ts", "**/*.tsx"]
---

# Security Rules

## Secrets Management
- **Never hardcode** API keys, tokens, or secrets in source code
- All secrets go in `.env` and are validated at startup via `server/src/config/env.ts`
- `.env` is in `.gitignore` — never committed to version control
- `.env.example` documents required vars with placeholder values (never real secrets)
- Access env vars through the typed config object, never via `process.env` directly in services

## No Authentication (By Design)
- This is a **single-user tool** — no auth middleware, no login, no sessions
- Do not add authentication unless explicitly requested
- If deploying publicly, restrict access at the network level (VPN, IP whitelist, Cloudflare Access)

## Webhook Security
- **Shopify**: HMAC-SHA256 verification on every request using `SHOPIFY_WEBHOOK_SECRET`
- **Meta**: Signature verification using `META_APP_SECRET` on POST, token verification on GET
- Always use `crypto.timingSafeEqual` for comparison (prevents timing attacks)
- Never process an unverified webhook payload

## Input Validation
- Validate ALL request bodies with Zod schemas before processing
- Validate query parameters and URL params for expected types
- Sanitize strings: trim whitespace, strip HTML tags to prevent stored XSS
- Phone numbers: normalize to E.164 without `+`, validate 10-15 digit length
- Never trust client-provided IDs without verifying they exist in the database

## API Token Protection
- Meta access tokens must **never** be exposed to the frontend
- Use the `/api/media/:mediaId` proxy endpoint to fetch WhatsApp media server-side
- All Meta API calls happen server-side only
- Shopify access tokens are backend-only

## Database Security
- Use Prisma's parameterized queries (built-in SQL injection protection)
- Never concatenate user input into raw queries
- Limit query results with `take` — never return unbounded result sets

## Headers & CORS
- Configure CORS to allow only the frontend origin in production
- In development, allow `localhost` origins
- Set appropriate security headers (X-Content-Type-Options, X-Frame-Options)

## Error Information Leakage
- Never expose stack traces, database errors, or internal paths in API responses
- Log full error details server-side
- Return sanitized error messages to clients
- Never include the specific field that caused a unique constraint violation (just say "duplicate entry")

## Dependency Security
- Keep dependencies updated — run `npm audit` periodically
- Review new dependencies before installing (check download count, last update, known vulnerabilities)
- Pin exact versions in production (`--save-exact`)
