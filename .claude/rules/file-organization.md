---
description: File organization and placement rules for the monorepo
globs: ["**"]
---

# File Organization Rules

## Monorepo Structure
```
qwertees-whatsapp-automation/
├── server/              → Express backend
├── client/              → React frontend (Vite)
├── .claude/             → Claude Code config (settings, skills, rules)
├── docker-compose.yml   → Local dev services (PostgreSQL)
├── .env                 → Secrets (gitignored)
├── .env.example         → Env var documentation (committed)
├── package.json         → Root scripts (concurrently runs both)
└── CLAUDE.md            → Project rules for Claude
```

## Backend File Placement (server/src/)

| Directory | What Goes Here | Naming | Example |
|-----------|---------------|--------|---------|
| `routes/` | Express route handlers (thin) | `<resource>.routes.ts` | `template.routes.ts` |
| `routes/webhooks/` | Webhook endpoints | `<source>.webhook.ts` | `shopify.webhook.ts` |
| `services/` | Business logic | `<resource>.service.ts` | `automation.service.ts` |
| `middleware/` | Express middleware | `<purpose>.ts` | `error-handler.ts` |
| `config/` | App configuration | `<purpose>.ts` | `env.ts` |
| `jobs/` | Cron/scheduled tasks | `<purpose>.job.ts` | `abandoned-cart.job.ts` |
| `socket/` | Socket.io event handlers | `index.ts` | `index.ts` |
| `utils/` | Shared utilities | `<purpose>.ts` | `logger.ts` |
| `lib/` | External API clients | `<service>.ts` | `meta-api.ts` |

## Frontend File Placement (client/src/)

| Directory | What Goes Here | Naming | Example |
|-----------|---------------|--------|---------|
| `pages/` | Route-level page components | `<Name>Page.tsx` | `ConversationsPage.tsx` |
| `components/ui/` | shadcn/ui primitives | Auto-generated | `button.tsx` |
| `components/layout/` | App shell, sidebar, header | `<Name>.tsx` | `Sidebar.tsx` |
| `components/<feature>/` | Feature-specific components | `<Name>.tsx` | `MessageBubble.tsx` |
| `hooks/` | Custom React hooks | `use-<name>.ts` | `use-customers.ts` |
| `lib/` | Utilities, API client, socket | `<purpose>.ts` | `api.ts` |
| `types/` | Shared TypeScript types | `<domain>.ts` or `index.ts` | `index.ts` |

## Naming Rules Summary

| Context | Convention | Example |
|---------|-----------|---------|
| Backend files | kebab-case | `abandoned-cart.service.ts` |
| React component files | PascalCase | `ConversationsPage.tsx` |
| Hook files | kebab-case with `use-` prefix | `use-templates.ts` |
| Test files | kebab-case with `.test.ts` suffix | `template.routes.test.ts` |
| Type files | kebab-case or `index.ts` | `types/index.ts` |

## One Responsibility Per File
- One route resource per route file
- One service per service file
- One page component per page file
- One hook per hook file (small related hooks can share a file)
- Shared types can live in `types/index.ts` or split by domain

## Where NOT to Put Things
- Business logic does NOT go in routes — only in services
- Database queries do NOT go in routes — only in services via Prisma
- API calls (frontend) do NOT go in components — only in hooks via `lib/api.ts`
- Socket.io subscriptions do NOT go directly in components — use custom hooks
- CSS does NOT exist — use Tailwind classes inline
- Media files are NOT stored locally — use Meta's Media API
