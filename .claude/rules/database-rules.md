---
description: Database conventions and Prisma ORM rules
globs: ["server/prisma/**", "server/src/services/**/*.ts"]
---

# Database Rules

## Prisma Only
- Use Prisma for ALL database access — never write raw SQL
- Never use `prisma.$queryRaw` or `prisma.$executeRaw` unless there is absolutely no Prisma equivalent
- Schema lives at `server/prisma/schema.prisma`

## Model Conventions
- Model names: PascalCase singular (`Customer`, not `Customers`)
- Field names: camelCase (`firstName`, `createdAt`)
- Foreign keys: `<relation>Id` (e.g., `customerId`, `templateId`)
- IDs: use `cuid()` default — `id String @id @default(cuid())`
- Every model must have `createdAt DateTime @default(now())`
- Every mutable model must have `updatedAt DateTime @updatedAt`

## Enum Conventions
- Enum names: PascalCase (`MessageStatus`, `ShopifyEvent`)
- Enum values: UPPER_SNAKE_CASE (`PREPAID_ORDER_CONFIRMED`)

## Phone Numbers
- Stored in E.164 format WITHOUT the `+` prefix
- Example: `919876543210` (not `+919876543210`)
- Phone field must be `String` with `@unique` constraint on Customer

## Relations
- Always define both sides of a relation
- One-to-one: use `@@unique([foreignKeyField])` on the child
- One-to-many: parent has `relation[]`, child has `@relation(fields: [...], references: [...])`
- Use `onDelete: Cascade` only when child records are meaningless without parent

## Indexes
- Add `@@index` on fields used in WHERE clauses and ORDER BY
- Always index foreign keys (Prisma does this automatically for @relation fields)
- Add composite indexes for common query patterns:
  - `@@index([conversationId, createdAt])` on Message (chat pagination)
  - `@@index([orderCreated, abandonedNotified, createdAt])` on CheckoutTracker

## JSON Fields
- Use `Json` type for flexible/dynamic data: `variableMapping`, `components`, `shopifyData`
- Always define a TypeScript interface for the expected JSON shape
- Validate JSON structure before writing to the database

## Migration Workflow
1. Edit `schema.prisma`
2. Run `npx prisma validate` to check syntax
3. Run `npx prisma migrate dev --name descriptive-name` to create migration
4. Run `npx prisma generate` to regenerate client
5. Verify the migration SQL in `prisma/migrations/`

## Idempotency
- Shopify webhooks: check `X-Shopify-Webhook-Id` before processing
- Use `upsert` for operations that might receive duplicates
- CheckoutTracker uses `shopifyCheckoutId @unique` for deduplication

## Performance
- Use `select` to fetch only needed fields on large queries
- Use `include` sparingly — avoid deeply nested includes (max 2 levels)
- Always use `take` (limit) on list queries — never fetch unbounded result sets
- Use cursor-based pagination for large datasets (messages)
