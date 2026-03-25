---
name: prisma-schema-updater
description: Manage Prisma schema changes for the Qwertees WhatsApp Automation project. Use when users want to add a field, add a column, create a new model, update the schema, modify the database, change database structure, add an enum, add a relation, add an index, or work with prisma migrations.
---

# Prisma Schema Updater

Manage all Prisma schema changes for the Qwertees WhatsApp Automation project: adding models, fields, enums, relations, indexes, and running migrations.

## Schema Location

- Schema file: `server/prisma/schema.prisma`
- Migrations directory: `server/prisma/migrations/`
- Prisma client output: `node_modules/.prisma/client`

## Workflow

Follow these steps for every schema change:

### 1. Read the Current Schema

Read `server/prisma/schema.prisma` to understand existing models, relations, and enums before making changes.

### 2. Plan the Change

Identify what needs to change:
- New model? Define fields, relations, indexes.
- New field on existing model? Determine type, nullability, default value.
- New enum? List all values.
- New relation? Determine cardinality (1:1, 1:N, N:M) and which side holds the foreign key.
- New index or constraint? Determine fields and uniqueness.

Check for conflicts with existing models, field names, or enum values.

### 3. Edit the Schema

Edit `server/prisma/schema.prisma` using the patterns below. Place new models after related existing models. Place new enums at the bottom of the file, grouped with other enums.

### 4. Validate the Schema

Run the following to catch syntax and logic errors before migrating:

```bash
cd server && npx prisma validate
```

Fix any errors before proceeding.

### 5. Create a Migration

For development (creates migration file and applies it):

```bash
cd server && npx prisma migrate dev --name descriptive-migration-name
```

Use kebab-case for migration names (e.g., `add-order-status-field`, `create-webhook-log-model`).

### 6. Generate the Prisma Client

If `migrate dev` was used, the client is regenerated automatically. Otherwise, run:

```bash
cd server && npx prisma generate
```

### 7. Verify

- Confirm the migration was created in `server/prisma/migrations/`.
- Confirm the schema compiles without errors.
- If the change affects existing services, update the relevant files in `server/src/services/` and `server/src/routes/` to use the new schema.

---

## Prisma Schema Patterns

### Model Definition

```prisma
model ModelName {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // fields here

  @@map("model_names") // table name in snake_case plural
}
```

- Use `cuid()` for string IDs or `autoincrement()` for integer IDs. Match what existing models use.
- Always include `createdAt` and `updatedAt` timestamps.
- Use `@@map()` only if the table name must differ from the model name.

### Field Types

| Prisma Type | PostgreSQL Type | Use For |
|-------------|----------------|---------|
| `String`    | `text`         | Names, phone numbers, IDs |
| `Int`       | `integer`      | Counts, quantities |
| `Float`     | `double precision` | Prices, percentages |
| `Decimal`   | `decimal(65,30)` | Monetary values needing precision |
| `Boolean`   | `boolean`      | Flags, toggles |
| `DateTime`  | `timestamp(3)` | Timestamps |
| `Json`      | `jsonb`        | Flexible/dynamic data |
| `BigInt`    | `bigint`       | Large numeric IDs |

### Required vs Optional Fields

```prisma
name      String   // required — cannot be null
nickname  String?  // optional — can be null
```

Make fields required by default. Use optional (`?`) only when:
- The field is not always known at creation time.
- The field is populated asynchronously (e.g., by a webhook).
- The field is genuinely optional in the domain.

### Default Values

```prisma
status    String   @default("PENDING")
isActive  Boolean  @default(true)
count     Int      @default(0)
createdAt DateTime @default(now())
id        String   @id @default(cuid())
```

### Enums

```prisma
enum MESSAGE_STATUS {
  SENT
  DELIVERED
  READ
  FAILED
}
```

- Name enums in UPPER_SNAKE_CASE.
- Name enum values in UPPER_SNAKE_CASE.
- Reference in models: `status MESSAGE_STATUS @default(SENT)`
- Group all enums at the bottom of the schema file.

