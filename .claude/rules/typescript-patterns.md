---
description: TypeScript patterns and best practices for type safety
globs: ["**/*.ts", "**/*.tsx"]
---

# TypeScript Patterns

## Discriminated Unions for State

Use discriminated unions for async state instead of separate booleans:

```typescript
// Good
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

// Bad — allows impossible states like loading=true AND error="something"
interface BadState<T> {
  loading: boolean;
  error: string | null;
  data: T | null;
}
```

## Interface vs Type

- `interface` for object shapes (extendable, better error messages)
- `type` for unions, intersections, mapped types, and primitives

```typescript
interface Customer { id: string; name: string; phone: string; }
type CustomerSource = 'SHOPIFY' | 'MANUAL';
type CreateCustomerInput = Omit<Customer, 'id'>;
```

## Generics

- Use generics for reusable utilities, not for one-off types
- Name generic params descriptively when meaning isn't obvious: `TResponse`, `TPayload`
- Constrain generics with `extends` when possible

```typescript
// API response wrapper
interface ApiResponse<TData> {
  data: TData;
  meta?: { total: number; cursor?: string };
}
```

## Strict Function Signatures

- Always type parameters — never rely on implicit `any`
- Add explicit return types to exported functions (inferred OK for private/local functions)
- Use `void` for functions that don't return a value
- Use `never` for functions that always throw

```typescript
export const findCustomer = async (id: string): Promise<Customer> => { ... }
export const deleteCustomer = async (id: string): Promise<void> => { ... }
const assertNever = (x: never): never => { throw new Error(`Unexpected: ${x}`); }
```

## Utility Types

Use built-in utility types instead of manually redefining shapes:

| Pattern | Use |
|---------|-----|
| `Partial<T>` | Update operations (all fields optional) |
| `Pick<T, K>` | Select specific fields |
| `Omit<T, K>` | Exclude fields (e.g., `Omit<Customer, 'id'>` for creation) |
| `Record<K, V>` | Key-value maps |
| `NonNullable<T>` | Remove null/undefined |

## Enums vs Union Types

- Prefer string union types for simple cases: `type Status = 'PENDING' | 'APPROVED' | 'REJECTED'`
- Use Prisma-generated enums for database values (they're already typed)
- Never use numeric enums

## Type Narrowing

- Use `in` operator, `instanceof`, or type predicates — not type assertions (`as`)
- Type assertions (`as`) are a last resort and must include a comment explaining why

```typescript
// Good — type predicate
const isAppError = (error: unknown): error is AppError =>
  error instanceof AppError;

// Avoid — type assertion without justification
const data = response as CustomerResponse; // Why is this safe?
```

## No Unsafe Patterns
- Never use `@ts-ignore` or `@ts-expect-error` without a JIRA/issue comment
- Never use `!` non-null assertion without verifying the value exists
- Never use `any` — use `unknown` and narrow
