---
description: >
  Enforce modern React best practices in the Qwertees WhatsApp Automation frontend.
  Triggers on: "review component", "react audit", "improve component", "check accessibility",
  "react best practices", "optimize component", and when building or modifying any React component
  in the client/ directory. Always apply these rules when writing React code.
---

# React Best Practices — Qwertees WhatsApp Automation

Apply these rules to all React code in `client/`. This project uses React 18+ with TypeScript
strict mode, Vite, shadcn/ui, Tailwind CSS, React Router, a centralized Axios client
(`client/src/lib/api.ts`), and a Socket.io singleton (`client/src/lib/socket.ts`).

---

## 1. Component Composition

- Keep components small and single-responsibility. One component does one thing.
- Extract a subcomponent when a file exceeds ~150 lines. Place shared components in
  `client/src/components/` and page-specific ones alongside the page file.
- Define prop types as named interfaces above the component, never inline:

```tsx
// Good
interface MessageBubbleProps {
  content: string;
  timestamp: Date;
  direction: "inbound" | "outbound";
}

export function MessageBubble({ content, timestamp, direction }: MessageBubbleProps) { ... }

// Bad — inline prop types
export function MessageBubble({ content, timestamp }: { content: string; timestamp: Date }) { ... }
```

- Prefer function declarations (`function Foo()`) over arrow-function components for top-level
  exports. Use arrow functions for inline callbacks.
- Use `children` via `React.ReactNode` when building wrapper/layout components.
- Co-locate closely related components in the same directory. Do not scatter tightly coupled
  components across the tree.

---

## 2. State Management

- Use `useState` for local UI state (toggle, input value, open/closed).
- Lift state only when two sibling components need the same data. Stop lifting at the nearest
  common parent — do not hoist to the page level unless truly necessary.
- Avoid prop drilling deeper than 2 levels. Prefer composition (passing children or render slots)
  over context for layout concerns.
- Use `useReducer` when:
  - State transitions depend on previous state in non-trivial ways.
  - Multiple state values change together (e.g., form with validation + submission status).
  - State logic is complex enough to benefit from a named action vocabulary.
- Type reducer actions as discriminated unions:

```tsx
type ChatAction =
  | { type: "SEND_MESSAGE"; payload: string }
  | { type: "RECEIVE_MESSAGE"; payload: Message }
  | { type: "SET_ERROR"; payload: string };
```

- Never store derived data in state. Compute it during render or with `useMemo`.

---

## 3. Performance

- Do NOT wrap everything in `useMemo` or `useCallback`. Only use them when:
  - A computation is genuinely expensive (filtering/sorting large lists, formatting complex data).
  - Referential equality matters because the value is a dependency of a child's `React.memo`,
    `useEffect`, or `useMemo`.
- Use `React.lazy` + `Suspense` for route-level code splitting in the router:

```tsx
const ConversationsPage = React.lazy(() => import("./pages/ConversationsPage"));
const TemplatesPage = React.lazy(() => import("./pages/TemplatesPage"));
```

- Provide a meaningful `<Suspense fallback>` (a spinner or skeleton, not a blank screen).
- Avoid premature optimization. Profile first with React DevTools before adding memoization.
- For lists that re-render frequently (e.g., live message feed), wrap the list item component in
  `React.memo` only after confirming unnecessary re-renders via profiling.

---

## 4. Custom Hooks

- Extract reusable logic into hooks in `client/src/hooks/`. Name them `useXxx`.
- A custom hook must call at least one React hook internally. If it does not, make it a plain
  utility function instead.
- Return a typed object (not an array) when returning more than 2 values:

```tsx
// Good
function useConversation(id: string) {
  // ...
  return { conversation, messages, isLoading, error, sendMessage };
}

// Bad — positional arrays are unreadable past 2 items
return [conversation, messages, isLoading, error, sendMessage];
```

- Always clean up in `useEffect`:

```tsx
useEffect(() => {
  const controller = new AbortController();
  fetchMessages(id, { signal: controller.signal });
  return () => controller.abort();
}, [id]);
```

- Use the Socket.io singleton from `client/src/lib/socket.ts` in hooks. Subscribe in `useEffect`,
  unsubscribe in the cleanup function:

```tsx
useEffect(() => {
  const handler = (msg: Message) => setMessages((prev) => [...prev, msg]);
  socket.on("new_message", handler);
  return () => { socket.off("new_message", handler); };
}, []);
```

---

## 5. Error Boundaries

- Wrap each page-level component in an error boundary.
- Provide a meaningful fallback UI — show what went wrong and offer a retry action:

```tsx
<ErrorBoundary fallback={<PageError onRetry={() => window.location.reload()} />}>
  <ConversationsPage />
</ErrorBoundary>
```

- Do NOT use error boundaries for expected errors (API failures, validation). Handle those with
  state (`isError`, toast notifications).
- Log caught errors to the console in the boundary's `componentDidCatch`.

---

## 6. Forms

- Use controlled components with shadcn/ui form primitives (`<Input>`, `<Select>`, `<Textarea>`).
- Track submission state explicitly:

```tsx
type FormStatus = "idle" | "submitting" | "success" | "error";
```

- Disable the submit button and show a spinner while `status === "submitting"`.
- Validate on blur for individual fields, validate all on submit.
- Show inline error messages below the relevant field using shadcn/ui's form message pattern.
- Reset form state after successful submission only when appropriate (e.g., message composer
  resets, but template editor does not).
- Prevent double submission — guard the submit handler:

