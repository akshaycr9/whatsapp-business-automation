# Qwertees WhatsApp Automation

## Project Overview
Personal WhatsApp automation tool for the Qwertees Shopify store. Sends template messages on Shopify events, manages WhatsApp conversations, templates, and customers.

## Tech Stack
- **Frontend**: React 18+ (Vite) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Real-time**: Socket.io
- **APIs**: Meta WhatsApp Cloud API, Shopify Admin API

## Project Structure
Monorepo with `server/` and `client/` directories. Each has its own `package.json`.

## Coding Conventions

### General
- TypeScript strict mode everywhere
- Use ES modules (`import/export`), not CommonJS
- Prefer `const` over `let`, never use `var`
- Use async/await, never raw Promises with `.then()` chains
- No `any` types — use `unknown` and narrow, or define proper interfaces

### Backend (server/)
- Routes go in `src/routes/` — one file per resource (e.g., `template.routes.ts`)
- Business logic goes in `src/services/` — routes should be thin, services do the work
- Use Prisma for all database access — never write raw SQL
- All webhook endpoints must respond immediately (200) and process async
- Shopify webhooks: always verify HMAC before processing
- Meta webhooks: always verify signature before processing
- Phone numbers stored in E.164 format without `+` prefix (e.g., `919876543210`)
- Use `node-cron` for scheduled jobs, not `setInterval`

### Frontend (client/)
- Pages in `src/pages/`, components in `src/components/`
- Use shadcn/ui components — don't create custom UI primitives
- Use React Router for routing
- API calls go through `src/lib/api.ts` (centralized Axios instance)
- Socket.io client managed in `src/lib/socket.ts` (singleton)
- Custom hooks in `src/hooks/` for reusable logic
- No CSS files — use Tailwind utility classes only

### Naming
- Files: kebab-case (e.g., `abandoned-cart.service.ts`)
- React components: PascalCase files (e.g., `ConversationsPage.tsx`)
- Variables/functions: camelCase
- Types/interfaces: PascalCase
- Database enums: UPPER_SNAKE_CASE
- API routes: kebab-case URLs (e.g., `/api/sync-shopify`)

### Error Handling
- Backend: centralized error handler middleware, throw typed errors from services
- Frontend: toast notifications for user-facing errors via shadcn/ui toast
- Always log errors server-side before responding

### Environment Variables
- All env vars validated at startup in `server/src/config/env.ts`
- Never hardcode secrets or API keys
- Use `.env.example` as the source of truth for required vars

## Key Domain Rules
- One Conversation per Customer (identified by phone number)
- WhatsApp 24-hour messaging window: free-form replies only within 24h of customer's last message, otherwise must use templates
- Meta retains media for 30 days — we accept this limit, no local caching
- Abandoned cart delay: 60 minutes after checkout creation
- Shopify can send duplicate webhooks — use idempotency checks
- Template variables are positional ({{1}}, {{2}}) — map to Shopify data paths

## Do NOT
- Do not add authentication/auth middleware — this is a single-user tool
- Do not use ORMs other than Prisma
- Do not create REST endpoints that don't follow the established route pattern
- Do not install UI libraries other than shadcn/ui and Tailwind
- Do not store media files locally — use Meta's Media API
