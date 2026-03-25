---
description: Error handling patterns for backend services and frontend components
globs: ["**/*.ts", "**/*.tsx"]
---

# Error Handling Rules

## Backend: AppError Class

All service errors must use a typed `AppError` class:

```typescript
class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}
```

### Service Layer
- Throw `AppError` with appropriate HTTP status codes from services
- Always log the error before throwing: `logger.error('Context:', error)`
- Use specific status codes: 400 (bad input), 404 (not found), 409 (conflict/duplicate), 422 (validation), 429 (rate limited), 500 (unexpected)
- Never swallow errors silently — always log or rethrow
- Wrap external API calls (Meta, Shopify) in try/catch with meaningful error messages

### Route Layer
- Routes are thin — just call the service and pass errors to `next(error)`
- Never put business logic error handling in routes
- Every route handler must have try/catch calling `next(error)` in the catch block

### Centralized Error Middleware
- Single error handler at `server/src/middleware/error-handler.ts`
- Logs the full error server-side (stack trace included)
- Returns sanitized JSON to the client: `{ error: { message, code, statusCode } }`
- Never expose stack traces or internal details to clients
- Handle Prisma-specific errors (P2002 unique constraint, P2025 not found)

### Webhook Error Isolation
- Webhook processing errors must NEVER affect the 200 response
- Pattern: respond 200 first, then process in a `.catch()` block that logs but doesn't throw

## Frontend: User-Facing Errors

### Toast Notifications
- Use shadcn/ui toast for all user-facing error messages
- Error toasts: red/destructive variant with clear message
- Success toasts: default variant, brief confirmation
- Never show raw error messages or stack traces to users

### Loading/Error/Empty States
Every page and data-fetching component must handle three states:
1. **Loading**: Show Skeleton components (never a blank screen)
2. **Error**: Show inline alert with retry action
3. **Empty**: Show friendly message with call-to-action

### Error Boundaries
- Wrap each page-level route in an error boundary
- Error boundary shows a fallback UI with "Something went wrong" and a retry button
- Log caught errors to console (and optionally to a monitoring service later)
