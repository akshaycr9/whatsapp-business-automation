---
name: ui-ux-designer
description: Review and improve the visual design, layout, and polish of any frontend page or component. Use when the user says "review design", "make this look professional", "improve UI", "design the layout", "polish this page", "make it look better", "UI review", "design review", "fix the styling", "make it pretty", "improve UX", "clean up the UI", or when the user is building, editing, or scaffolding any frontend component, page, or screen. Activate proactively whenever frontend code is being written or modified to ensure visual quality.
---

# UI/UX Designer

Apply these principles to every frontend page and component in the Qwertees WhatsApp Automation project. The goal is a dashboard that feels sharp, consistent, and easy to scan — even though it is a single-user tool, professional polish reduces cognitive load and makes daily work faster.

Tech constraints: React 18+ with TypeScript, Tailwind CSS utility classes only (no CSS files), shadcn/ui components only (no custom UI primitives), Vite bundler.

---

## 1. Visual Hierarchy

Visual hierarchy tells the user where to look first, second, and third. Without it, every element competes for attention and the page feels chaotic.

### Typography Scale

Use Tailwind's built-in type scale consistently. Never mix arbitrary font sizes.

| Role | Class | When to use |
|---|---|---|
| Page title | `text-2xl font-semibold tracking-tight` | One per page, top-left of content area |
| Section heading | `text-lg font-semibold` | Card titles, panel headings |
| Subsection heading | `text-sm font-medium text-muted-foreground` | Labels above groups, table column headers |
| Body text | `text-sm` | Default for all content |
| Caption / helper | `text-xs text-muted-foreground` | Timestamps, secondary info, helper text |

### Font Weight Rules

- Use `font-semibold` (600) for headings. Reserve `font-bold` (700) for urgent emphasis only (error titles, critical badges).
- Use `font-medium` (500) for interactive labels (button text, nav items, table headers).
- Use `font-normal` (400) for body content. This is the default — do not set it explicitly.
- Never use `font-light` or `font-thin`. They reduce readability on most screens.

### Color Contrast

Meet WCAG AA minimum: 4.5:1 for body text, 3:1 for large text (18px+) and UI controls.

- Primary text: use `text-foreground` (maps to near-black in light, near-white in dark). Never use opacity-based grays like `text-black/60` — they fail contrast checks on colored backgrounds.
- Secondary text: use `text-muted-foreground`. This is pre-tuned for sufficient contrast in shadcn/ui themes.
- Never place colored text on colored backgrounds without verifying contrast manually.

---

## 2. Layout Patterns

Consistent layout creates spatial memory — users learn where things are once and never hunt again.

### App Shell

```
┌──────────────────────────────────────────────┐
│  Sidebar (w-64, fixed left)  │  Content Area  │
│  ┌────────────────────────┐  │                │
│  │ Logo / App Name        │  │  Page Title    │
│  │ Nav items (stacked)    │  │  ───────────   │
│  │                        │  │  Content cards │
│  │                        │  │                │
│  │ Bottom: settings link  │  │                │
│  └────────────────────────┘  │                │
└──────────────────────────────────────────────┘
```

- Sidebar: `w-64 border-r bg-background` fixed to left, full viewport height. Use `flex flex-col` with nav items in the top section and utility links pushed to the bottom via `mt-auto`.
- Content area: `ml-64 p-6 lg:p-8`. Add `max-w-7xl mx-auto` only on pages with wide content (data tables, dashboards). Chat pages use full width.
- Page header: page title + optional description + primary action button, all in a `flex items-center justify-between` row at the top of the content area, with `mb-6` below it.

### Responsive Breakpoints

| Breakpoint | Tailwind prefix | Behavior |
|---|---|---|
| < 768px | default | Sidebar collapses to hamburger menu overlay |
| 768px+ | `md:` | Sidebar visible, content adjusts |
| 1024px+ | `lg:` | Full padding, optimal reading width |
| 1280px+ | `xl:` | Dashboard grid expands to 4 columns |

### Card-Based Sections

Wrap every distinct content group in a shadcn `Card`. Cards provide visual containment and scannable boundaries.

- Card padding: use shadcn defaults (`CardHeader` + `CardContent`). Do not override with custom padding unless there is a specific reason.
- Card spacing: `gap-4` between sibling cards in a grid, `gap-6` between card rows.
- Card grids: use `grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4` for equal-weight cards. Use `grid-cols-4` only for dashboard stat cards.

