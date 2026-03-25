---
description: TypeScript code style and naming conventions enforced across the entire codebase
globs: ["**/*.ts", "**/*.tsx"]
---

# Code Style Rules

## TypeScript
- Strict mode enabled everywhere (`"strict": true` in tsconfig)
- ES modules only (`import/export`) — never use `require()` or `module.exports`
- Prefer `const` over `let` — never use `var`
- Use `async/await` — never raw Promises with `.then()` chains
- No `any` type — use `unknown` and narrow with type guards, or define proper interfaces
- Always add explicit return types to exported functions
- Use `interface` for object shapes, `type` for unions/intersections/primitives

## Naming Conventions

| What | Convention | Example |
|------|-----------|---------|
| Files (backend) | kebab-case | `abandoned-cart.service.ts` |
| Files (React components) | PascalCase | `ConversationsPage.tsx` |
| Variables & functions | camelCase | `sendTemplateMessage()` |
| Types & interfaces | PascalCase | `CustomerResponse` |
| Database enums | UPPER_SNAKE_CASE | `PREPAID_ORDER_CONFIRMED` |
| API route URLs | kebab-case | `/api/sync-shopify` |
| Environment variables | UPPER_SNAKE_CASE | `META_ACCESS_TOKEN` |
| CSS/Tailwind classes | kebab-case (Tailwind default) | `bg-primary text-sm` |

## Formatting
- Use Prettier for formatting — do not manually adjust whitespace
- Use ESLint for linting — fix all errors before committing
- Prefer early returns over deeply nested if/else blocks
- Keep functions under 30 lines — extract helpers when exceeding this
- Keep files under 300 lines — split into modules when exceeding this
- One export per file for services and routes; multiple named exports OK for utilities and types

## Imports
- Group imports: external packages first, then internal modules, then relative imports
- Use path aliases where configured (e.g., `@/` for `src/`)
- Remove unused imports — ESLint will flag these
- Never use wildcard imports (`import * as`) except for namespaced modules
