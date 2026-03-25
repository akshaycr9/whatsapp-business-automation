---
description: >
  Enforce clean Tailwind CSS usage in the Qwertees WhatsApp Automation frontend.
  Triggers on: "review tailwind", "clean up styles", "make responsive",
  "tailwind audit", "fix styling", "review classes", or when building,
  editing, or reviewing any frontend component in client/.
---

# Tailwind CSS Best Practices — Qwertees WhatsApp Automation

## Stack Context

- React 18+ (Vite) + TypeScript
- Tailwind CSS with shadcn/ui
- shadcn/ui theming via CSS variables in `client/src/index.css`
- Utility for conditional classes: `cn()` from `client/src/lib/utils.ts`
- No CSS files beyond the root index.css — Tailwind utility classes only

---

## 1. Spacing Consistency

Use Tailwind's default spacing scale. Never invent arbitrary pixel values unless
the design demands an exact non-standard measurement.

### Allowed scale (reference)

| Class   | Value  | Typical use                        |
|---------|--------|------------------------------------|
| `p-1`   | 4px    | Tight inner padding (icons, badges)|
| `p-2`   | 8px    | Small component padding            |
| `p-3`   | 12px   | Input/button padding               |
| `p-4`   | 16px   | Card/section padding               |
| `p-6`   | 24px   | Page section padding               |
| `p-8`   | 32px   | Large section spacing              |
| `gap-2` | 8px    | Tight list items                   |
| `gap-3` | 12px   | Form fields                        |
| `gap-4` | 16px   | Card grids, sidebar items          |
| `gap-6` | 24px   | Page-level section separation      |

### Rules

- Prefer `gap-*` on flex/grid parents over `m-*` on children.
- Use `space-y-*` or `space-x-*` only when gap is unavailable (rare).
- When arbitrary values are acceptable:
  - Matching an external spec (e.g., WhatsApp chat bubble widths).
  - Pixel-perfect alignment with an image or logo asset.
  - Always add a comment: `{/* arbitrary: matches WhatsApp bubble max-width */}`.
- Never use arbitrary spacing like `p-[13px]` or `mt-[7px]` for general layout.

---

## 2. Responsive Design

### Mobile-first approach

Write base styles for mobile, then layer up with breakpoint prefixes:

```
base (< 640px) → sm (≥ 640px) → md (≥ 768px) → lg (≥ 1024px) → xl (≥ 1280px)
```

### App-specific breakpoint patterns

**Sidebar navigation:**
- Mobile: sidebar hidden, hamburger toggle, full-screen overlay.
- `md`: sidebar visible as a narrow icon rail (w-16).
- `lg`: sidebar fully expanded with labels (w-64).

```tsx
<aside className="hidden md:flex md:w-16 lg:w-64 flex-col border-r bg-background">
```

**Data tables → card layout:**
- Mobile: render each row as a stacked card.
- `md` and up: standard table layout.

```tsx
<div className="block md:hidden">  {/* Card view */}
<table className="hidden md:table"> {/* Table view */}
```

**Chat / conversation layout:**
- Mobile: conversation list OR chat detail (not both).
- `lg`: side-by-side split view.

```tsx
<div className="flex flex-col lg:flex-row h-full">
  <div className="w-full lg:w-80 lg:border-r">  {/* Conversation list */}
  <div className="flex-1 hidden lg:flex flex-col"> {/* Chat detail */}
```

### Rules

- Never use max-width media queries or `max-*` breakpoint variants.
- Test every page at 375px, 768px, and 1280px widths mentally or in browser.
- Use `w-full` as the mobile base; constrain with `max-w-*` at larger breakpoints.

---

## 3. Color System

Use shadcn/ui semantic CSS variables exclusively. Never hardcode hex/rgb values.

### Primary palette (via Tailwind classes)

| Purpose           | Background class     | Text class            |
|-------------------|----------------------|-----------------------|
| Page background   | `bg-background`      | `text-foreground`     |
| Cards / surfaces  | `bg-card`            | `text-card-foreground`|
| Primary actions   | `bg-primary`         | `text-primary-foreground` |
| Secondary actions | `bg-secondary`       | `text-secondary-foreground` |
| Muted / subtle    | `bg-muted`           | `text-muted-foreground` |
| Destructive       | `bg-destructive`     | `text-destructive-foreground` |
| Accents           | `bg-accent`          | `text-accent-foreground` |
| Borders           | `border-border`      | —                     |
| Inputs            | `bg-input`           | —                     |
| Rings / focus     | `ring-ring`          | —                     |

### Rules