---

## 3. UI States

Every data-driven component has four states. Skipping any one of them creates jarring user experiences — a blank screen while loading, a confusing empty page, or an unrecoverable error.

### Loading State

Use shadcn `Skeleton` components that mirror the shape of the real content. This prevents layout shift when data arrives.

- For cards: `<Skeleton className="h-[125px] w-full rounded-xl" />`
- For text lines: `<Skeleton className="h-4 w-[250px]" />` with a few stacked at `space-y-2`
- For tables: render 5 skeleton rows matching column widths
- For the chat view: skeleton message bubbles alternating left/right
- Never use a centered spinner as the only loading indicator. Skeletons communicate structure; spinners communicate nothing.

### Empty State

Display when a collection has zero items. An empty page with no guidance makes users think something is broken.

- Center vertically and horizontally within the content area.
- Include: an icon (from Lucide, 48px, `text-muted-foreground`), a short heading ("No conversations yet"), a one-line description ("Conversations will appear here when customers message you"), and a primary CTA button if the user can take action ("Create Template", "Sync Customers").
- Wrap in a `flex flex-col items-center justify-center gap-4 py-16`.

### Error State

Use shadcn `Alert` with `variant="destructive"` for inline errors. Place it where the content would have appeared — not in a modal, not at the top of the page.

- Include the error message and a retry button.
- For field-level validation errors, display `text-xs text-destructive` below the input with `mt-1`.

### Success Feedback

Use shadcn `toast` for transient success messages ("Template saved", "Message sent"). Keep toast text under 60 characters. Never use toast for errors that require user action — those need inline alerts.

---

## 4. Spacing System

Consistent spacing creates visual rhythm. Inconsistent spacing makes a page feel unfinished even if every component is correct.

### The 4px Grid

All spacing values must come from Tailwind's default scale, which follows a 4px base:

| Tailwind class | Pixels | Use for |
|---|---|---|
| `p-1` / `gap-1` | 4px | Tight spacing: between icon and label, badge padding |
| `p-2` / `gap-2` | 8px | Between related elements: form label to input, list items |
| `p-3` / `gap-3` | 12px | Inner padding of compact components: small cards, chips |
| `p-4` / `gap-4` | 16px | Default card content padding, between sibling components |
| `p-6` / `gap-6` | 24px | Section separation within a page |
| `p-8` / `gap-8` | 32px | Page-level padding, major section separation |

### Rules

- Never use arbitrary values like `p-[13px]`. If the scale does not have what you need, pick the nearest value.
- Use `space-y-` for vertical stacks and `gap-` for flex/grid layouts. Do not mix margin-based spacing with gap-based spacing in the same container.
- Page content padding: `p-6` on medium screens, `p-8` on large. Apply to the content wrapper, not individual cards.
- Between page title and first content section: `mb-6`.
- Between cards in a grid: `gap-4`.
- Between sections (e.g., stats row and table): `mt-6` or `space-y-6` on the parent.

---

## 5. Color Usage

Color carries meaning. Use it deliberately — decoration without meaning creates noise.

### Backgrounds

- Page background: `bg-background` (the default — do not set explicitly unless overriding).
- Card background: `bg-card` (handled by shadcn Card component).
- Sidebar background: `bg-background` with `border-r` for separation. Avoid colored sidebars — they compete with content.
- Hover rows / items: `hover:bg-accent` for list items and table rows.

### Semantic Colors

| Meaning | Background | Text | Border | When to use |
|---|---|---|---|---|
| Success | `bg-green-50` | `text-green-700` | `border-green-200` | Message delivered, sync complete, payment received |
| Error | `bg-red-50` | `text-red-700` | `border-red-200` | Failed message, webhook error, validation failure |
| Warning | `bg-yellow-50` | `text-yellow-700` | `border-yellow-200` | Template pending approval, approaching rate limit |
| Info | `bg-blue-50` | `text-blue-700` | `border-blue-200` | New feature notice, general information |

For dark mode compatibility, prefer shadcn's semantic tokens (`destructive`, `muted`, etc.) over hardcoded Tailwind colors in components that must support both themes.

### Accent / Primary Actions

- Primary buttons: use shadcn `Button` default variant (filled primary color). Limit to one primary button per visible viewport section to maintain clear hierarchy.
- Secondary actions: use `variant="outline"` or `variant="ghost"`.
- Destructive actions (delete template, remove customer): use `variant="destructive"`. Always require confirmation via a dialog.

