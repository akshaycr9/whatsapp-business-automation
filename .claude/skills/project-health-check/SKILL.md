---
description: Run a comprehensive project health check — TypeScript compilation, Prisma validation, ESLint, env vars, and more.
triggers:
  - health check
  - verify project
  - check everything
  - does it compile
  - project status
  - validate project
---

# Project Health Check

Run all checks below in order. Report results as a summary table at the end.

## Checks to Run

### 1. TypeScript Compilation (Server)

```bash
cd /Users/akshaythadani/Projects/qwertees-whatsapp-automation/server && npx tsc --noEmit
```

- Exit code 0 = PASS.
- Any output = type errors. Report each error with file path and line number.
- This also catches broken imports and missing modules.

### 2. TypeScript Compilation (Client)

```bash
cd /Users/akshaythadani/Projects/qwertees-whatsapp-automation/client && npx tsc --noEmit
```

- Same interpretation as server.

### 3. Prisma Schema Validation

```bash
cd /Users/akshaythadani/Projects/qwertees-whatsapp-automation/server && npx prisma validate
```

- Exit code 0 = PASS.
- Failure means the schema at `server/prisma/schema.prisma` has syntax or logic errors.

### 4. Prisma Client Generation

```bash
cd /Users/akshaythadani/Projects/qwertees-whatsapp-automation/server && npx prisma generate
```

- Exit code 0 = PASS.
- If this fails after validation passes, the generator config is likely misconfigured.
- If the generated client was stale, this fixes it. Note this in the report.

### 5. ESLint (Server)

```bash
cd /Users/akshaythadani/Projects/qwertees-whatsapp-automation/server && npx eslint src/ --ext .ts --no-warn-ignored 2>&1
```

- Zero errors = PASS. Warnings are acceptable — report count but still mark PASS.
- Errors = FAIL. Report error count and the first 10 errors.

### 6. ESLint (Client)

```bash
cd /Users/akshaythadani/Projects/qwertees-whatsapp-automation/client && npx eslint src/ --ext .ts,.tsx --no-warn-ignored 2>&1
```

- Same interpretation as server ESLint.

### 7. Environment Variables

Compare `.env.example` against `.env` to find missing variables.

```bash
cd /Users/akshaythadani/Projects/qwertees-whatsapp-automation
comm -23 <(grep -oP '^[A-Z_][A-Z0-9_]*' .env.example | sort) <(grep -oP '^[A-Z_][A-Z0-9_]*' .env | sort)
```

- No output = PASS (all vars present).
- Any output = WARN. List the missing variable names. Do NOT read or display actual values from `.env`.
- If `.env` does not exist, report FAIL and instruct to copy from `.env.example`.

### 8. Unused Dependencies (Optional)

```bash
cd /Users/akshaythadani/Projects/qwertees-whatsapp-automation/server && npx depcheck --ignores="@types/*,prisma,ts-node,typescript" 2>&1 | head -40
cd /Users/akshaythadani/Projects/qwertees-whatsapp-automation/client && npx depcheck --ignores="@types/*,typescript,@vitejs/*,autoprefixer,postcss,tailwindcss" 2>&1 | head -40
```

- Only run if `depcheck` is installed. If not, skip and mark as SKIPPED.
- Report any unused dependencies found. This is advisory only — mark WARN, never FAIL.

## How to Interpret and Fix Common Issues

### TypeScript errors
- **Missing module**: Run `npm install` in the affected directory. If the import path is wrong, fix it.
- **Type mismatch**: Check if Prisma client is stale (run `npx prisma generate`). Otherwise fix the type.
- **Cannot find name**: Usually a missing import statement. Add the import.

### Prisma errors
- **Schema validation failed**: Open `server/prisma/schema.prisma` and fix the reported syntax or relation error.
- **Generate failed**: Check the `generator` block in the schema. Ensure `prisma` and `@prisma/client` versions match in `package.json`.
- **Drift detected**: The database schema is out of sync. Run `npx prisma db push` (dev) or create a migration.

### ESLint errors
- **Unused variables**: Prefix with `_` or remove them.
- **Missing return type**: Add explicit return type annotations to exported functions.
- **Import order**: Let ESLint auto-fix with `npx eslint src/ --fix`.

### Missing env vars
- Copy the variable from `.env.example` into `.env` and fill in the real value.
- Check `server/src/config/env.ts` for which vars are required vs optional.

### Unused dependencies
- Verify the package is truly unused (depcheck can have false positives with Prisma, type packages, and build tools).
- If confirmed unused, run `npm uninstall <package>` in the relevant directory.

## Output Format

After running all checks, produce a summary table exactly like this:

```
## Health Check Results

| #  | Check                      | Status  | Details                        |
|----|----------------------------|---------|--------------------------------|
| 1  | TypeScript (server)        | PASS    |                                |
| 2  | TypeScript (client)        | PASS    |                                |
| 3  | Prisma validate            | PASS    |                                |
| 4  | Prisma generate            | PASS    | Client regenerated             |
| 5  | ESLint (server)            | PASS    | 3 warnings                     |
| 6  | ESLint (client)            | FAIL    | 2 errors (see below)           |
| 7  | Env vars                   | WARN    | Missing: SHOPIFY_STORE_DOMAIN  |
| 8  | Unused deps (optional)     | SKIPPED | depcheck not installed         |

Overall: 5 passed, 1 failed, 1 warning, 1 skipped
```

- Use PASS, FAIL, WARN, or SKIPPED as status values.
- After the table, list details for any FAIL or WARN items with the specific errors.
- If everything passes, end with: "All checks passed. The project is in good shape."
