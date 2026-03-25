---
description: Review code for quality, reuse opportunities, and efficiency. Identify duplication, complexity, type safety issues, missing error handling, and performance problems. Apply fixes directly.
triggers:
  - simplify
  - review code
  - code review
  - clean up
  - refactor
  - improve code quality
  - code quality
---

# Simplify — Code Quality Review & Refactor

## Overview

Review code for quality issues and apply fixes. Focus on duplication, complexity, type safety, error handling, performance, and security. Work across both `server/` and `client/` directories.

## Review Process

### Step 1: Identify Scope

1. Run `git diff --name-only` to find changed files. If no changes exist, ask the user which files or directories to review.
2. Read each changed file fully. Also read related files (imports, shared utilities, sibling modules) to understand context.
3. If the user specifies a file or directory, review that instead of git diff output.

### Step 2: Analyze for Issues

Scan every file in scope against the checklist below. Track each finding with a severity level.

### Step 3: Apply Fixes

Fix issues directly in the code. Group related fixes together. After fixing, re-read the file to confirm correctness.

### Step 4: Report

After all fixes are applied, output a summary table of findings and actions taken.

## What to Look For

### Critical Severity

#### Type Safety Violations
- `any` types anywhere — replace with proper interfaces or `unknown` with narrowing.
- Missing return types on exported functions and service methods.
- Untyped function parameters.
- Type assertions (`as`) that bypass safety — prefer type guards instead.
- Non-null assertions (`!`) without justification.

#### Missing Error Handling
- Async functions without try/catch or `.catch()`.
- Express route handlers missing error forwarding to `next()`.
- Prisma queries without error handling (especially `.findUniqueOrThrow`, `.delete`).
- Socket.io event handlers with no error wrapping.
- Missing validation on webhook payloads before processing.

#### Security Issues
- Hardcoded secrets, API keys, tokens, or credentials.
- Environment variables accessed directly instead of through `server/src/config/env.ts`.
- Missing HMAC verification on Shopify webhook handlers.
- Missing signature verification on Meta webhook handlers.
- User input passed directly to Prisma queries without sanitization.

### Warning Severity

#### Code Duplication
- Repeated logic across services — extract into a shared utility in `server/src/utils/`.
- Repeated API call patterns — centralize in `client/src/lib/api.ts`.
- Repeated Prisma query patterns — extract into a repository or helper function.
- Duplicate type definitions — consolidate into shared type files.
- Similar React components that differ only in props — create a generic component.

#### Overly Complex Functions
- Functions exceeding 30 lines — break into smaller, named functions.
- Deeply nested conditionals (>3 levels) — flatten with early returns or guard clauses.
- Long parameter lists (>4 params) — use an options object.
- Switch statements with >5 cases — consider a lookup map or strategy pattern.
- Complex boolean expressions — extract into descriptively named variables or functions.

#### Performance Problems
- **React**: Missing `useMemo`/`useCallback` on expensive computations or callbacks passed to child components. Unnecessary state causing re-renders. Large lists without virtualization.
- **Prisma**: N+1 queries — use `include` or `select` to fetch related data in one query. Missing `where` clauses causing full table scans. Queries inside loops — batch instead.
- **Express**: Synchronous operations blocking the event loop. Missing response in conditional branches (hanging requests). Large payloads without pagination.
- **General**: Redundant awaits in sequence that could be `Promise.all()`. Repeated expensive computations that should be cached.

#### Inconsistent Patterns
- File naming not matching conventions (kebab-case for non-component files, PascalCase for React components).
- Routes with business logic — move to services.
- Raw SQL instead of Prisma queries.
- `.then()` chains instead of async/await.
- `var` or `let` where `const` suffices.
- CSS files or inline styles instead of Tailwind utility classes.
- Direct `axios` calls instead of the centralized API instance.

### Info Severity

#### Dead Code
- Unused imports — remove them.
- Unused variables or functions — remove or mark with `_` prefix if intentionally unused.
- Commented-out code blocks — remove them (git preserves history).
- Unreachable code after return/throw statements.
- Empty catch blocks — at minimum, log the error.

#### Readability Improvements
- Magic numbers or strings — extract into named constants.
- Missing JSDoc on exported service functions.
- Inconsistent naming (e.g., mixing `data`/`result`/`response` for the same concept).
- Boolean parameters — prefer options objects with named keys.
- Long ternary expressions — convert to if/else or extract to a function.

## Fix Approach

### Extract and Reuse
- Move duplicated logic into `server/src/utils/` or `client/src/lib/`.
- Create shared TypeScript interfaces in dedicated type files.
- Extract repeated React patterns into custom hooks in `client/src/hooks/`.
- Consolidate repeated Prisma query patterns into helper functions.

### Simplify
- Replace nested conditionals with early returns.
- Convert complex boolean logic into named helper functions.
- Break long functions into smaller, single-responsibility functions.
- Replace imperative loops with declarative array methods (`map`, `filter`, `reduce`) where clearer.

### Strengthen Types
- Replace `any` with specific interfaces.
- Add explicit return types to all exported functions.
- Use discriminated unions for state management.
- Add Zod schemas for runtime validation of external data (webhooks, API responses).

### Remove Dead Code
- Delete unused imports, variables, and functions.
- Remove commented-out code.
- Remove unused dependencies from `package.json` if discovered.

### Add Error Handling
- Wrap async operations in try/catch.
- Add error forwarding in Express route handlers.
- Add fallback UI states for failed data fetches in React components.
- Ensure all Prisma operations handle potential failures.

## Output Format

After completing the review and applying fixes, output a summary:

```
## Code Review Summary

### Findings

| # | Severity | File | Issue | Action Taken |
|---|----------|------|-------|--------------|
| 1 | CRITICAL | server/src/services/order.service.ts | Missing error handling on Prisma query | Added try/catch with typed error |
| 2 | WARNING  | client/src/pages/ConversationsPage.tsx | Duplicated message formatting logic | Extracted to useMessageFormat hook |
| 3 | INFO     | server/src/routes/template.routes.ts | Unused import | Removed |

### Stats
- Files reviewed: X
- Issues found: X (critical: X, warning: X, info: X)
- Issues fixed: X
- Issues requiring manual review: X
```

List any issues that could not be auto-fixed and explain why they need manual attention.