---

## 6. Interactive Elements

Interactions must feel immediate and intentional. Laggy or invisible feedback makes users click twice or doubt their actions.

### Hover States

- Buttons: handled by shadcn defaults. Do not override.
- List items / table rows: `hover:bg-accent transition-colors duration-150`. The transition smooths the color change so it does not feel like flickering.
- Cards: add `hover:shadow-md transition-shadow duration-200` only if the card is clickable. Never add hover effects to non-interactive cards — it misleads users.
- Links: `hover:underline` for inline text links.

### Focus Rings

- Use shadcn's built-in focus styles. They apply `ring-2 ring-ring ring-offset-2` on focus-visible, which is correct for keyboard navigation.
- Never add `outline-none` without a replacement focus indicator. Removing focus rings breaks keyboard accessibility.
- Tab order must follow visual order. If it does not, fix the DOM order rather than using `tabIndex`.

### Transitions

- Color changes: `duration-150` (fast, feels snappy).
- Shadow / elevation changes: `duration-200` (slightly slower, feels smooth).
- Layout shifts (expanding panels, accordion): `duration-300` with `ease-in-out`.
- Never animate more than necessary. Do not add transitions to page loads, data refreshes, or skeleton→content swaps.

### Disabled States

- Buttons: `disabled:opacity-50 disabled:pointer-events-none` (shadcn default). Always disable the submit button while a form is submitting to prevent double-submission.
- Inputs: `disabled:bg-muted disabled:cursor-not-allowed`.
- Convey why something is disabled via a tooltip or helper text. A disabled button with no explanation frustrates users.

---

## 7. App-Specific Patterns

These patterns are unique to the Qwertees WhatsApp Automation dashboard. Follow them exactly for consistency across pages.

### Dashboard Stat Cards

- Layout: `grid grid-cols-2 lg:grid-cols-4 gap-4`.
- Each card: shadcn `Card` with `CardHeader` containing a `CardTitle` (metric name, `text-sm font-medium text-muted-foreground`) and a large value (`text-2xl font-bold`). Optionally include a trend indicator (`text-xs text-green-600` for up, `text-red-600` for down) with an arrow icon.
- Icon: place a Lucide icon (`h-4 w-4 text-muted-foreground`) in the top-right of the CardHeader using `flex items-center justify-between`.

### Conversation List

- Container: full height minus header, with `overflow-y-auto`.
- Each item: `flex items-start gap-3 p-3 hover:bg-accent rounded-lg cursor-pointer transition-colors duration-150`.
- Avatar: shadcn `Avatar` with `AvatarFallback` showing initials (first two letters of customer name, uppercased). Size: `h-10 w-10`.
- Content area: customer name (`text-sm font-medium`), last message preview truncated with `truncate` (`text-xs text-muted-foreground`), and timestamp (`text-xs text-muted-foreground ml-auto whitespace-nowrap`).
- Unread indicator: a `h-2 w-2 rounded-full bg-primary` dot next to the timestamp.
- Active conversation: `bg-accent` background to show which conversation is selected.

### Chat Bubble Layout

- Container: `flex flex-col gap-1 p-4 overflow-y-auto` for the message list. Scroll to bottom on new messages.
- Incoming messages (customer): `self-start max-w-[75%] bg-muted rounded-2xl rounded-tl-sm px-4 py-2`.
- Outgoing messages (business): `self-end max-w-[75%] bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2`.
- Message text: `text-sm`. Timestamp below message: `text-[10px] text-muted-foreground mt-1` for incoming, `text-[10px] text-primary-foreground/70 mt-1` for outgoing.
- Message grouping: if consecutive messages are from the same sender and within 2 minutes, reduce gap to `gap-0.5` and hide the timestamp on all but the last message in the group.

### Message Status Indicators

Place status icons to the right of the outgoing message timestamp.

| Status | Icon | Style |
|---|---|---|
| Sending | Clock icon | `h-3 w-3 text-primary-foreground/50` |
| Sent | Single check | `h-3 w-3 text-primary-foreground/50` |
| Delivered | Double check | `h-3 w-3 text-primary-foreground/50` |
| Read | Double check | `h-3 w-3 text-blue-400` |
| Failed | AlertCircle | `h-3 w-3 text-destructive` with retry button |

### Data Tables

Use shadcn `Table` component for all tabular data (templates, customers, automations).