- Never write `bg-[#1a1a2e]` or `text-[#e94560]`. Map to a CSS variable instead.
- If a new semantic color is needed, add it to the CSS variables in `index.css`
  and extend `tailwind.config.ts`, then use the new token.
- Use `bg-primary/10` (opacity modifier) for light tinted backgrounds.
- Status colors (delivered, read, failed) must also use semantic tokens:
  define `--status-delivered`, `--status-read`, `--status-failed` if needed.

---

## 4. Typography

### Size scale

| Element                      | Class                        |
|------------------------------|------------------------------|
| Small labels, timestamps     | `text-xs`                    |
| Body text, table cells       | `text-sm`                    |
| Emphasized body, inputs      | `text-base`                  |
| Section headings             | `text-lg font-semibold`      |
| Page titles                  | `text-xl font-semibold`      |
| Dashboard hero numbers       | `text-2xl font-bold`         |

### Rules

- Default body text is `text-sm` throughout the app. Do not use `text-base`
  as the general body size — this is a dense admin tool.
- Use `font-medium` for subtle emphasis (nav items, labels).
- Use `font-semibold` for headings and important labels.
- Use `font-bold` sparingly — only for large hero/stat numbers.
- Never set font-size with arbitrary values like `text-[15px]`.
- Use `leading-tight` or `leading-snug` for multi-line headings;
  `leading-normal` or `leading-relaxed` for body paragraphs.
- Use `tracking-tight` only on `text-xl` and above.

---

## 5. Component Layout Patterns

### Flex and Grid

- Use `flex` for one-dimensional layouts (navbars, toolbars, card rows).
- Use `grid` for two-dimensional layouts (dashboards, form layouts).
- Always use `gap-*` for spacing between children. Do not apply margins to
  individual children to create spacing.

```tsx
// Good
<div className="flex items-center gap-3">
  <Avatar />
  <span>Name</span>
</div>

// Bad — margin on children
<div className="flex items-center">
  <Avatar className="mr-3" />
  <span>Name</span>
</div>
```

### Overflow and scrolling

- Chat message lists: `overflow-y-auto` on the scroll container.
- Sidebar: `overflow-y-auto flex-1` to scroll within fixed height.
- Never put `overflow-hidden` on a parent that clips interactive content
  (dropdowns, tooltips). Use `overflow-visible` or restructure the DOM.

### Text truncation

- Single-line truncation: `truncate` (sets overflow-hidden, text-ellipsis,
  whitespace-nowrap).
- Multi-line truncation: `line-clamp-2` or `line-clamp-3`.
- Always set a `max-w-*` or width constraint on the truncation container.

```tsx
<p className="truncate max-w-[200px] text-sm text-muted-foreground">
  {message.body}
</p>
```

### Common component skeletons

**Page layout:**
```tsx
<div className="flex h-screen bg-background">
  <Sidebar />
  <main className="flex-1 flex flex-col overflow-hidden">
    <Header />
    <div className="flex-1 overflow-y-auto p-6">
      {/* Page content */}
    </div>
  </main>
</div>
```

**Card:**
```tsx
<div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
```

**Form section:**
```tsx
<div className="grid gap-4 sm:grid-cols-2">
  <div className="space-y-2">
    <Label>Field</Label>
    <Input />
  </div>
</div>
```

---

## 6. Dark Mode Readiness

### Rules

- Always use semantic color tokens (`bg-background`, `text-foreground`, etc.).
  These automatically adapt when dark mode is toggled via the `dark` class on
  `<html>`.
- Use the `dark:` variant only when semantic tokens do not cover the case:

```tsx
// Acceptable: adjusting opacity that differs in dark mode
<div className="bg-primary/5 dark:bg-primary/10">
```

- Never hardcode light-only colors like `bg-white` or `text-black`. Use
  `bg-background` and `text-foreground` instead.
- Test that `border-border` has sufficient contrast in both modes.
- Shadows: use `shadow-sm` or `shadow-md` — these are subtle enough for both
  modes. Avoid `shadow-lg` and above unless on modals/dialogs.

---

## 7. Anti-Patterns to Avoid

### Never do these

