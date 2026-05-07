---
description: Frontend architecture patterns with strict separation of concerns and SOLID principles
globs: ["client/src/**/*.ts", "client/src/**/*.tsx"]
---

# Frontend Architecture Rules

## Four-Layer Architecture (Strict Separation of Concerns)

```
                        PAGES (Composition)
                              ↓
              COMPONENTS (UI) + HOOKS (Logic)
                    ↓                    ↓
            Redux State Layer      API Layer (Thunks)
                    ↓                    ↓
                   Centralized Axios Instance (lib/api.ts)
                             ↓
                        Backend API
```

### Layer 1: Pages
- **Responsibility**: Composition and wiring
- **Location**: `src/pages/<Feature>/`
- **What they do**:
  - Call custom hooks to get data and handlers
  - Compose components and pass props
  - Wrap all handler props in `useCallback`
  - Handle page-level navigation and lifecycle
- **What they DON'T do**: 
  - NO component definitions (except page wrapper)
  - NO business logic
  - NO direct Redux imports (only through hooks)
  - NO API calls (only through hooks)
- **Example**: `TemplatesPage` calls `useTemplates()` hook, maps data, renders `TemplateCard` components

### Layer 2: Components (Presentational)
- **Responsibility**: Pure UI rendering
- **Location**: `src/components/<Feature>/`
- **What they do**:
  - Receive all data and callbacks via typed props
  - Render JSX only
  - Emit events through callback props
  - Use `React.memo` for list-rendered components
  - Use config maps for conditional rendering
- **What they DON'T do**:
  - NO data fetching hooks
  - NO Redux imports
  - NO API calls
  - NO business logic
  - NO useState for server state
- **Example**: `TemplateCard` receives `template`, `onEdit`, `onDelete` as props, renders JSX with semantic Tailwind classes

### Layer 3: Hooks (Logical Data Layer)
- **Responsibility**: State management and data orchestration
- **Location**: `src/hooks/<Domain>/`
- **What they do**:
  - Dispatch Redux actions and async thunks
  - Select from Redux state
  - Manage local component state (forms, UI toggles)
  - Return stable data and memoized handlers
  - Transform and validate data
- **What they DON'T do**:
  - NO JSX
  - NO component definitions
  - NO direct API calls (use thunks)
- **Examples**:
  - `use-templates.ts`: Dispatches `fetchTemplates` thunk, selects from Redux, returns `{ templates, loading, error, refetch }`
  - `use-template-form-state.ts`: Uses `useForm`, `useWatch`, `useFieldArray` for form state
  - `use-template-form-logic.ts`: Validates and transforms form data before submission

### Layer 4: API Layer (Async Operations)
- **Responsibility**: HTTP operations and state updates
- **Location**: `src/api/`
- **What lives here**:
  - Async thunks (Redux Toolkit `createAsyncThunk`)
  - One file per resource domain (e.g., `templates.ts`)
  - Request/response transformation logic
- **What they do**:
  - Use centralized Axios instance from `lib/api.ts`
  - Transform request data before sending
  - Transform response data before returning to Redux
  - Handle API errors and map to user-friendly messages
- **Who can import from here**: Hooks only, never components or pages
- **Example**: `api/templates.ts` contains `fetchTemplates`, `createTemplate`, `updateTemplate`, `deleteTemplate` thunks

### Layer 5: Redux State
- **Responsibility**: State management only
- **Location**: `src/features/<Domain>/`
- **What lives here**:
  - Reducers (handle state mutations from thunk results)
  - Selectors (export typed queries)
  - Actions (type definitions)
  - ExtraReducers (handle thunk fulfilled/pending/rejected)
- **What they DON'T do**:
  - NO business logic
  - NO API calls (thunks live in `src/api/`)
  - NO external dependencies
- **Example**: `templatesSlice.ts` has reducers for success/error states, selector `selectAllTemplates`, and extraReducers for async thunks

### Layer 6: Utilities & Singletons
- **Responsibility**: Pure functions and cross-app instances
- **Location**: `src/lib/`
- **What lives here**:
  - `api.ts`: Centralized Axios instance
  - `socket.ts`: Socket.io client singleton
  - `template-utils.ts`: Pure functions (variable extraction, text substitution)
  - `template-constants.ts`: Config maps (TEMPLATE_STATUS_CONFIG, ACTIVITY_CONFIG)
  - `utils.ts`: General utilities (cn(), date formatting)

