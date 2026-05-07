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
- **API calls**: New separation of concerns:
  - All async thunks (API operations) live in `src/api/` (e.g., `src/api/templates.ts`)
  - Centralized Axios instance at `src/lib/api.ts` (singleton with relative base URL `/api`)
  - Redux slice in `src/features/` handles state management and selectors only
  - Custom hooks in `src/hooks/` dispatch thunks and select from Redux, never make direct API calls
  - Components never import from `src/api/` — they import from hooks only
- Socket.io client managed in `src/lib/socket.ts` (singleton)
- Push subscription managed in `src/lib/push-subscription.ts` — call `registerPushSubscription()` after notification permission is granted
- Custom hooks in `src/hooks/` for reusable logic
- No CSS files — use Tailwind utility classes and design tokens only (no hardcoded hex colors)
- `vite.config.ts` uses `envDir: '..'` — all `VITE_*` vars go in the root `.env`, not in `client/.env`

#### Four-Layer Architecture with Separation of Concerns (strict — no exceptions)

```
PAGES (Composition)
    ↓
COMPONENTS (Presentational: UI only)  +  HOOKS (Logical: Data + State)
    ↓                                         ↓
Redux State (Selectors + Actions)           API Layer (Async Thunks)
    ↓                                         ↓
Centralized Axios Instance (lib/api.ts) ← Backend
```

**Layer responsibilities:**

1. **Pages** (`src/pages/`): Composition only
   - Assemble UI from components and hooks
   - Call custom hooks to get data and handlers
   - Pass data/callbacks as props to components
   - Wrap all handler props in `useCallback`
   - NO component definitions, NO business logic, NO direct Redux imports

2. **Components** (`src/components/<feature>/`): Presentational only
   - Receive all data and callbacks via typed props
   - Render UI (JSX only)
   - Emit events through callback props (`onClick`, `onSubmit`, `onChange`)
   - Use `React.memo` for list-rendered components
   - NO hooks that fetch data, NO Redux imports, NO API calls
   - Use config maps from `src/lib/` for conditional rendering (OPEN/CLOSED principle)

3. **Hooks** (`src/hooks/`): Logical data layer
   - Own one data domain (e.g., `use-templates.ts` owns templates)
   - Dispatch Redux actions and async thunks
   - Select from Redux state
   - Return stable data + memoized handlers
   - Memoize derived values with `useMemo`
   - NO JSX, NO component definitions
   - Examples:
     - `use-templates.ts`: Dispatches `fetchTemplates`, selects template list from Redux
     - `use-template-form-state.ts`: Manages form state with `useForm` and `useWatch`
     - `use-template-form-logic.ts`: Validates, transforms, and submits form data

4. **API Layer** (`src/api/`): Async operations
   - Contains all async thunks that make HTTP calls
   - Imports from centralized Axios instance (`lib/api.ts`)
   - Thunks handle request/response transformation
   - Returns API responses to Redux
   - Examples: `api/templates.ts` contains `fetchTemplates`, `createTemplate`, `deleteTemplate` thunks

5. **Redux State** (`src/features/`): State management only
   - Reducers: Handle state mutations from thunk results
   - Selectors: Export typed queries into state
   - Actions: Export types for external use
   - ExtraReducers: Handle fulfilled/pending/rejected states from thunks
   - NO business logic, NO API calls

6. **Utilities** (`src/lib/`): Pure functions
   - `template-utils.ts`: Extract variables, substitute samples, create buttons
   - `template-constants.ts`: Config maps for components (TEMPLATE_STATUS_CONFIG, ACTIVITY_CONFIG)
   - `utils.ts`: General utilities (cn(), date formatting, type guards)
   - `api.ts`: Centralized Axios singleton
   - NO dependencies on React, hooks, or components

#### Component Directory Structure
```
src/
  api/
    templates.ts     — Async thunks (CRUD operations on templates)
    [future-domain].ts — One API file per domain
  
  components/
    ui/              — shadcn/ui primitives (auto-generated, never modify)
    layout/          — AppShell, Sidebar, NotificationBell
    auth/            — ProtectedRoute
    conversations/   — ChatPanel, MessageBubble (memoized), ConversationListItem (memoized), 
                       ChatInput, TemplateSendDialog, DateSeparator, skeletons
    templates/       — TemplateForm, StatusBadge (config-driven), PhonePreview, TemplatePreviewPanel,
                       TemplatePreviewModal, TemplateNotFound, skeletons
    automations/     — AutomationFormDialog, LogsDialog, DeleteDialog, EventCards,
                       VariableMappingSection, ToggleSwitch
    customers/       — CustomerForm, CustomerAvatar, CustomerTableSkeleton
    dashboard/       — StatCard, ActivityIcon (config-driven), ActivityItem
  
  features/
    templates/
      templatesSlice.ts  — Redux slice with reducers, selectors, actions only (no thunks)
    [domain]/
      [domain]Slice.ts   — Redux state management per domain
  
  hooks/
    templates/
      use-templates.ts             — Dispatches async thunks, selects from Redux
      use-template-form-state.ts   — Form state management (useForm, useWatch, useFieldArray)
      use-template-form-logic.ts   — Form validation, preview data, submission logic
      use-edit-template-form.ts    — Edit-specific form initialization
    [domain]/
      use-[domain].ts — Domain-specific hooks that talk to API/Redux
  
  pages/
    Templates/
      TemplatesPage.tsx      — List, search, sync operations
      NewTemplatePage.tsx    — Form composition with preview panel
      EditTemplatePage.tsx   — Edit form with pre-populated data
  
  lib/
    api.ts                   — Centralized Axios instance (singleton)
    socket.ts                — Socket.io client (singleton)
    push-subscription.ts     — Service worker registration and push subscription
    template-utils.ts        — Pure utilities: variable extraction, text substitution, button creation
    automation-utils.ts      — Pure utilities: automation logic helpers
    template-constants.ts    — CONFIG MAPS for components (e.g., ACTIVITY_CONFIG, TEMPLATE_STATUS_CONFIG)
    utils.ts                 — General utilities (cn(), date formatting, etc.)
  
  types/
    index.ts                 — Shared interfaces and types
    templates.ts             — Template-specific enums and types (TemplateButtonType, TemplateButtonGroupType, etc.)
```