### Relations

**One-to-Many (1:N):**

```prisma
model Customer {
  id            String         @id @default(cuid())
  conversations Conversation[]
}

model Conversation {
  id         String   @id @default(cuid())
  customerId String
  customer   Customer @relation(fields: [customerId], references: [id])

  @@index([customerId])
}
```

- The "many" side holds the foreign key field (`customerId`).
- Always add `@@index` on foreign key fields.
- Name the foreign key field as `relatedModelId` in camelCase.

**One-to-One (1:1):**

```prisma
model Customer {
  id      String   @id @default(cuid())
  profile Profile?
}

model Profile {
  id         String   @id @default(cuid())
  customerId String   @unique
  customer   Customer @relation(fields: [customerId], references: [id])
}
```

- Add `@unique` on the foreign key field for 1:1 relations.

**Many-to-Many (N:M) — Explicit Join Table:**

```prisma
model Template {
  id         String              @id @default(cuid())
  categories TemplateCategory[]
}

model Category {
  id        String              @id @default(cuid())
  templates TemplateCategory[]
}

model TemplateCategory {
  templateId String
  template   Template @relation(fields: [templateId], references: [id])
  categoryId String
  category   Category @relation(fields: [categoryId], references: [id])

  @@id([templateId, categoryId])
  @@index([categoryId])
}
```

- Prefer explicit join tables over implicit M:N for control over additional fields.

**Self-Relations:**

```prisma
model Message {
  id              String    @id @default(cuid())
  replyToId       String?
  replyTo         Message?  @relation("MessageReplies", fields: [replyToId], references: [id])
  replies         Message[] @relation("MessageReplies")
}
```

- Name self-relations explicitly with a relation name string.

### Indexes

```prisma
model Message {
  // fields...

  @@index([conversationId])              // single-field index
  @@index([customerId, createdAt])       // composite index
  @@unique([phone, templateId])          // unique constraint
}
```

- Add `@@index` on every foreign key field.
- Add `@@index` on fields frequently used in `WHERE` or `ORDER BY` clauses.
- Add `@@unique` for business-logic uniqueness constraints.

### Unique Constraints

```prisma
model Customer {
  phone String @unique  // field-level unique
}

model AutomationLog {
  // composite unique — one log per automation per checkout
  @@unique([automationId, checkoutId])
}
```

### JSON Fields

```prisma
model Template {
  components Json   // stores template component structure
  example    Json?  // optional JSON field
}
```

- Use `Json` for data with variable structure (e.g., WhatsApp template components, Shopify webhook payloads).
- Define a corresponding TypeScript interface in the service layer for type safety.
- Access with `Prisma.JsonValue` or cast in application code.

### Soft Deletes

```prisma
model Template {
  id        String    @id @default(cuid())
  deletedAt DateTime? // null = active, non-null = soft deleted

  @@index([deletedAt])
}
```

- Use `deletedAt DateTime?` — do not use a boolean `isDeleted` flag.
- Add `@@index([deletedAt])` for filtering performance.
- Add `where: { deletedAt: null }` in all queries by default in the service layer.

### Cascading Deletes

```prisma
model Conversation {
  customerId String
  customer   Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
}
```

- Use `onDelete: Cascade` when child records should be removed with the parent.
- Use `onDelete: SetNull` (with optional FK field) when the child should survive.
- Default is `onDelete: Restrict` — prevents deleting a parent with children.

---

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Model name | PascalCase, singular | `Customer`, `AutomationLog` |
| Field name | camelCase | `phoneNumber`, `createdAt` |
| Foreign key field | `relatedModelId` in camelCase | `customerId`, `conversationId` |
| Relation field | camelCase, singular or plural matching cardinality | `customer`, `messages` |
| Enum name | UPPER_SNAKE_CASE | `MESSAGE_STATUS`, `TEMPLATE_CATEGORY` |
| Enum value | UPPER_SNAKE_CASE | `SENT`, `IN_PROGRESS` |
| Index name | Auto-generated by Prisma (do not name manually) |  |
| Migration name | kebab-case, descriptive | `add-order-status-to-customer` |

