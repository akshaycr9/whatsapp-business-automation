---
description: Install, configure, and compose shadcn/ui components in the Qwertees WhatsApp Automation client app. Use when adding UI components, setting up data tables, dialogs, forms, toasts, or any shadcn primitive.
triggers:
  - "add component"
  - "install shadcn"
  - "add data table"
  - "install dialog"
  - "add form component"
  - "need a dropdown"
  - "add toast"
  - "UI component"
---

# shadcn/ui Component Setup

## Project Context

- **Framework**: React 18+ with Vite + TypeScript
- **Styling**: Tailwind CSS (utility classes only, no CSS files)
- **UI Library**: shadcn/ui — the ONLY permitted UI library
- **Component Location**: `client/src/components/ui/`
- **No other UI libraries allowed** (no MUI, Chakra, Ant Design, etc.)

## Installation

### Adding a Component

Run from the `client/` directory:

```bash
cd client && npx shadcn@latest add <component-name>
```

Add multiple components at once:

```bash
cd client && npx shadcn@latest add button card dialog table
```

### Prerequisites

Ensure `client/components.json` exists and points to the correct paths. If it does not exist, initialize first:

```bash
cd client && npx shadcn@latest init
```

Select these options during init:
- TypeScript: Yes
- Style: Default
- Base color: As configured
- CSS variables: Yes
- Tailwind CSS config path: `tailwind.config.js`
- Components alias: `@/components`
- Utils alias: `@/lib/utils`

## Commonly Needed Components

### Table / DataTable

**Use cases**: Customer list, automation logs, template list, webhook event history.

```bash
npx shadcn@latest add table
```

Build a DataTable by composing the Table primitive with `@tanstack/react-table`:

```bash
npm install @tanstack/react-table
```

```tsx
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table"
```

Create reusable DataTable wrapper at `client/src/components/data-table.tsx`. Include column definitions, sorting, filtering, and pagination. Pair with DropdownMenu for row actions.

### Dialog / Sheet

**Use cases**: Create/edit template forms, send template message, delete confirmations, customer details.

```bash
npx shadcn@latest add dialog sheet
```

- Use **Dialog** for focused actions (create template, confirm delete).
- Use **Sheet** for side panels (conversation details, customer profile).

```tsx
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
```

Always include `DialogDescription` for accessibility even if visually hidden.

### Card

**Use cases**: Dashboard statistics, conversation preview cards, template summary cards.

```bash
npx shadcn@latest add card
```

```tsx
import {
  Card, CardContent, CardDescription,
  CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card"
```

### Badge

**Use cases**: Template status (APPROVED/PENDING/REJECTED), message delivery status (sent/delivered/read/failed), customer tags.

```bash
npx shadcn@latest add badge
```

Map statuses to variants:

```tsx
const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  APPROVED: "default",
  PENDING: "secondary",
  REJECTED: "destructive",
}
```

### Toast / Sonner

**Use cases**: Success/error notifications for API calls, webhook processing feedback, template sync results.

```bash
npx shadcn@latest add sonner
```

Sonner is the recommended toast library for shadcn. Add the `<Toaster />` component to the app root layout:

```tsx
// client/src/App.tsx or layout
import { Toaster } from "@/components/ui/sonner"

function App() {
  return (
    <>
      {/* routes */}
      <Toaster />
    </>
  )
}
```

Trigger toasts from anywhere:

```tsx
import { toast } from "sonner"

toast.success("Template synced successfully")
toast.error("Failed to send message")
toast.loading("Syncing templates...")
```

### Input / Textarea / Select

**Use cases**: Template variable mapping, message composer, customer search, filter dropdowns.

```bash
npx shadcn@latest add input textarea select
```

Use the native Select for simple dropdowns. For searchable/filterable selects, use Command + Popover (combobox pattern) instead.

### Button

**Use cases**: All interactive actions throughout the app.

```bash
npx shadcn@latest add button
```

Available variants — use them consistently:

| Variant       | Use Case                                      |
|---------------|-----------------------------------------------|
| `default`     | Primary actions (Send Message, Save Template) |
| `destructive` | Delete actions, disconnect                    |
| `outline`     | Secondary actions (Cancel, Back)              |
| `ghost`       | Tertiary actions, icon buttons in toolbars    |
| `link`        | Inline navigation-style actions               |

Sizes: `default`, `sm`, `lg`, `icon`.

### Tabs

**Use cases**: Template status tabs (Approved/Pending/Rejected), conversation filters (All/Unread/Starred).

```bash
npx shadcn@latest add tabs
```

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
```

### Skeleton

**Use cases**: Loading states for conversation list, template list, dashboard cards.

```bash
npx shadcn@latest add skeleton
```

Create skeleton variants that match the shape of the actual content:

```tsx
function ConversationListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-[140px]" />
            <Skeleton className="h-3 w-[200px]" />
          </div>
        </div>
      ))}
    </div>
  )
}
```

### ScrollArea

**Use cases**: Conversation message thread, sidebar navigation, long template lists.

```bash
npx shadcn@latest add scroll-area
```

Always set a fixed height or max-height on the ScrollArea container. Use `flex-1` in flex layouts.

### Avatar

**Use cases**: Customer avatars in conversation list and chat header.

```bash
npx shadcn@latest add avatar
```

```tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