#### SOLID Principles (applied to React)

- **Single Responsibility**: 
  - One component = one job (e.g., `StatusBadge` renders status, `PhonePreview` renders phone mockup)
  - One hook = one data domain (e.g., `use-templates.ts` owns all template operations)
  - One API file = one resource (e.g., `api/templates.ts` owns template thunks)
  - Pure helpers go in `src/lib/`

- **Open/Closed**: 
  - Use config/lookup maps instead of if/else chains
  - Adding a new variant = one map entry, no code changes
  - Examples:
    - `TEMPLATE_STATUS_CONFIG`: Maps status to color, icon, label (instead of `if status === 'APPROVED'`)
    - `ACTIVITY_CONFIG`: Maps event type to icon and color (instead of big switch statement)
    - `EVENT_CONFIG`: Maps automation event to label and description
  - When adding a new status/event/variant: add entry to map, never modify component logic

- **Interface Segregation**: 
  - Props interfaces contain ONLY what the component renders
  - Never pass a full model object when only 2–3 fields are used
  - Example: `MessageBubbleProps` gets `text`, `timestamp`, `isOutbound`, not the full `Message` object
  - Map/transform at the page level, not in the component

- **Dependency Inversion**: 
  - Components never import hooks or dispatch to Redux
  - Dialogs and forms receive an `onSubmit` callback prop
  - The page injects dependencies (data and handlers as props)
  - Example: `TemplateForm` receives `form`, `headerText`, `onSubmit`, never calls `useTemplateFormLogic` directly

#### Type System & Design Tokens

**Type Centralization:**
- All domain-specific enums and interfaces live in `src/types/`
- Example: `types/templates.ts` contains:
  - `TemplateButtonType`: QUICK_REPLY | URL | PHONE_NUMBER | COPY_CODE
  - `TemplateComponentType`: HEADER | BODY | FOOTER | BUTTONS
  - `TemplateButtonGroupType`: QUICK_REPLY | CTA
  - `TemplateCategory`: MARKETING | UTILITY | AUTHENTICATION
  - Input/output interfaces: `CreateTemplateInput`, `UpdateTemplateInput`, `Template`
- Benefits: Single source of truth, type safety across API/hooks/components, easy refactoring

**Design Tokens (Tailwind):**
- No hardcoded hex colors anywhere in the codebase
- All colors come from Tailwind classes or design tokens in `tailwind.config.ts`
- WhatsApp-specific tokens (e.g., `whatsapp-bezel`, `whatsapp-chat-bg`) live in `tailwind.config.ts`
- Semantic color naming: `bg-brand-700`, `text-muted-foreground`, `border-border`, not `bg-#128c7e`
- Examples:
  - Button text: `text-white` not `text-#ffffff`
  - Phone header: `bg-brand-800` not `bg-#0b5d54`
  - Message timestamp: `text-ink-400` not `text-#8a948f`

#### React Performance Rules
- Wrap list-rendered components in `React.memo` — `MessageBubble`, `ConversationListItem`, `TemplateCard`, `StatCard`, `ActivityItem`, etc.
- Wrap all handler props passed to memoized children in `useCallback` at the page level
- Memoize selector factory calls: `const sel = useMemo(() => selectConvMessages(id), [id])` — never call a selector factory inline in `useAppSelector`
- Use `useMemo` for expensive derived values (variable extraction, filtered lists)
- Memoize derived state from Zod schemas or form data transformations

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

### Architecture & Separation of Concerns
- **Do NOT put async thunks in Redux slices** — they live in `src/api/` (one file per domain)
- **Do NOT import from `src/api/` in components** — only pages and hooks can import thunks
- **Do NOT put business logic in components** — components are presentational only
- **Do NOT put JSX in hooks** — hooks are purely logical (data + state management)
- **Do NOT hardcode colors** — use Tailwind tokens from `tailwind.config.ts`
- **Do NOT use string literals for enums** — always use centralized enums from `src/types/`
- **Do NOT dispatch Redux actions in components** — only hooks can dispatch
- **Do NOT pass full model objects as props** — map at the page level to only needed fields

### UI & Styling
- Do not hardcode hex colors anywhere — use Tailwind semantic tokens (e.g., `bg-brand-700`, `text-ink-400`)
- Do not create custom UI components — use shadcn/ui instead
- Do not create CSS files — use Tailwind utility classes only
- Do not use inline styles for colors or layout — use Tailwind classes

### Configuration & Deployment
- Do not add authentication/auth middleware — this is a single-user tool
- Do not use ORMs other than Prisma
- Do not create REST endpoints that don't follow the established route pattern
- Do not install UI libraries other than shadcn/ui and Tailwind
- Do not store media files locally — use Meta's Media API
- Do not put `VITE_*` vars in `client/.env` — they go in the root `.env` (Vite uses `envDir: '..'`)
- Do not access the app via HTTP local network URL for push testing — use the HTTPS ngrok URL

### Type Safety
- Do not use `any` types — use `unknown` and narrow, or define proper interfaces
- Do not use string unions for enums — use centralized enum types from `src/types/`
- Do not use type assertions (`as`) without a comment explaining why
- Do not make reducer states that allow impossible combinations (use discriminated unions)