## Directory Structure
```
client/src/
├── api/
│   ├── templates.ts         → Async thunks for templates (7 CRUD operations)
│   └── [domain].ts          → One file per resource domain
│
├── features/
│   ├── templates/
│   │   └── templatesSlice.ts → Redux reducers, selectors, actions (NO thunks)
│   └── [domain]/
│       └── [domain]Slice.ts  → Redux state management per domain
│
├── hooks/
│   ├── templates/
│   │   ├── use-templates.ts             → Dispatch thunks, select from Redux
│   │   ├── use-template-form-state.ts   → Form state (useForm, useWatch, useFieldArray)
│   │   ├── use-template-form-logic.ts   → Form validation, preview, submission
│   │   └── use-edit-template-form.ts    → Edit-specific initialization
│   └── [domain]/
│       └── use-[domain].ts              → Domain-specific hooks
│
├── pages/
│   ├── Templates/
│   │   ├── TemplatesPage.tsx      → List, search, sync operations
│   │   ├── NewTemplatePage.tsx    → Form + live preview panel
│   │   └── EditTemplatePage.tsx   → Pre-populated form + preview
│   └── [Feature]/
│       └── [Feature]Page.tsx      → Composition, no logic
│
├── components/
│   ├── ui/                        → shadcn/ui (auto-generated, never modify)
│   ├── layout/                    → App shell, sidebar, header
│   ├── conversations/
│   │   ├── MessageBubble.tsx      → Memoized, presentational only
│   │   ├── ConversationListItem.tsx → Memoized list item
│   │   └── [Component].tsx
│   ├── templates/
│   │   ├── TemplateForm.tsx       → Presentational form (receives form prop)
│   │   ├── PhonePreview.tsx       → Preview UI (receives data props)
│   │   ├── StatusBadge.tsx        → Uses TEMPLATE_STATUS_CONFIG map
│   │   └── [Component].tsx
│   └── [domain]/
│       └── [Component].tsx        → Presentational only
│
├── types/
│   ├── index.ts                   → Shared interfaces and types
│   └── templates.ts               → Template enums and types
│
├── lib/
│   ├── api.ts                     → Centralized Axios instance (singleton)
│   ├── socket.ts                  → Socket.io client (singleton)
│   ├── push-subscription.ts       → Service worker registration
│   ├── template-utils.ts          → Pure functions: extractVariables, substituteWithSamples, makeButton
│   ├── template-constants.ts      → CONFIG MAPS: TEMPLATE_STATUS_CONFIG, ACTIVITY_CONFIG
│   ├── automation-utils.ts        → Pure functions for automation logic
│   └── utils.ts                   → General utilities (cn(), formatDate, type guards)
│
├── App.tsx                         → Route definitions
└── main.tsx                        → Entry point
```

## API Layer Details

### Creating New API Thunks
1. Create file: `src/api/[domain].ts`
2. Import from `@/api/templates` for examples
3. Each thunk should:
   - Use `createAsyncThunk` with proper type parameters
   - Use centralized `api` from `lib/api.ts`
   - Transform request data before sending
   - Handle errors and map to user messages
   - Return clean data for Redux

```typescript
// src/api/templates.ts
import { createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '@/lib/api';
import { Template, CreateTemplateInput } from '@/types';

export const createTemplate = createAsyncThunk<
  Template,                    // Return type
  CreateTemplateInput,         // Argument type
  { rejectValue: string }      // ThunkAPI config
>(
  'templates/create',           // Action type
  async (input, { rejectWithValue }) => {
    try {
      const res = await api.post<ApiResponse<Template>>('/templates', input);
      return res.data.data;
    } catch (err: unknown) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to create template');
    }
  },
);
```

### Using Thunks in Hooks
- Hooks dispatch thunks: `dispatch(fetchTemplates(...))`
- Redux handles the result automatically
- Hook selects from Redux and returns to page

```typescript
// src/hooks/templates/use-templates.ts
import { useAppDispatch, useAppSelector } from '@/app/store';
import { fetchTemplates } from '@/api/templates';
import { selectAllTemplates, selectTemplatesLoading } from '@/features/templates/templatesSlice';

export function useTemplates() {
  const dispatch = useAppDispatch();
  const templates = useAppSelector(selectAllTemplates);
  const loading = useAppSelector(selectTemplatesLoading);
  
  const fetch = useCallback(() => {
    dispatch(fetchTemplates({ search: '', page: 1, statusFilter: 'all' }));
  }, [dispatch]);
  
  return { templates, loading, fetch };
}
```

## Component Patterns

### Presentational Component
- Receives all data and callbacks as props
- Uses `React.memo` if list-rendered
- Never imports hooks or Redux

