---
description: Git workflow and commit conventions
globs: ["**"]
---

# Git Conventions

## Commit Messages
- Format: `<type>(<scope>): <description>`
- Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `style`, `perf`
- Scope: `server`, `client`, `prisma`, `webhook`, `template`, `automation`, `chat`, `config`
- Description: imperative mood, lowercase, no period at end
- Keep subject line under 72 characters
- Add body for complex changes (blank line after subject)

### Examples
```
feat(server): add shopify webhook HMAC verification middleware
fix(client): handle expired media in conversation messages
refactor(server): extract phone normalization into shared utility
chore(prisma): add index on Message conversationId and createdAt
test(server): add integration tests for template CRUD endpoints
```

## Branch Naming
- Feature: `feature/<short-description>` (e.g., `feature/conversation-page`)
- Fix: `fix/<short-description>` (e.g., `fix/webhook-duplicate-handling`)
- Chore: `chore/<short-description>` (e.g., `chore/update-dependencies`)

## What NOT to Commit
- `.env` (contains secrets) — only `.env.example`
- `node_modules/`
- `dist/` and `build/` output directories
- `.prisma/` generated client (regenerated on install)
- OS files: `.DS_Store`, `Thumbs.db`
- IDE files: `.vscode/` (unless sharing settings), `.idea/`
- Large binary files

## Git Safety
- **Never force push** to `main` or `master`
- **Never use** `git reset --hard` without understanding what will be lost
- Prefer new commits over amending when possible
- Use `.gitignore` from day one

## PR Checklist
Before merging any PR, verify:
- [ ] TypeScript compiles without errors (`tsc --noEmit`)
- [ ] No ESLint errors
- [ ] Prisma schema is valid (`npx prisma validate`)
- [ ] New env vars added to `.env.example`
- [ ] No secrets in committed code
- [ ] Loading/error/empty states handled (frontend changes)
- [ ] Webhook handlers respond 200 immediately (webhook changes)
