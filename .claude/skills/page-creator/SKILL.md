---
name: page-creator
description: Generate React page components for the Qwertees WhatsApp Automation app. Use when the user asks to create a page, add a page for something, build a new page, scaffold a page component, or add a new view/screen to the frontend.
---

# Page Creator

Generate complete React page components for the Qwertees WhatsApp Automation project. Every page follows the same structure: TypeScript strict mode, Tailwind CSS for styling, shadcn/ui for UI primitives, centralized API client for data fetching, and Socket.io for real-time updates.

## File Placement and Naming

- Place page files in `client/src/pages/` using PascalCase: `{Name}Page.tsx`
- Place page-specific hooks in `client/src/hooks/` using camelCase: `use{Name}.ts`
- Place page-specific sub-components in `client/src/components/` using PascalCase: `{Name}Table.tsx`, `{Name}Dialog.tsx`
- Add the route entry in the app's router config (typically `client/src/App.tsx` or `client/src/router.tsx`)

## Page Component Template

Use this skeleton for every new page. Adapt sections as needed — remove Socket.io if the page has no real-time data, remove empty state if it does not apply, etc.

```tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/lib/api";
import { socket } from "@/lib/socket";

// -- Types ------------------------------------------------------------------

interface Item {
  id: string;
  name: string;
  // add fields matching the API response
}

// -- Hook -------------------------------------------------------------------

function useItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const { data } = await api.get<Item[]>("/api/items");
        setItems(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load items");
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
  }, []);

  // Real-time updates (remove if not needed)
  useEffect(() => {
    const handleCreated = (item: Item) => {
      setItems((prev) => [item, ...prev]);
    };
    const handleUpdated = (item: Item) => {
      setItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
    };

    socket.on("item:created", handleCreated);
    socket.on("item:updated", handleUpdated);

    return () => {
      socket.off("item:created", handleCreated);
      socket.off("item:updated", handleUpdated);
    };
  }, []);

  return { items, isLoading, error, setItems };
}

// -- Page -------------------------------------------------------------------

export default function ItemsPage() {
  const { items, isLoading, error } = useItems();
  const { toast } = useToast();

  // Error state
  if (error) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Something went wrong</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>No items yet</CardTitle>
            <CardDescription>
              Items will appear here once they are created.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Data state
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Items</h1>
        <Button>Add Item</Button>
      </div>

      {/* Replace with Table or card grid as needed */}
      <Card>
        <CardContent className="p-0">
          {/* Table content here */}
        </CardContent>
      </Card>
    </div>
  );
}
```

## Router Integration

After creating the page file, add a route entry. Find the router config (usually `client/src/App.tsx` or a dedicated `router.tsx`) and add a lazy-loaded route:

```tsx
import { lazy, Suspense } from "react";

const ItemsPage = lazy(() => import("@/pages/ItemsPage"));

// Inside the route tree:
<Route
  path="/items"
  element={
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <ItemsPage />
    </Suspense>
  }
/>
```

If the app uses a route array instead of JSX routes, add an object entry:

```tsx
{
  path: "/items",
  element: <ItemsPage />,
}
```

Always check the existing router config to match the pattern already in use.

## Data Fetching Pattern

Extract data fetching into a custom hook in `client/src/hooks/`. The hook owns loading, error, and data state.

```tsx
// client/src/hooks/useItems.ts
import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

interface Item {
  id: string;
  name: string;
}

export function useItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.get<Item[]>("/api/items");
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load items");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return { items, isLoading, error, refetch: fetchItems, setItems };
}
```

Key rules:
- Always type the API response — never use `any`.
- Expose a `refetch` function so the page can re-fetch after mutations.
- Handle errors inside the hook; surface them as a string for the page to display.
- Use `useCallback` on the fetch function if it will be a dependency of other effects.

## Socket.io Real-Time Updates

Use the singleton socket from `client/src/lib/socket.ts`. Subscribe in a `useEffect` and clean up on unmount.