```typescript
interface TemplateCardProps {
  id: string;
  name: string;
  status: TemplateStatus;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const TemplateCard = React.memo(function TemplateCard({
  id,
  name,
  status,
  onEdit,
  onDelete,
}: TemplateCardProps) {
  return (
    <Card>
      <div className="flex justify-between items-center p-4">
        <div>
          <h3 className="font-semibold">{name}</h3>
          <StatusBadge status={status} />
        </div>
        <div className="flex gap-2">
          <Button onClick={() => onEdit(id)}>Edit</Button>
          <Button variant="destructive" onClick={() => onDelete(id)}>Delete</Button>
        </div>
      </div>
    </Card>
  );
});
```

### Using Config Maps (DRY Principle)
- Never hardcode conditional logic in components
- Define config maps in `lib/template-constants.ts`
- Components just look up values from the map

```typescript
// lib/template-constants.ts
export const TEMPLATE_STATUS_CONFIG = {
  PENDING: { icon: Clock, label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
  APPROVED: { icon: Check, label: 'Approved', className: 'bg-green-100 text-green-800' },
  REJECTED: { icon: X, label: 'Rejected', className: 'bg-red-100 text-red-800' },
} as const;

// components/templates/StatusBadge.tsx (CLEAN - no if/else)
export function StatusBadge({ status }: { status: TemplateStatus }) {
  const config = TEMPLATE_STATUS_CONFIG[status];
  const Icon = config.icon;
  return (
    <div className={config.className}>
      <Icon className="mr-1 h-4 w-4" />
      {config.label}
    </div>
  );
}
```

## Form Pattern

### Form State Hook
- Manages form data with `react-hook-form` + `zod`
- Returns form instance and watched values
- Never submits directly

```typescript
// hooks/templates/use-template-form-state.ts
export function useTemplateFormState(params?: UseTemplateFormStateParams) {
  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: { /* ... */ }
  });
  
  const buttonGroup = useWatch({ control: form.control, name: 'buttonGroup' });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'buttons',
  });
  
  return { form, buttonGroup, buttons, buttonFields, appendButton, removeButton };
}
```

### Form Logic Hook
- Validates and transforms data
- Calls API through thunks
- Returns preview data and submission handler

```typescript
// hooks/templates/use-template-form-logic.ts
export function useTemplateFormLogic(params: UseTemplateFormLogicParams) {
  const { createTemplate } = useTemplates();
  
  const onSubmit = useCallback(async (data: TemplateFormData) => {
    try {
      await createTemplate(data);
      navigate('/templates');
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  }, [createTemplate, navigate]);
  
  return { onSubmit, previewData, detectedVars };
}
```

### Page Composition
- Calls both hooks
- Passes form and handlers to form component
- Passes preview data to preview component

```typescript
// pages/Templates/NewTemplatePage.tsx
export default function NewTemplatePage() {
  const { form, buttonGroup } = useTemplateFormState();
  const { onSubmit, previewData } = useTemplateFormLogic({
    form,
    buttonGroup,
    // ... other params
  });
  
  return (
    <Layout>
      <TemplateForm form={form} onSubmit={onSubmit} />
      <TemplatePreviewPanel {...previewData} />
    </Layout>
  );
}
```

## Rules Summary

### DO:
- ✅ Define enums in `src/types/`
- ✅ Put async thunks in `src/api/`
- ✅ Put Redux logic in `src/features/`
- ✅ Put hooks in `src/hooks/`
- ✅ Make components presentational only
- ✅ Use `React.memo` for list items
- ✅ Wrap handlers in `useCallback`
- ✅ Use config maps instead of if/else
- ✅ Use Tailwind design tokens, no hex colors
- ✅ Return memoized values from hooks

### DON'T:
- ❌ Put API calls in components
- ❌ Put async thunks in Redux slices
- ❌ Import API layer in components
- ❌ Put JSX in hooks
- ❌ Put business logic in components
- ❌ Use string literals for enums
- ❌ Use `any` types
- ❌ Hardcode colors
- ❌ Put Redux imports in components (except in hooks)
- ❌ Create new Axios instances (use the centralized one)

## React Router
- Route definitions in `App.tsx`
- Use `React.lazy()` for page-level code splitting
- Nested routes for shared layouts (sidebar + content area)

## Performance Optimization
- Memoize list-rendered components with `React.memo`
- Wrap handler props in `useCallback` at page level
- Memoize selector factories: `const sel = useMemo(() => selectConvMessages(id), [id])`
- Use `useMemo` for expensive derived values
- Lazy load routes with `React.lazy()`
- Use Socket.io for real-time updates instead of polling
