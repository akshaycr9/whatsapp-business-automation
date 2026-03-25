---
description: REST API design conventions for all backend endpoints
globs: ["server/src/routes/**/*.ts"]
---

# API Conventions

## URL Structure
- Base path: `/api/`
- Resource names: plural, kebab-case (`/api/customers`, `/api/automation-logs`)
- Nested resources: `/api/conversations/:id/messages`
- Actions: use verbs for non-CRUD operations (`/api/templates/:id/sync`, `/api/customers/sync-shopify`)
- Webhook paths: `/api/webhooks/meta`, `/api/webhooks/shopify`

## HTTP Methods & Status Codes

| Operation | Method | Success Code | Response |
|-----------|--------|-------------|----------|
| List resources | GET | 200 | `{ data: T[], meta: { total, cursor? } }` |
| Get single resource | GET | 200 | `{ data: T }` |
| Create resource | POST | 201 | `{ data: T }` |
| Update resource | PUT | 200 | `{ data: T }` |
| Partial update/toggle | PATCH | 200 | `{ data: T }` |
| Delete resource | DELETE | 204 | No body |
| Action endpoint | POST | 200 | `{ data: result }` |

## Error Response Format

```json
{
  "error": {
    "message": "Human-readable error description",
    "code": "MACHINE_READABLE_CODE",
    "statusCode": 400
  }
}
```

Standard error codes: `VALIDATION_ERROR`, `NOT_FOUND`, `DUPLICATE_ENTRY`, `RATE_LIMITED`, `INTERNAL_ERROR`

## Pagination

### Offset-based (tables: customers, templates, automations)
```
GET /api/customers?page=1&limit=20
Response meta: { total: 150, page: 1, limit: 20, totalPages: 8 }
```

### Cursor-based (infinite scroll: messages)
```
GET /api/conversations/:id/messages?cursor=<createdAt>&limit=50
Response meta: { cursor: "<next_cursor>", hasMore: true }
```

## Filtering & Search
- Query params for filtering: `?status=APPROVED&category=UTILITY`
- Search: `?search=<term>` (searches relevant text fields)
- Sorting: `?sort=createdAt&order=desc`

## Route File Structure

Every route file follows this pattern:
1. Import Express Router
2. Import service functions
3. Define route handlers (thin — just parse input, call service, send response)
4. Each handler wrapped in try/catch with `next(error)`
5. Export the router

```typescript
import { Router } from 'express';
import * as customerService from '../services/customer.service';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const result = await customerService.list(req.query);
    res.json({ data: result.items, meta: result.meta });
  } catch (error) {
    next(error);
  }
});

export default router;
```

## Route Registration
- All routes registered in `server/src/routes/index.ts`
- Pattern: `app.use('/api/customers', customerRoutes)`
- Webhook routes: `app.use('/api/webhooks', webhookRoutes)`

## Request Validation
- Validate request body, query, and params using Zod schemas
- Validation happens before the service call
- Invalid requests return 400 with specific field errors