```tsx
import { useEffect } from "react";
import { socket } from "@/lib/socket";

// Inside a hook or component:
useEffect(() => {
  const handleEvent = (payload: SomeType) => {
    // Update local state
  };

  socket.on("event:name", handleEvent);

  return () => {
    socket.off("event:name", handleEvent);
  };
}, []);
```

Rules:
- Always remove listeners on cleanup to prevent memory leaks.
- Use named handler functions (not inline arrow functions in `.on()`) so `.off()` works correctly.
- Keep socket event names namespaced: `resource:action` (e.g., `message:received`, `conversation:updated`).
- Merge incoming socket data into existing state — do not refetch the full list on every event.

## shadcn/ui Component Usage

Use shadcn/ui components for all UI elements. Do not create custom primitives. Common patterns:

### Data Tables

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
      <TableHead className="text-right">Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {items.map((item) => (
      <TableRow key={item.id}>
        <TableCell className="font-medium">{item.name}</TableCell>
        <TableCell>
          <Badge variant={item.active ? "default" : "secondary"}>
            {item.active ? "Active" : "Inactive"}
          </Badge>
        </TableCell>
        <TableCell className="text-right">
          <Button variant="ghost" size="sm">Edit</Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### Dialogs for Create/Edit Forms

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const [open, setOpen] = useState(false);

<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button>Add Item</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Add Item</DialogTitle>
      <DialogDescription>Fill in the details below.</DialogDescription>
    </DialogHeader>
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" placeholder="Enter name" />
      </div>
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleSubmit}>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Toast Notifications

```tsx
import { useToast } from "@/components/ui/use-toast";

const { toast } = useToast();

// Success
toast({ title: "Saved", description: "Item created successfully." });

// Error
toast({
  title: "Error",
  description: "Failed to save item.",
  variant: "destructive",
});
```

Use toasts for all user-facing feedback after mutations (create, update, delete).

## Complete Example: Templates Page

Below is a full page showing templates in a data table with loading state, actions, and a create dialog.

```tsx
// client/src/pages/TemplatesPage.tsx
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { useTemplates } from "@/hooks/useTemplates";
import { api } from "@/lib/api";

export default function TemplatesPage() {
  const { templates, isLoading, error, refetch } = useTemplates();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleCreate = async () => {
    setIsSaving(true);
    try {
      await api.post("/api/templates", { name: newName });
      toast({ title: "Created", description: "Template created." });
      setDialogOpen(false);
      setNewName("");
      refetch();
    } catch {
      toast({
        title: "Error",
        description: "Failed to create template.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (error) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Something went wrong</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Templates</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>New Template</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Template</DialogTitle>
              <DialogDescription>
                Add a new WhatsApp message template.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="templateName">Name</Label>
                <Input
                  id="templateName"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. order_confirmation"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isSaving || !newName}>
                {isSaving ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {templates.length === 0 ? (
        <Card className="text-center">
          <CardHeader>
            <CardTitle>No templates yet</CardTitle>
            <CardDescription>
              Create your first WhatsApp template to get started.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((tpl) => (
                  <TableRow key={tpl.id}>
                    <TableCell className="font-medium">{tpl.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          tpl.status === "APPROVED" ? "default" : "secondary"
                        }
                      >
                        {tpl.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{tpl.category}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

## Checklist

When generating a page, verify each of these:

1. File is in `client/src/pages/` with PascalCase naming ending in `Page.tsx`.
2. Default export used for the page component.
3. All imports use the `@/` path alias — never relative paths like `../../`.
4. Loading state renders Skeleton placeholders, not a spinner.
5. Error state shows a Card with a retry action.
6. Empty state shows a helpful message, not a blank screen.
7. Data fetching is in a custom hook, not inline in the component.
8. API calls go through `@/lib/api`, never raw `fetch` or a new Axios instance.
9. Socket listeners are cleaned up on unmount.
10. All UI elements use shadcn/ui components — no custom primitives, no extra UI libraries.
11. Styling is Tailwind utility classes only — no CSS files, no inline `style` props.
12. TypeScript types are defined for all API responses and props — no `any`.
13. Route is added to the router config with lazy loading.
14. Toast notifications are used for mutation feedback (create, update, delete).
