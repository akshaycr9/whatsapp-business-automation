---
description: SOLID principles applied to React components, hooks, and architecture
globs: ["client/src/**/*.ts", "client/src/**/*.tsx"]
---

# SOLID Principles in React

## Single Responsibility Principle (SRP)
> Each component, hook, and function should have one reason to change.

### Component Level
- **One job per component**: Each component should do one thing well
- Example (Good):
  - `StatusBadge.tsx` — Only renders status UI (no data fetching, no form logic)
  - `PhonePreview.tsx` — Only renders phone mockup (no API calls, no state management)
  - `MessageBubble.tsx` — Only renders a single message (memoized, no hooks)

- Example (Bad):
  - A component that fetches templates AND renders a list AND handles editing
  - A component mixing form validation with API calls and UI rendering

### Hook Level
- **One data domain per hook**: Each hook manages one logical domain
- Example (Good):
  - `use-templates.ts` — Only manages template operations (fetch, create, delete, sync)
  - `use-template-form-state.ts` — Only manages form state (useForm, useWatch, useFieldArray)
  - `use-template-form-logic.ts` — Only handles form validation and submission

- Example (Bad):
  - A hook that manages both templates and customers
  - A hook that manages API calls AND form state AND component state

### Function Level
- **One purpose per utility function**
- Example (Good):
  - `extractVariables(text)` — Only extracts {{1}}, {{2}}, etc. from text
  - `substituteWithSamples(text, samples)` — Only substitutes variables with sample values
  - `makeButton(type)` — Only creates a button object

- Example (Bad):
  - A function that extracts variables AND validates AND formats
  - A utility that does 3+ different transformations

## Open/Closed Principle (OCP)
> Components/systems should be open for extension, closed for modification.

### Use Config Maps Instead of If/Else
- **Problem**: Every new variant requires code changes
- **Solution**: Use configuration maps (objects/lookups)

Example (Bad):
```typescript
// components/templates/StatusBadge.tsx
export function StatusBadge({ status }: { status: TemplateStatus }) {
  if (status === 'PENDING') return <span className="bg-yellow">Pending</span>;
  if (status === 'APPROVED') return <span className="bg-green">Approved</span>;
  if (status === 'REJECTED') return <span className="bg-red">Rejected</span>;
  // Adding a new status requires editing this component!
}
```

Example (Good):
```typescript
// lib/template-constants.ts
export const TEMPLATE_STATUS_CONFIG = {
  PENDING: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800', icon: Clock },
  APPROVED: { label: 'Approved', className: 'bg-green-100 text-green-800', icon: Check },
  REJECTED: { label: 'Rejected', className: 'bg-red-100 text-red-800', icon: X },
} as const;

// components/templates/StatusBadge.tsx (CLEAN - no if/else)
export function StatusBadge({ status }: { status: TemplateStatus }) {
  const config = TEMPLATE_STATUS_CONFIG[status];
  const Icon = config.icon;
  return <span className={config.className}><Icon /> {config.label}</span>;
}

// Adding a new status: just add to TEMPLATE_STATUS_CONFIG, no component changes!
```

### Benefits of Config Maps
- ✅ Adding a new variant = 1 map entry, no code changes
- ✅ Easier testing (test the map, test the component once)
- ✅ Centralized configuration (one place to manage all variants)
- ✅ DRY principle (no repeated if/else patterns)

### Config Maps in This Codebase
- `TEMPLATE_STATUS_CONFIG`: Maps template status to color, icon, label
- `ACTIVITY_CONFIG`: Maps event type to icon and description
- `EVENT_CONFIG`: Maps automation event type to label

## Liskov Substitution Principle (LSP)
> Derived types must be substitutable for their base types.

### React Component Contracts
- All components with the same purpose should have compatible prop interfaces
- If you replace one component with another, the interface shouldn't break the consumer

Example:
```typescript
// All button components should accept onClick, disabled, children
interface ButtonProps {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'destructive';
}

// ✅ shadcn/ui Button can replace a custom Button component
// ✅ All places that use Button work with any Button variant
```

### Hook Contracts
- Custom hooks should return predictable shapes
- A hook that manages "templates" should always return: `{ data, loading, error, refetch }`

## Interface Segregation Principle (ISP)
> Clients should not depend on interfaces they don't use.

### Component Props
- **Never pass a full model object when only a few fields are used**
- Only pass the fields that the component actually renders

Example (Bad):
```typescript
// Passing entire Template object to component that only needs id and name
<TemplateCard template={fullTemplateObject} />

// Inside TemplateCard
interface TemplateCardProps {
  template: Template; // Full object with 20+ fields!
}

export function TemplateCard({ template }: TemplateCardProps) {
  return <div>{template.name}</div>; // Only uses name!
}
```

Example (Good):
```typescript
// Page/container maps the object to only needed props
<TemplateCard id={template.id} name={template.name} status={template.status} onEdit={onEdit} />

// Component receives only what it needs
interface TemplateCardProps {
  id: string;
  name: string;
  status: TemplateStatus;
  onEdit: (id: string) => void;
}

export function TemplateCard({ id, name, status, onEdit }: TemplateCardProps) {
  return <div onClick={() => onEdit(id)}>{name}</div>;
}
```