<Avatar>
  <AvatarImage src={customer.avatarUrl} alt={customer.name} />
  <AvatarFallback>{customer.name.slice(0, 2).toUpperCase()}</AvatarFallback>
</Avatar>
```

### DropdownMenu

**Use cases**: Row actions in data tables (Edit, Delete, View), bulk actions.

```bash
npx shadcn@latest add dropdown-menu
```

Standard row action pattern:

```tsx
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">
      <MoreHorizontal className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuLabel>Actions</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={() => onEdit(row)}>Edit</DropdownMenuItem>
    <DropdownMenuItem
      className="text-destructive"
      onClick={() => onDelete(row)}
    >
      Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Command

**Use cases**: Global search, customer search, template filter, combobox selects.

```bash
npx shadcn@latest add command popover
```

Build a combobox by combining Command inside a Popover for searchable select inputs.

### Form (react-hook-form + zod)

**Use cases**: Template creation, variable mapping, customer creation, automation rule config.

```bash
npx shadcn@latest add form
npm install react-hook-form zod @hookform/resolvers
```

Define schemas with zod, bind with react-hook-form:

```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Form, FormControl, FormDescription,
  FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form"

const templateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.enum(["MARKETING", "UTILITY", "AUTHENTICATION"]),
  language: z.string().default("en"),
})

type TemplateFormValues = z.infer<typeof templateSchema>
```

Always define the zod schema in the same file or a shared `client/src/lib/validators/` directory.

## Composition Patterns

### Data Table with Actions and Filters

Combine Table + DropdownMenu + Input + Button + Badge:

```
[Input (search filter)] [Button (add new)]
[Tabs (status filter)]
[Table]
  [TableRow]
    [Badge (status)] [DropdownMenu (actions)]
[Pagination buttons]
```

### Modal Form

Combine Dialog + Form + Input/Select + Button:

```
[Dialog]
  [DialogHeader]
  [Form]
    [FormField > Input]
    [FormField > Select]
  [DialogFooter]
    [Button variant="outline" (Cancel)]
    [Button (Submit)]
```

### Conversation Layout

Combine ScrollArea + Avatar + Input + Button:

```
[Sidebar: ScrollArea > list of Avatar + name + Badge]
[Main: ScrollArea (messages) + Input + Button (send)]
```

### Dashboard Cards

Combine Card + Skeleton for loading:

```tsx
{isLoading ? (
  <Card>
    <CardHeader><Skeleton className="h-4 w-[100px]" /></CardHeader>
    <CardContent><Skeleton className="h-8 w-[60px]" /></CardContent>
  </Card>
) : (
  <Card>
    <CardHeader><CardTitle>Total Customers</CardTitle></CardHeader>
    <CardContent><p className="text-3xl font-bold">{count}</p></CardContent>
  </Card>
)}
```

## Customization Rules

1. **Extend via `className` prop** — never modify the generated source files in `components/ui/`.
2. **Use Tailwind utilities** for all customization:
   ```tsx
   <Button className="w-full mt-4">Full Width Button</Button>
   <Card className="border-green-500 bg-green-50">Success Card</Card>
   ```
3. **Create wrapper components** for repeated patterns. Place them in `client/src/components/` (not in `ui/`):
   ```tsx
   // client/src/components/status-badge.tsx
   function StatusBadge({ status }: { status: string }) {
     const variant = statusVariantMap[status] ?? "secondary"
     return <Badge variant={variant}>{status}</Badge>
   }
   ```
4. **Use `cn()` utility** from `@/lib/utils` for conditional classes:
   ```tsx
   import { cn } from "@/lib/utils"
   <div className={cn("p-4", isActive && "bg-accent")} />
   ```

## Common Gotchas

### Import Paths

All shadcn components use the `@/components/ui/` alias. Ensure `tsconfig.json` has path aliases configured:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

And `vite.config.ts` has the resolve alias:

```ts
import path from "path"

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

### Peer Dependencies

Some components require additional packages. Install them when prompted:

- **Form**: `react-hook-form`, `zod`, `@hookform/resolvers`
- **DataTable**: `@tanstack/react-table`
- **Sonner**: `sonner`
- **Command**: `cmdk`

The `npx shadcn@latest add` command auto-installs most peer deps, but verify in `package.json` after installation.

### Tailwind Configuration

Ensure `tailwind.config.js` includes the shadcn theme extensions. The `shadcn init` command sets this up, but verify:

- CSS variables for colors are defined in `client/src/index.css`
- The `content` array in Tailwind config covers `./src/**/*.{ts,tsx}`
- The `tailwindcss-animate` plugin is installed and listed

### Lucide Icons

shadcn uses `lucide-react` for icons. Install it if not present:

```bash
npm install lucide-react
```

Import icons individually for tree-shaking:

```tsx
import { Send, Check, X, MoreHorizontal } from "lucide-react"
```

### Dark Mode

If dark mode is configured, all shadcn components support it automatically via CSS variables. No extra work needed per component.

### Server Components

Not applicable — this project uses Vite + React (client-side), not Next.js. Ignore any shadcn docs referencing `"use client"` directives.