- Header row: `text-xs font-medium text-muted-foreground uppercase tracking-wider` for column headers.
- Body rows: `hover:bg-accent/50 transition-colors duration-150`.
- Row actions: place a shadcn `DropdownMenu` triggered by a `MoreHorizontal` icon button (`variant="ghost"`, `h-8 w-8 p-0`) in the last column. Include actions like Edit, Duplicate, Delete.
- Pagination: use shadcn `Pagination` below the table with `mt-4`.
- Sortable columns: show a `ChevronUp` / `ChevronDown` icon next to the header text. Active sort column uses `text-foreground`, inactive uses `text-muted-foreground`.

### Template Cards

- Display in a grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`.
- Each card shows: template name (`font-medium`), category badge (shadcn `Badge`), status badge (green for APPROVED, yellow for PENDING, red for REJECTED), language, and a preview of the body text truncated to 3 lines (`line-clamp-3 text-sm text-muted-foreground`).
- Card footer: "Edit" and "Send Test" buttons using `variant="ghost"` and `variant="outline"`.

---

## 8. Accessibility

Accessibility is not optional. It ensures the tool works with keyboard navigation, screen readers, and high-contrast modes — which also benefits sighted users who prefer keyboard shortcuts.

### Contrast

- Verify all text meets WCAG AA (4.5:1 body, 3:1 large text and controls). shadcn/ui defaults pass — problems arise when overriding colors or using custom backgrounds.
- Never rely solely on color to convey meaning. Pair colors with icons or text labels (e.g., a red badge saying "Failed" not just a red dot).

### Focus Management

- When opening a dialog, focus moves to the first interactive element inside it. shadcn `Dialog` handles this automatically — do not override.
- When closing a dialog, focus returns to the trigger element.
- When deleting an item from a list, focus moves to the next item (or previous if it was the last).
- After a page navigation, focus moves to the page title or main content area.

### Screen Reader Labels

- Every icon-only button must have an `aria-label` (e.g., `<Button variant="ghost" size="icon" aria-label="More actions">`).
- Images and decorative icons: use `aria-hidden="true"` on decorative elements, `alt` text on meaningful images.
- Form inputs must have associated labels via `htmlFor` / `id` pairing or `aria-label`.
- Status badges: include `role="status"` and sr-only text if the badge only uses color (e.g., `<span className="sr-only">Approved</span>`).

### Keyboard Navigation

- All interactive elements reachable via Tab key. Test by navigating every page with keyboard only.
- Escape closes modals and dropdowns (shadcn handles this).
- Enter activates buttons and links. Space toggles checkboxes and opens selects.
- Arrow keys navigate within list components (conversation list, dropdown menus).

---

## 9. Review Checklist

Run through this checklist for every page or component before considering it done. Each item catches a specific category of visual/UX bug.

### Structure
- [ ] Page has exactly one `text-2xl` title at the top
- [ ] Primary action button is in the page header, right-aligned
- [ ] Content is wrapped in Cards where appropriate
- [ ] Layout uses the established grid system, not ad-hoc widths

### Typography
- [ ] No font sizes outside the defined scale
- [ ] Muted text uses `text-muted-foreground`, not opacity hacks
- [ ] Long text is constrained with `max-w-prose` or `line-clamp-*`

### Spacing
- [ ] All spacing values from the 4px grid (no arbitrary pixel values)
- [ ] Consistent gap between sibling cards/sections
- [ ] No double margins (margin on child + padding on parent creating uneven spacing)

### States
- [ ] Loading state uses Skeleton components matching content shape
- [ ] Empty state has icon, heading, description, and CTA
- [ ] Error state uses inline Alert with retry action
- [ ] Success feedback uses toast (not alert, not console.log)

### Interactivity
- [ ] Clickable elements have hover states with transitions
- [ ] Buttons show loading state (spinner + disabled) during async operations
- [ ] Destructive actions require confirmation dialog
- [ ] Forms disable submit button while processing

### Accessibility
- [ ] All icon-only buttons have `aria-label`
- [ ] Form inputs have labels
- [ ] Page is fully navigable with keyboard only
- [ ] Color is never the sole indicator of meaning

### Consistency
- [ ] Colors match the semantic color table (green=success, red=error, etc.)
- [ ] Component usage matches shadcn/ui conventions (no custom primitives)
- [ ] Naming follows project conventions (PascalCase components, camelCase functions)
- [ ] No unused imports or dead JSX