---

## Migration Commands

### `npx prisma migrate dev --name <name>`

Use during development. Creates a new migration SQL file, applies it to the local database, and regenerates the Prisma client.

```bash
cd server && npx prisma migrate dev --name add-webhook-log-model
```

### `npx prisma migrate deploy`

Use in production/staging. Applies all pending migrations without creating new ones. Never use `migrate dev` in production.

```bash
cd server && npx prisma migrate deploy
```

### `npx prisma db push`

Use for rapid prototyping only. Pushes schema changes directly to the database without creating a migration file. Does not track changes. Avoid for anything that will be deployed.

```bash
cd server && npx prisma db push
```

### `npx prisma migrate reset`

Drops the database, recreates it, and applies all migrations. Destroys all data. Use only in development when the migration history is broken.

```bash
cd server && npx prisma migrate reset
```

### `npx prisma generate`

Regenerates the Prisma client from the schema without touching the database. Use after editing the schema if you are not running a migration.

```bash
cd server && npx prisma generate
```

### `npx prisma validate`

Validates the schema file for syntax and logic errors. Use before creating a migration.

```bash
cd server && npx prisma validate
```

---

## Gotchas and Safety

### Breaking Changes

These changes can cause data loss or downtime:

- **Dropping a field**: Data in that column is permanently deleted. Confirm with the user before removing any field.
- **Renaming a field**: Prisma treats this as a drop + create. To rename safely, add the new field, migrate, copy data in a data migration, then drop the old field.
- **Changing a field type**: May fail if existing data cannot be cast. Add a new field, migrate data, drop old field.
- **Making a field required (removing `?`)**: Fails if existing rows have `NULL`. Provide a `@default` value or backfill data first.
- **Dropping an enum value**: Fails if rows reference that value. Update rows first.

### Data Migrations

Prisma migrations are SQL-only. For data migrations:

1. Create the structural migration first (`migrate dev`).
2. Edit the generated SQL file in `server/prisma/migrations/<timestamp>_<name>/migration.sql` to add `UPDATE` statements before the migration is applied.
3. Alternatively, write a one-off script in `server/src/scripts/` and run it after the migration.

### Migration Conflicts

If multiple branches modify the schema:

1. Pull the latest from main.
2. Run `npx prisma migrate dev` — Prisma will detect drift and prompt to create a new migration.
3. Resolve any conflicts in `schema.prisma` manually, then re-run.

### Phone Number Fields

Always store phone numbers as `String` in E.164 format without the `+` prefix:

```prisma
phone String // e.g., "919876543210"
```

Never store phone numbers as `Int` or `BigInt`.

### Idempotency Fields

For webhook-driven models, add unique constraints to prevent duplicate processing:

```prisma
model CheckoutTracker {
  shopifyCheckoutId String @unique // prevents duplicate webhook processing
}
```

### Performance Considerations

- Add `@@index` on fields used in `WHERE`, `ORDER BY`, or `JOIN` conditions.
- For large tables, consider composite indexes matching common query patterns.
- Avoid indexing fields with low cardinality (e.g., boolean fields) unless combined in a composite index.
- Use `@@index([field1, field2])` with the most selective field first.

---

## Existing Key Models Reference

These models exist in the project schema. Check the current schema file for their exact definitions before modifying:

- **Customer** — WhatsApp contacts, identified by phone number (unique).
- **Conversation** — One per customer, tracks messaging window status.
- **Message** — Individual WhatsApp messages (inbound and outbound).
- **Template** — WhatsApp message templates synced from Meta.
- **Automation** — Rules mapping Shopify events to template messages.
- **AutomationLog** — Tracks which automations fired for which events (idempotency).
- **CheckoutTracker** — Tracks Shopify checkout events for abandoned cart logic.

When adding fields to these models, read the current schema first to avoid conflicts and maintain consistency with existing field patterns.