```tsx
async function handleSubmit() {
  if (status === "submitting") return;
  setStatus("submitting");
  try { ... } catch { ... } finally { setStatus("idle"); }
}
```

---

## 7. Lists and Keys

- Always use a stable, unique identifier as the `key` (database ID, phone number, template name).
  Never use array index as a key.
- For long lists (>100 items, e.g., message history or customer list), use virtualization
  (`@tanstack/react-virtual` or similar). Render only visible items.
- When rendering a list of interactive items (conversations sidebar), ensure each item is a
  focusable element or contains one.

---

## 8. Accessibility

- Use semantic HTML elements: `<button>` for actions, `<a>` for navigation, `<nav>`, `<main>`,
  `<aside>`, `<section>` with headings.
- Never use `<div onClick>` as a button substitute. Use `<button>` or `<a>`.
- Add `aria-label` to every icon-only button:

```tsx
<Button variant="ghost" size="icon" aria-label="Send message">
  <SendIcon className="h-4 w-4" />
</Button>
```

- Keyboard navigation:
  - All interactive elements must be reachable via Tab.
  - Dialogs/modals must trap focus and close on Escape.
  - Dropdown menus must support arrow key navigation (shadcn/ui handles this — do not override).
- Announce dynamic content changes to screen readers. Use `aria-live="polite"` for non-urgent
  updates (new message count) and `aria-live="assertive"` for errors.
- Provide visible focus indicators. Do not remove the default outline without replacing it with a
  Tailwind `focus-visible:ring` equivalent.
- Ensure sufficient color contrast. Do not rely on color alone to convey information (e.g.,
  message status should have text or icon, not just a colored dot).
- Use `role="status"` for loading spinners so screen readers announce them.

---

## 9. TypeScript Patterns

- Model async UI state with discriminated unions, not separate booleans:

```tsx
// Good
type AsyncState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: string };

// Bad — allows impossible states like { isLoading: true, isError: true }
interface BadState<T> {
  isLoading: boolean;
  isError: boolean;
  data: T | null;
  error: string | null;
}
```

- Use generic types for reusable components:

```tsx
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) { ... }
```

- Type event handlers properly:

```tsx
function handleChange(e: React.ChangeEvent<HTMLInputElement>) { ... }
function handleSubmit(e: React.FormEvent<HTMLFormElement>) { ... }
function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) { ... }
```

- Prefer `interface` over `type` for object shapes (props, API responses). Use `type` for unions,
  intersections, and mapped types.
- Never use `any`. Use `unknown` and narrow with type guards when dealing with external data.

---

## 10. Data Fetching

- Use the centralized Axios instance from `client/src/lib/api.ts` for all API calls. Never
  import `axios` directly in components.
- Wrap fetch logic in custom hooks. Components should not contain raw `useEffect` + fetch patterns.
- Always handle loading, error, and empty states in the UI.
- Cancel in-flight requests on unmount using `AbortController`.
- Deduplicate requests — do not fire the same request from multiple components on the same page.

---

## 11. Anti-Patterns to Avoid

### Do NOT use useEffect for derived state

```tsx
// Bad — unnecessary state + effect
const [fullName, setFullName] = useState("");
useEffect(() => {
  setFullName(`${firstName} ${lastName}`);
}, [firstName, lastName]);

// Good — compute during render
const fullName = `${firstName} ${lastName}`;

// Good — useMemo if computation is expensive
const sortedMessages = useMemo(
  () => messages.slice().sort((a, b) => a.timestamp - b.timestamp),
  [messages]
);
```

### Do NOT fetch in useEffect without cleanup

```tsx
// Bad — no cancellation, potential state update on unmounted component
useEffect(() => {
  api.get("/conversations").then((res) => setData(res.data));
}, []);

// Good — use AbortController, handle in a custom hook
useEffect(() => {
  const controller = new AbortController();
  api.get("/conversations", { signal: controller.signal })
    .then((res) => setData(res.data))
    .catch((err) => {
      if (!controller.signal.aborted) setError(err.message);
    });
  return () => controller.abort();
}, []);
```

### Do NOT define functions inline in JSX when it causes re-renders

```tsx
// Bad — new function reference every render, breaks React.memo on child
<MessageList onSelect={(id) => setSelected(id)} />

// Good — stable reference
const handleSelect = useCallback((id: string) => setSelected(id), []);
<MessageList onSelect={handleSelect} />
```

Only apply `useCallback` here if `MessageList` is wrapped in `React.memo`. Otherwise the inline
arrow is fine and more readable.

### Do NOT create massive component files

Split files exceeding ~150 lines. Extract subcomponents, hooks, and utility functions. A page
file should primarily compose smaller pieces, not implement everything inline.

### Do NOT use CSS files or styled-components

Use Tailwind utility classes exclusively. If a set of classes repeats often, extract it into a
component — not a CSS class.

---

## Review Checklist

When auditing or reviewing a React component, verify:

1. Single responsibility — does the component do exactly one thing?
2. Props typed with a named interface.
3. No `any` types.
4. State is local where possible, lifted only when necessary.
5. No derived state stored in `useState`.
6. Effects have proper cleanup and dependency arrays.
7. Lists use stable keys (not indices).
8. All buttons/interactive elements are keyboard accessible.
9. Icon-only buttons have `aria-label`.
10. Loading, error, and empty states are handled.
11. File is under ~150 lines.
12. API calls go through `client/src/lib/api.ts`.
13. Socket subscriptions clean up on unmount.