### Benefits
- ✅ Component contracts are clear (props interface shows exactly what's used)
- ✅ Easier to test (fewer fields to mock)
- ✅ Easier to refactor (changing unrelated fields doesn't break component)
- ✅ Better performance (component only depends on fields it uses)

## Dependency Inversion Principle (DIP)
> High-level modules should not depend on low-level modules. Both should depend on abstractions.

### Components Should Not Import Hooks
- **Bad**: Component imports hook, calls it, uses data
- **Good**: Page imports hook, calls it, passes data to component via props

Example (Bad):
```typescript
// components/templates/TemplateForm.tsx
export function TemplateForm() {
  const { form, buttonGroup } = useTemplateFormState(); // Component depends on hook!
  const { onSubmit } = useTemplateFormLogic({ form, buttonGroup });
  // ...
}
```

Example (Good):
```typescript
// pages/Templates/NewTemplatePage.tsx (High-level composition)
export default function NewTemplatePage() {
  const { form, buttonGroup } = useTemplateFormState(); // Page depends on hook
  const { onSubmit } = useTemplateFormLogic({ form, buttonGroup });
  
  return (
    <TemplateForm form={form} buttonGroup={buttonGroup} onSubmit={onSubmit} />
  );
}

// components/templates/TemplateForm.tsx (Low-level presentation)
interface TemplateFormProps {
  form: UseFormReturn<TemplateFormData>;
  buttonGroup: TemplateButtonGroupType;
  onSubmit: (data: TemplateFormData) => Promise<void>;
}

export function TemplateForm({ form, buttonGroup, onSubmit }: TemplateFormProps) {
  // Component doesn't know about hooks, just receives what it needs
  return <form onSubmit={form.handleSubmit(onSubmit)}>{ /* ... */ }</form>;
}
```

### Forms Should Not Import Hooks
- Forms receive `form` prop (from `react-hook-form`)
- Forms receive `onSubmit` callback
- Never import `useTemplateFormLogic` or any other hook in the form component

### Dialogs/Modals Should Not Import Hooks
- Dialogs receive data and callbacks as props
- Dialogs emit events through callbacks
- Never dispatch Redux actions directly in dialogs

## Real-World Application

### Bad Architecture (Violates All Principles)
```typescript
// ❌ BAD: One component doing everything
export function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  
  // Fetches data, manages state, renders form, renders list, handles editing
  useEffect(() => { /* fetch */ }, []);
  
  return (
    <div>
      <input onChange={e => setSelectedStatus(e.target.value)} />
      {templates.map(t => (
        <div>
          {t.status === 'PENDING' ? <span className="bg-yellow">Pending</span> : /* ... */}
          <TemplateForm template={t} />
          <button onClick={() => deleteTemplate(t.id)} />
        </div>
      ))}
    </div>
  );
}
```

### Good Architecture (Follows All Principles)
```typescript
// ✅ GOOD: Separation of concerns

// 1. Hook owns one domain (templates)
function useTemplates() {
  const dispatch = useAppDispatch();
  const templates = useAppSelector(selectAllTemplates);
  const fetch = () => dispatch(fetchTemplates(...));
  return { templates, fetch };
}

// 2. Component is presentational (no hooks, no logic)
function StatusBadge({ status }) {
  const config = TEMPLATE_STATUS_CONFIG[status];
  return <span className={config.className}>{config.label}</span>;
}

// 3. Page composes everything
function TemplatesPage() {
  const { templates, fetch } = useTemplates(); // One hook, one domain
  const [filter, setFilter] = useState('ALL');  // Local UI state only
  
  return (
    <div>
      <FilterInput value={filter} onChange={setFilter} />
      {templates.map(t => (
        <TemplateCard
          key={t.id}
          id={t.id}
          name={t.name}
          status={t.status}
          onEdit={id => navigate(`/templates/${id}/edit`)}
          onDelete={id => dispatch(deleteTemplate(id))}
        />
      ))}
    </div>
  );
}
```

## Rules Summary

### Single Responsibility
- ✅ One component = one job
- ✅ One hook = one domain
- ✅ One function = one purpose
- ❌ Don't put unrelated logic in the same component/hook

### Open/Closed
- ✅ Use config maps for variants
- ✅ Adding new variant = 1 map entry
- ✅ No code changes needed for new variants
- ❌ Never add new if/else statements for variants

### Liskov Substitution
- ✅ All components with same purpose have compatible props
- ✅ Hooks return predictable shapes
- ✅ You can swap implementations without breaking consumers

### Interface Segregation
- ✅ Pass only fields that component uses
- ✅ Props interface is specific, not generic
- ✅ Map/transform at page level
- ❌ Don't pass full objects when only a few fields are used

### Dependency Inversion
- ✅ Pages depend on hooks, not components on hooks
- ✅ Components receive data and callbacks via props
- ✅ Forms don't import hooks
- ✅ Components don't dispatch Redux
- ❌ Never import hooks in components (except pages)
