# Testing Infrastructure Guide

## Overview

This directory contains all testing configuration, utilities, and test data factories for the Qwertees WhatsApp Automation template feature.

## Directory Structure

```
src/test/
├── setup.ts                    # Global test setup (MSW, canvas mocking)
├── test-utils.tsx              # Custom render functions with Redux/Router
├── PHASE_1_COMPLETE.md         # Phase 1 completion documentation
├── README.md                   # This file
├── mocks/
│   ├── handlers.ts             # MSW handlers for all template API endpoints
│   └── server.ts               # MSW server initialization
└── factories/
    └── template.factory.ts     # Test data factory for templates
```

## Quick Start

### Running Tests

```bash
# Watch mode (recommended during development)
npm run test

# Run once and exit
npm run test -- --run

# Visual dashboard (open in browser)
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Writing Your First Test

```typescript
// src/components/templates/__tests__/MyComponent.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

## Using Test Utilities

### renderWithRedux - For Components That Need Redux

```typescript
import { renderWithRedux } from '@/test/test-utils';
import { MyPage } from '@/pages/MyPage';

describe('MyPage', () => {
  it('loads data from Redux', () => {
    const { store } = renderWithRedux(<MyPage />);
    expect(store.getState().templates.list).toEqual([]);
  });
});
```

### renderWithRouter - For Components That Need Routing

```typescript
import { renderWithRouter } from '@/test/test-utils';
import { Navigation } from '@/components/Navigation';

describe('Navigation', () => {
  it('navigates to templates page', async () => {
    renderWithRouter(<Navigation />, { initialRoute: '/dashboard' });
    // Test navigation
  });
});
```

## Using Test Data Factories

### Template Factory

```typescript
import { templateFactory } from '@/test/factories/template.factory';

// Create a single template
const template = templateFactory.create();

// Create with custom properties
const customTemplate = templateFactory.create({ name: 'Custom' });

// Create with specific status
const approvedTemplate = templateFactory.createApproved();
const pendingTemplate = templateFactory.createPending();
const rejectedTemplate = templateFactory.createRejected();

// Create multiple templates
const templates = templateFactory.createMultiple(5);

// Create form data for testing
const formData = templateFactory.createFormData();
```

## MSW (Mock Service Worker)

All API endpoints for templates are automatically mocked via MSW. Handlers are defined in `mocks/handlers.ts`.

### Mocked Endpoints

| Method | URL | Status | Notes |
|--------|-----|--------|-------|
| GET | `/api/templates` | 200 | Supports search, pagination, filtering |
| POST | `/api/templates` | 201 | Creates new template (PENDING status) |
| PATCH | `/api/templates/:id` | 200 | Updates template |
| DELETE | `/api/templates/:id` | 204 | Deletes template |
| POST | `/api/templates/:id/sync` | 200 | Syncs single template |
| POST | `/api/templates/sync-all` | 200 | Syncs all templates |
| GET | `/api/templates/status-counts` | 200 | Returns status distribution |

### Adding a New API Mock

1. Open `mocks/handlers.ts`
2. Add a new handler:

```typescript
http.post('/api/new-endpoint', async ({ request }) => {
  const body = await request.json();
  return HttpResponse.json(
    { data: { id: '123', ...body } },
    { status: 201 }
  );
})
```

3. Handler is automatically available in all tests

### Resetting Mock State

```typescript
import { resetMockTemplates, setMockTemplates } from '@/test/mocks/handlers';

describe('Template API', () => {
  afterEach(() => {
    resetMockTemplates(); // Reset to initial state
  });

  it('works with custom data', () => {
    const custom = templateFactory.createMultiple(2);
    setMockTemplates(custom);
    // Test with custom templates
  });
});
```

## Best Practices

### 1. Use userEvent Instead of fireEvent

❌ **Bad**
```typescript
import { fireEvent } from '@testing-library/react';
fireEvent.click(button);
```

✅ **Good**
```typescript
import userEvent from '@testing-library/user-event';
const user = userEvent.setup();
await user.click(button);
```

### 2. Query Elements Like Users Do

❌ **Bad**
```typescript
screen.getByTestId('submit-button');
```

✅ **Good**
```typescript
screen.getByRole('button', { name: /submit/i });
```

### 3. Use waitFor for Async Operations

```typescript
import { waitFor } from '@testing-library/react';

await waitFor(() => {
  expect(screen.getByText('Data loaded')).toBeInTheDocument();
});
```

### 4. Clean Up Between Tests

Handled automatically by `setup.ts`:
- Components cleanup via `cleanup()`
- MSW handlers reset via `server.resetHandlers()`
- Store state fresh for each test

### 5. Keep Tests Focused

One concept per test:
```typescript
✅ it('displays templates from API')
✅ it('filters templates by status')
✅ it('shows error message on API failure')

❌ it('displays, filters, and handles errors') // Too many concepts
```

## File Naming Conventions

- **Test files**: `*.test.tsx` or `*.test.ts`
- **Test directories**: `__tests__` folder next to component
- **Factory files**: `*.factory.ts`
- **Mock files**: `mocks/` directory

Examples:
```
src/
  components/
    templates/
      StatusBadge.tsx
      __tests__/
        StatusBadge.test.tsx      ← Test next to component
  hooks/
    templates/
      use-templates.ts
      __tests__/
        use-templates.test.ts     ← Test next to hook
```

## Coverage Goals

| Layer | Target | Status |
|-------|--------|--------|
| Components | 80%+ | In progress |
| Hooks | 80%+ | In progress |
| Redux | 90%+ | In progress |
| API/Thunks | 80%+ | In progress |
| **Overall** | **>80%** | 5% (6 tests) |

Run `npm run test:coverage` to check current coverage.

## Troubleshooting

### Canvas Rendering Errors in PhonePreview Tests
**Solution**: Already handled by `vitest-canvas-mock` in `setup.ts`

### API Not Being Intercepted
**Check**:
1. Handler URL matches exactly
2. HTTP method matches (GET, POST, etc.)
3. MSW server is running (it is, started in `beforeAll` hook)

### Redux State Not Updating in Tests
**Check**:
1. Using `renderWithRedux()` instead of regular `render()`
2. Async thunks using `waitFor()` before assertions
3. Store instance from `renderWithRedux()` if needed

### Cannot Find Module Errors
**Check**:
1. Path aliases configured in `vitest.config.ts`
2. Import paths use `@/` prefix (e.g., `@/test/test-utils`)

## Performance Tips

1. **Use `--run` flag for CI** - faster than watch mode
2. **Use `--pool=forks` for parallel execution** - when you have many tests
3. **Use `.only()` during development** - focus on one test
4. **Use `.skip()` for broken tests** - mark as TODO, fix later

```typescript
it.only('focus on this test', () => { /* ... */ });
it.skip('skip this for now', () => { /* ... */ });
```

## Resources

- [Vitest Documentation](https://vitest.dev)
- [React Testing Library Docs](https://testing-library.com/react)
- [MSW Documentation](https://mswjs.io)
- [Testing Best Practices](https://testingjavascript.com)

## Contributing

When adding new tests:
1. Follow the patterns in existing tests
2. Use factories for test data
3. Test user behavior, not implementation
4. Keep tests focused and readable
5. Update this README if adding new utilities

## Questions?

Refer to `PHASE_1_COMPLETE.md` for detailed setup information and troubleshooting.
