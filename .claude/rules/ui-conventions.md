---
description: UI design conventions for consistent, polished frontend
globs: ["client/src/**/*.tsx"]
---

# UI Conventions

## Component Library
- **shadcn/ui is the only UI library** — do not install Ant Design, MUI, Chakra, or any other
- Install components via `npx shadcn@latest add <component>`
- Components land in `client/src/components/ui/` — do not modify generated source files
- Customize via `className` prop, not by editing the component source

## Styling
- **Tailwind CSS only** — no CSS files, no inline styles, no styled-components
- Use shadcn/ui CSS variables for colors: `bg-background`, `text-foreground`, `bg-primary`, `text-muted-foreground`
- Never hardcode hex colors — always use semantic tokens
- Use `cn()` utility (from `lib/utils.ts`) for conditional class names

## Spacing System
- Follow a consistent 4px base grid:
  - `gap-1` (4px), `gap-2` (8px), `gap-3` (12px), `gap-4` (16px), `gap-6` (24px), `gap-8` (32px)
- Section padding: `p-6` for cards, `p-4` for compact areas
- Page padding: `p-6` or `p-8`
- Use `gap` between siblings, not `margin` — gap is more predictable in flex/grid layouts

## Page States (Required on Every Page)

### Loading State
- Use `Skeleton` components matching the layout shape
- Never show a blank screen or a plain spinner

### Empty State
- Friendly message explaining what will appear here
- Call-to-action button to create the first item
- Example: "No templates yet. Create your first template to get started."

### Error State
- Inline `Alert` component with error description
- "Try again" button that triggers refetch
- Never show raw error messages or technical details

## Typography
- Page titles: `text-2xl font-semibold`
- Section headings: `text-lg font-medium`
- Body text: `text-sm` (default for data-dense admin UIs)
- Muted/secondary text: `text-muted-foreground text-sm`
- Monospace for IDs/codes: `font-mono text-xs`

## Layout
- App shell: fixed sidebar (w-64) + scrollable content area
- Sidebar collapses to icons on mobile (below `md` breakpoint)
- Content area: `max-w-7xl mx-auto` for readability
- Mobile-first: base styles for mobile, then `sm:`, `md:`, `lg:` for larger screens

## Interactive Elements
- All buttons must have hover states (built into shadcn/ui)
- Focus rings on interactive elements for keyboard navigation
- Transitions: `transition-colors duration-150` for color changes
- Disabled states: `opacity-50 cursor-not-allowed`
- Loading buttons: show spinner icon + "Saving..." text, disable the button

## App-Specific Patterns

### Conversation List
- Avatar (initials or icon) + customer name + last message preview + timestamp
- Unread badge with count
- Active conversation highlighted with `bg-accent`

### Chat Messages
- Outbound: right-aligned, primary color bubble
- Inbound: left-aligned, muted color bubble
- Status ticks: single (sent), double (delivered), blue double (read)
- Timestamps: relative ("2m ago") for recent, absolute for older

### Dashboard Cards
- Stat cards: icon + label + large number + optional trend indicator
- Use `Card` component with consistent padding

### Data Tables
- Use shadcn/ui `Table` with sortable columns
- Row actions via `DropdownMenu` (three-dot menu)
- Pagination at bottom
- Search/filter bar above the table
