---
description: TypeScript code style and naming conventions enforced across the entire codebase
globs: ["**/*.ts", "**/*.tsx"]
---

# Code Style Rules

## TypeScript

### Type Safety
- Strict mode enabled everywhere (`"strict": true` in tsconfig)
- ES modules only (`import/export`) — never use `require()` or `module.exports`
- Prefer `const` over `let` — never use `var`
- Use `async/await` — never raw Promises with `.then()` chains
- No `any` type — use `unknown` and narrow with type guards, or define proper interfaces
- Always add explicit return types to exported functions
- Use `interface` for object shapes, `type` for unions/intersections/primitives

### Type System Organization
- **Centralize enums and domain types** in `src/types/[domain].ts`
  - Example: `types/templates.ts` contains all template-related enums and interfaces
  - Benefits: Single source of truth, easy refactoring, type safety across entire domain
  - Example enums: `TemplateButtonType`, `TemplateComponentType`, `TemplateButtonGroupType`, `TemplateCategory`
- **Never use string literals for enum values** — always use centralized enums
  - ❌ Bad: `buttonGroup: 'QUICK_REPLY' | 'CTA'` in function signature
  - ✅ Good: `buttonGroup: TemplateButtonGroupType` from `types/templates.ts`
- **Infer types from Zod schemas** using `z.infer<typeof schema>`
  - Example: `type TemplateFormData = z.infer<typeof templateFormSchema>`
  - This ensures form data types match validation schema at compile time
- **Use type casting only with comments** explaining why the cast is safe
  - Example: `buttonGroup: buttonGroup as TemplateButtonGroupType` // useWatch returns string, safely narrowed to enum

### Design Tokens (Tailwind)
- **No hardcoded colors anywhere** — use Tailwind semantic tokens from `tailwind.config.ts`
- **Semantic color naming**:
  - ✅ Good: `bg-brand-800`, `text-ink-400`, `border-border`, `bg-background`
  - ❌ Bad: `bg-#128c7e`, `text-#8a948f`, inline `style={{ color: '#0b5d54' }}`
- **Custom WhatsApp tokens** defined in `tailwind.config.ts`:
  - `whatsapp-bezel`, `whatsapp-chat-bg`, `whatsapp-avatar-dark`, `whatsapp-avatar-light`
  - These are used consistently across phone preview and message components
- **Never use inline style attributes for colors** — use Tailwind classes instead
- **Update `tailwind.config.ts`** when adding new semantic colors across the app

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

### Import Organization
- Group imports: external packages first, then internal modules, then relative imports
- Use path aliases where configured (e.g., `@/` for `src/`)
- Remove unused imports — ESLint will flag these
- Never use wildcard imports (`import * as`) except for namespaced modules

### API Layer Import Rules
- **Pages and Components** can import from:
  - ✅ `src/components/`
  - ✅ `src/hooks/` (get data and handlers)
  - ✅ `src/lib/` (utilities, constants, Axios instance)
  - ✅ `src/types/` (type definitions)
  - ❌ `src/api/` (API layer — NOT allowed)
  - ❌ `src/features/` (Redux slice — NOT allowed, use hooks instead)

- **Hooks** can import from:
  - ✅ `src/api/` (async thunks)
  - ✅ `src/features/` (selectors, actions)
  - ✅ `src/lib/` (utilities, constants)
  - ✅ `src/types/` (type definitions)
  - ❌ `src/components/` (never import components in hooks)

- **API Layer (src/api/)** can import from:
  - ✅ `src/lib/api.ts` (centralized Axios)
  - ✅ `src/types/` (type definitions)
  - ✅ External packages (axios, redux-toolkit)
  - ❌ Hooks, components, or anything else

### Example Import Pattern
```typescript
// src/pages/Templates/TemplatesPage.tsx
import { useTemplates } from '@/hooks/templates';          // ✅ From hooks
import { TemplateCard } from '@/components/templates';    // ✅ From components
import { TEMPLATE_STATUS_CONFIG } from '@/lib/template-constants'; // ✅ From lib
import type { Template } from '@/types';                  // ✅ From types
// ❌ NOT: import { fetchTemplates } from '@/api/templates'
// ❌ NOT: import { templatesSlice } from '@/features/templates/templatesSlice'
```

```typescript
// src/hooks/templates/use-templates.ts
import { fetchTemplates } from '@/api/templates';         // ✅ From API layer
import { selectAllTemplates } from '@/features/templates/templatesSlice'; // ✅ From Redux
import { useAppDispatch } from '@/app/store';            // ✅ From Redux store
import type { Template } from '@/types';                  // ✅ From types
// ❌ NOT: import { TemplateCard } from '@/components/templates'
```
