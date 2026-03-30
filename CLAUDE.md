# Qwertees WhatsApp Automation

## Project Overview
Personal WhatsApp automation tool for the Qwertees Shopify store. Sends template messages on Shopify events, manages WhatsApp conversations, templates, and customers. Supports iOS PWA push notifications so alerts arrive even when the app is closed.

## Tech Stack
- **Frontend**: React 18+ (Vite) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Real-time**: Socket.io
- **Push notifications**: Web Push API (VAPID) via `web-push` library
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
- API calls go through `src/lib/api.ts` (centralized Axios instance with relative base URL `/api`)
- Socket.io client managed in `src/lib/socket.ts` (singleton)
- Push subscription managed in `src/lib/push-subscription.ts` — call `registerPushSubscription()` after notification permission is granted
- Custom hooks in `src/hooks/` for reusable logic
- No CSS files — use Tailwind utility classes only
- `vite.config.ts` uses `envDir: '..'` — all `VITE_*` vars go in the root `.env`, not in `client/.env`

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
- `VITE_*` frontend vars go in the **root** `.env` (Vite is configured with `envDir: '..'`)

## Key Domain Rules
- One Conversation per Customer (identified by phone number)
- WhatsApp 24-hour messaging window: free-form replies only within 24h of customer's last message, otherwise must use templates
- Meta retains media for 30 days — we accept this limit, no local caching
- Abandoned cart delay: 60 minutes after checkout creation
- Shopify can send duplicate webhooks — use idempotency checks
- Template variables are positional ({{1}}, {{2}}) — map to Shopify data paths

## Push Notifications (Web Push / VAPID)

### How it works
1. On app open, if notification permission is `granted`, `registerPushSubscription()` registers `sw.js` as a service worker and calls `PushManager.subscribe()` using the VAPID public key
2. The resulting subscription object (endpoint + keys) is saved to the `PushSubscription` table via `POST /api/push/subscribe`
3. On every inbound WhatsApp message (`processInboundMessage` and `processInteractiveMessage`), the server calls `sendPushToAll()` which sends a Web Push notification to every stored subscription
4. Apple's APNs relay (or Google FCM for Android/desktop) delivers the notification to the device
5. `sw.js` wakes up, receives the `push` event, and shows the OS notification banner
6. Tapping the notification navigates to `/conversations`

The service worker only shows the OS notification if no app window is focused — the Socket.io in-app notification handles the foreground case (no duplicates).

### iOS requirements
- iOS 16.4+ only
- App **must** be added to Home Screen (Safari → Share → Add to Home Screen)
- App **must** be accessed via HTTPS — use the ngrok URL, not a local network HTTP URL
- In development: access via `https://[ngrok-url]/` (the Express backend proxies the Vite frontend in development)

### VAPID keys
Generated once and stored in root `.env`. To regenerate:
```bash
cd server
node -e "const wp=require('web-push'); const k=wp.generateVAPIDKeys(); console.log(JSON.stringify(k,null,2))"
```
Update both `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY` in `.env` **and** `VITE_VAPID_PUBLIC_KEY` (must match the public key). Regenerating invalidates all existing push subscriptions — users need to reopen the app to re-subscribe.

### Dev HTTPS proxy
In development (`NODE_ENV=development`), the Express server proxies all non-API requests to the Vite dev server at `http://localhost:5173` via `http-proxy-middleware`. This means the ngrok HTTPS URL serves both the API and the React app from a single origin — which is required for service worker registration.

- Backend still runs on port 3000, Vite still runs on port 5173
- Access the app at `https://[ngrok-url]/` (not `http://localhost:5173`) when testing push on iPhone
- `vite.config.ts` sets `allowedHosts: 'all'` so Vite accepts requests forwarded from the proxy

### Key files
| File | Purpose |
|---|---|
| `client/public/sw.js` | Service worker — handles `push` events and `notificationclick` |
| `client/public/manifest.json` | PWA manifest — required for iOS push eligibility |
| `client/src/lib/push-subscription.ts` | Registers SW, subscribes to push, saves subscription to server |
| `server/src/services/push.service.ts` | `sendPushToAll()` — sends Web Push to all stored subscriptions |
| `server/src/routes/push.routes.ts` | `POST/DELETE /api/push/subscribe` |

## Do NOT
- Do not add authentication/auth middleware — this is a single-user tool
- Do not use ORMs other than Prisma
- Do not create REST endpoints that don't follow the established route pattern
- Do not install UI libraries other than shadcn/ui and Tailwind
- Do not store media files locally — use Meta's Media API
- Do not put `VITE_*` vars in `client/.env` — they go in the root `.env` (Vite uses `envDir: '..'`)
- Do not access the app via HTTP local network URL for push testing — use the HTTPS ngrok URL
