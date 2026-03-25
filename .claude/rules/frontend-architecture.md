---
description: Frontend architecture patterns and conventions for the React client
globs: ["client/src/**/*.ts", "client/src/**/*.tsx"]
---

# Frontend Architecture Rules

## Directory Structure
```
client/src/
├── pages/           → One file per route (PascalCase: DashboardPage.tsx)
├── components/
│   ├── ui/          → shadcn/ui primitives (auto-generated, don't modify)
│   ├── layout/      → Shell, Sidebar, Header (shared layout components)
│   └── <feature>/   → Feature-specific components (conversations/, templates/, etc.)
├── hooks/           → Custom hooks (kebab-case: use-customers.ts)
├── lib/
│   ├── api.ts       → Centralized Axios instance (single source for all API calls)
│   ├── socket.ts    → Socket.io client singleton
│   └── utils.ts     → Shared utilities (cn(), formatDate(), etc.)
├── types/           → Shared TypeScript interfaces and types
├── App.tsx          → Route definitions
└── main.tsx         → Entry point
```

## API Client Pattern
- Single Axios instance at `lib/api.ts` with base URL configuration
- All API calls go through this instance — never create ad-hoc fetch/axios calls
- Interceptors handle: auth headers (if needed later), error transformation, response unwrapping

```typescript
// lib/api.ts
import axios from 'axios';
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
});
```

## Socket.io Pattern
- Singleton at `lib/socket.ts` — one connection shared across the app
- Connect on app mount, disconnect on unmount
- Components subscribe to events via custom hooks, not directly

```typescript
// lib/socket.ts
import { io } from 'socket.io-client';
export const socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:3000');
```

## Data Fetching Pattern
- Custom hooks in `hooks/` for each data resource
- Hooks encapsulate: loading state, error state, data, refetch function
- Use `useEffect` for initial fetch with cleanup
- Combine with Socket.io for real-time updates where needed

## React Router
- Route definitions in `App.tsx`
- Use `React.lazy()` for page-level code splitting
- Nested routes for shared layouts (sidebar + content area)

## State Management
- `useState` for local UI state (modals, form inputs, toggles)
- Custom hooks for server state (API data + loading/error)
- Lift state only when two sibling components need the same data
- No global state library needed for this single-user app — prop drilling + hooks is sufficient

## Component Rules
- Pages are containers: fetch data, manage state, compose components
- Components are presentational: receive props, render UI, emit events
- Extract a component when: it's reused, or a file exceeds ~150 lines
- One component per file (small helper components in the same file are OK)
