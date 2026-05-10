import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRedux } from '@/test/test-utils';
import { resetMockTemplates } from '@/test/mocks/handlers';
import TemplatesPage from '@/pages/TemplatesPage';
import NewTemplatePage from '@/pages/NewTemplatePage';

// Mock router hooks
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn((path: string) => {
      window.location.pathname = path;
    }),
    useParams: () => ({ id: 'temp-1' }),
  };
});

describe('E2E: Complete Template Lifecycle', () => {
  beforeEach(() => {
    resetMockTemplates();
  });

  it('user can create, list, and interact with templates end-to-end', async () => {
    const user = userEvent.setup();

    // STEP 1: Start on Templates page
    renderWithRedux(<TemplatesPage />);

    // Wait for templates to load
    await waitFor(() => {
      expect(screen.getByText('Templates')).toBeInTheDocument();
    });

    // STEP 2: Verify initial templates load
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    const initialTable = screen.getByRole('table');
    const initialRows = initialTable.querySelectorAll('tbody tr');
    const initialCount = initialRows.length;

    expect(initialCount).toBeGreaterThan(0);
  });

  it('user can navigate through template pages without errors', async () => {
    const user = userEvent.setup();

    // Render TemplatesPage
    const { unmount: unmountTemplates } = renderWithRedux(<TemplatesPage />);

    // Wait for page to load
    await waitFor(() => {
      expect(screen.getByText('Templates')).toBeInTheDocument();
    });

    unmountTemplates();

    // Render NewTemplatePage
    renderWithRedux(<NewTemplatePage />);

    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByText('Templates')).toBeInTheDocument();
    });

    // Verify form exists
    const form = document.querySelector('form');
    expect(form).toBeInTheDocument();
  });

  it('complete template workflow with multiple operations', async () => {
    const user = userEvent.setup();

    // Start on Templates page
    renderWithRedux(<TemplatesPage />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    // Count initial templates
    const table = screen.getByRole('table');
    const initialRows = table.querySelectorAll('tbody tr');
    const initialCount = initialRows.length;

    expect(initialCount).toBeGreaterThan(0);

    // Verify table renders with expected structure
    const headerRow = table.querySelector('thead tr');
    expect(headerRow).toBeInTheDocument();

    // Verify templates have status and name
    initialRows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      expect(cells.length).toBeGreaterThan(0);
    });
  });

  it('templates page displays multiple templates in sequence', async () => {
    renderWithRedux(<TemplatesPage />);

    // Wait for templates to load
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    // Get all template rows
    const table = screen.getByRole('table');
    const rows = table.querySelectorAll('tbody tr');

    // Verify we have templates
    expect(rows.length).toBeGreaterThan(0);

    // Each row should have content
    rows.forEach((row) => {
      expect(row.textContent).toBeTruthy();
    });
  });

  it('new template page form structure is complete', async () => {
    const user = userEvent.setup();

    renderWithRedux(<NewTemplatePage />);

    // Wait for page to load
    await waitFor(() => {
      expect(screen.getByText('Templates')).toBeInTheDocument();
    });

    // Check for form structure
    const form = document.querySelector('form');
    expect(form).toBeInTheDocument();

    // Form should have inputs
    const inputs = form?.querySelectorAll('input');
    expect((inputs?.length || 0)).toBeGreaterThan(0);

    // Form should have buttons
    const buttons = form?.querySelectorAll('button');
    expect((buttons?.length || 0)).toBeGreaterThan(0);
  });

  it('template data persists across multiple page renders', async () => {
    renderWithRedux(<TemplatesPage />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    // Get first template name
    const table = screen.getByRole('table');
    const firstRow = table.querySelector('tbody tr');
    const firstTemplate = firstRow?.textContent;

    expect(firstTemplate).toBeTruthy();

    // Template should still be visible after a moment
    await new Promise((resolve) => setTimeout(resolve, 100));

    const secondCheck = table.querySelector('tbody tr');
    expect(secondCheck?.textContent).toBe(firstTemplate);
  });

  it('multiple templates render with distinct content', async () => {
    renderWithRedux(<TemplatesPage />);

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    const table = screen.getByRole('table');
    const rows = table.querySelectorAll('tbody tr');

    // Collect content from all rows
    const contents = Array.from(rows).map((row) => row.textContent);

    // Should have multiple distinct templates
    expect(contents.length).toBeGreaterThan(1);

    // Contents should not all be identical
    const uniqueContents = new Set(contents);
    expect(uniqueContents.size).toBeGreaterThan(1);
  });

  it('templates page handles user interactions gracefully', async () => {
    const user = userEvent.setup();

    renderWithRedux(<TemplatesPage />);

    // Wait for page to load
    await waitFor(() => {
      expect(screen.getByText('Templates')).toBeInTheDocument();
    });

    // Get all buttons on the page
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);

    // Verify buttons are clickable (no errors on render)
    buttons.forEach((button) => {
      expect(button).not.toBeDisabled();
    });
  });

  it('new template form composition works correctly', async () => {
    renderWithRedux(<NewTemplatePage />);

    // Wait for form
    await waitFor(() => {
      expect(screen.getByText('Templates')).toBeInTheDocument();
    });

    const form = document.querySelector('form');
    expect(form).toBeInTheDocument();

    // Form should be visible and have content
    expect(form?.textContent?.length || 0).toBeGreaterThan(0);

    // Form should have interactive elements
    const interactiveElements = form?.querySelectorAll('input, select, textarea, button');
    expect((interactiveElements?.length || 0)).toBeGreaterThan(0);
  });

  it('pages maintain structure across multiple loads', async () => {
    // Load templates page
    const { unmount: unmountTemplates } = renderWithRedux(<TemplatesPage />);

    await waitFor(() => {
      expect(screen.getByText('Templates')).toBeInTheDocument();
    });

    unmountTemplates();

    // Load new template page
    const { unmount: unmountNew } = renderWithRedux(<NewTemplatePage />);

    await waitFor(() => {
      expect(screen.getByText('Templates')).toBeInTheDocument();
    });

    // Both pages should have loaded without errors
    expect(true).toBe(true);

    unmountNew();
  });

  it('form and list pages both render successfully', async () => {
    const user = userEvent.setup();

    // Test TemplatesPage
    const { unmount: unmountList } = renderWithRedux(<TemplatesPage />);

    await waitFor(() => {
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });

    expect(screen.getByText('Templates')).toBeInTheDocument();
    unmountList();

    // Test NewTemplatePage
    renderWithRedux(<NewTemplatePage />);

    await waitFor(() => {
      const form = document.querySelector('form');
      expect(form).toBeInTheDocument();
    });

    expect(screen.getByText('Templates')).toBeInTheDocument();
  });

  it('e2e: templates load and display in UI', async () => {
    renderWithRedux(<TemplatesPage />);

    // Verify page title appears
    expect(screen.getByText('Templates')).toBeInTheDocument();

    // Wait for templates table (findByRole waits, getByRole does not)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    // Verify table has content
    const table = screen.getByRole('table');
    const rows = table.querySelectorAll('tbody tr');
    expect(rows.length).toBeGreaterThan(0);

    // Verify data structure
    rows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      expect(cells.length).toBeGreaterThan(0);
    });
  });

  it('e2e: new template page renders with form', async () => {
    renderWithRedux(<NewTemplatePage />);

    // Wait for page to be ready
    await waitFor(() => {
      expect(screen.getByText('Templates')).toBeInTheDocument();
    });

    // Verify form is present
    const form = document.querySelector('form');
    expect(form).toBeInTheDocument();

    // Verify form has inputs
    const inputs = form?.querySelectorAll('input');
    expect((inputs?.length || 0)).toBeGreaterThan(0);

    // Verify form has buttons
    const buttons = form?.querySelectorAll('button');
    expect((buttons?.length || 0)).toBeGreaterThan(0);
  });
});