| Anti-pattern                          | Do instead                              |
|---------------------------------------|-----------------------------------------|
| `@apply` in CSS files                 | Use utility classes directly in JSX     |
| `style={{ color: '#fff' }}`           | `className="text-foreground"`           |
| `className="p-[13px]"`               | `className="p-3"` (12px, close enough) |
| `className="mt-4 mb-4"`             | `className="my-4"` or use `gap-4` on parent |
| `className="flex flex-row"`          | `className="flex"` (row is default)     |
| `className="items-stretch"`          | Remove it (stretch is default)          |
| Dynamic class: `` `text-${color}-500` `` | Use `cn()` with complete class strings |
| Wrapping everything in `<div>`        | Use semantic elements or fragments      |
| `className="w-[100%]"`              | `className="w-full"`                    |
| `className="hidden sm:hidden md:flex"` | `className="hidden md:flex"`           |
| Nested `overflow-hidden` containers   | Single scroll container at correct level|

### Redundant class pairs — remove the redundant one

- `flex flex-row` → `flex`
- `flex flex-col items-stretch` → `flex flex-col`
- `block` on a `<div>` → remove (already block)
- `static` on any element → remove (already static)
- `visible` → remove (already visible)

---

## 8. Class Ordering Convention

Order classes consistently for readability. Follow this sequence:

1. **Layout**: `flex`, `grid`, `block`, `inline-flex`, `relative`, `absolute`, `fixed`, `sticky`
2. **Flex/Grid modifiers**: `flex-col`, `flex-1`, `flex-shrink-0`, `grid-cols-*`, `col-span-*`
3. **Sizing**: `w-*`, `h-*`, `min-w-*`, `max-w-*`, `min-h-*`, `max-h-*`
4. **Spacing**: `p-*`, `px-*`, `py-*`, `m-*`, `mx-*`, `my-*`, `gap-*`, `space-y-*`
5. **Typography**: `text-*` (size), `font-*`, `leading-*`, `tracking-*`, `truncate`, `line-clamp-*`
6. **Colors**: `bg-*`, `text-*` (color), `border-*`, `ring-*`
7. **Borders / Shapes**: `border`, `rounded-*`, `divide-*`
8. **Effects**: `shadow-*`, `opacity-*`, `transition-*`, `animate-*`
9. **Responsive**: `sm:*`, `md:*`, `lg:*`, `xl:*`
10. **States**: `hover:*`, `focus:*`, `active:*`, `disabled:*`, `dark:*`

Example:
```tsx
<button className="inline-flex items-center h-9 px-4 text-sm font-medium bg-primary text-primary-foreground rounded-md shadow-sm hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
```

Use the `prettier-plugin-tailwindcss` plugin if available — it auto-sorts.

---

## 9. Performance

### Avoid dynamic class generation

Tailwind purges unused classes at build time. Dynamically constructed class
names are invisible to the purge scanner.

```tsx
// Bad — Tailwind cannot detect these classes
const bgColor = `bg-${status}-500`;

// Good — use complete literal strings with cn()
const bgColor = cn({
  "bg-green-500": status === "delivered",
  "bg-blue-500": status === "read",
  "bg-destructive": status === "failed",
});
```

### Use cn() for conditional classes

Import from `@/lib/utils`. Combines `clsx` + `tailwind-merge`.

```tsx
import { cn } from "@/lib/utils";

<div className={cn(
  "flex items-center gap-2 rounded-md p-2",
  isActive && "bg-accent text-accent-foreground",
  isDisabled && "pointer-events-none opacity-50"
)} />
```

### Rules

- Always use `cn()` when combining conditional classes. Never do manual
  string concatenation or template literals for class names.
- Prefer `cn()` over ternaries inside className:
  ```tsx
  // Good
  cn("p-2", isLarge && "p-4")

  // Avoid
  className={`p-2 ${isLarge ? "p-4" : ""}`}
  ```
- `cn()` handles Tailwind class conflicts automatically (last class wins),
  so `cn("p-2", "p-4")` produces `"p-4"`.

---

## 10. Audit Checklist

When reviewing Tailwind usage in any component, verify:

- [ ] No hardcoded hex/rgb colors — all colors use semantic tokens
- [ ] No arbitrary values where a standard scale value exists
- [ ] Spacing uses `gap-*` on parents, not margins on children
- [ ] Responsive classes follow mobile-first (no `max-*` breakpoints)
- [ ] Text sizes follow the established scale (xs/sm/base/lg/xl)
- [ ] No `@apply` usage in any CSS file
- [ ] No inline `style` attributes for things Tailwind can handle
- [ ] `cn()` used for all conditional class logic
- [ ] No dynamically generated class names
- [ ] Overflow handling is intentional and at the correct DOM level
- [ ] Truncation has a width constraint
- [ ] Dark mode: no `bg-white`, `text-black`, or other hardcoded light colors
- [ ] Redundant default classes removed (`flex-row`, `items-stretch`, etc.)
- [ ] Classes are reasonably ordered (layout → sizing → spacing → type → color)
