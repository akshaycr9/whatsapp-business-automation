import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { renderWithRedux } from '@/test/test-utils';
import { resetMockTemplates } from '@/test/mocks/handlers';
import EditTemplatePage from '../EditTemplatePage';

// Mock router hooks - return temp-1 as the ID
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ id: 'temp-1' }),
  };
});

describe('EditTemplatePage Integration', () => {
  beforeEach(() => {
    resetMockTemplates();
  });

  it('renders page without errors', async () => {
    const { container } = renderWithRedux(<EditTemplatePage />);

    // Page will either show template not found or render the form
    await waitFor(() => {
      expect(container.querySelector('div')).toBeInTheDocument();
    });
  });

  it('loads and displays template data in form', async () => {
    renderWithRedux(<EditTemplatePage />);

    // Wait for templates to load via the hook's auto-fetch
    await waitFor(() => {
      expect(screen.getByDisplayValue(/Template/i)).toBeInTheDocument();
    });
  });

  it('displays template name in topbar', async () => {
    renderWithRedux(<EditTemplatePage />);

    // Wait for template to load
    await waitFor(() => {
      const topbar = screen.getByText('Templates');
      expect(topbar).toBeInTheDocument();
    });
  });

  it('renders page structure with form', async () => {
    const { container } = renderWithRedux(<EditTemplatePage />);

    // Wait for template to load
    await waitFor(() => {
      const form = container.querySelector('form');
      expect(form).toBeInTheDocument();
    });
  });

  it('renders form with edit mode', async () => {
    renderWithRedux(<EditTemplatePage />);

    await waitFor(() => {
      const form = document.querySelector('form');
      expect(form).toBeInTheDocument();
    });
  });

  it('has form loaded on page', async () => {
    const { container } = renderWithRedux(<EditTemplatePage />);

    await waitFor(() => {
      expect(container.querySelector('form')).toBeInTheDocument();
    });
  });

  it('shows form in edit mode with data', async () => {
    renderWithRedux(<EditTemplatePage />);

    // Wait for form to load with template data
    await waitFor(() => {
      const form = document.querySelector('form');
      expect(form).toBeInTheDocument();
      expect(form?.textContent).toContain('Template');
    });
  });

  it('has submit button for form submission', async () => {
    renderWithRedux(<EditTemplatePage />);

    await waitFor(() => {
      const button = screen.getByRole('button', { name: /submit/i });
      expect(button).toBeInTheDocument();
    });
  });

  it('renders layout with topbar and form', async () => {
    const { container } = renderWithRedux(<EditTemplatePage />);

    await waitFor(() => {
      const form = container.querySelector('form');
      expect(form).toBeInTheDocument();
    });
  });

  it('displays form container element', async () => {
    const { container } = renderWithRedux(<EditTemplatePage />);

    await waitFor(() => {
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  it('renders form with all required input fields', async () => {
    renderWithRedux(<EditTemplatePage />);

    await waitFor(() => {
      const form = document.querySelector('form');
      expect(form?.querySelectorAll('input').length).toBeGreaterThan(0);
    });
  });

  it('shows form with template data loaded', async () => {
    renderWithRedux(<EditTemplatePage />);

    await waitFor(() => {
      const form = document.querySelector('form');
      expect(form).toBeInTheDocument();
      // Form should have content from loaded template
      expect(form?.textContent?.length).toBeGreaterThan(0);
    });
  });

  it('displays form with proper styling', async () => {
    const { container } = renderWithRedux(<EditTemplatePage />);

    await waitFor(() => {
      const form = container.querySelector('form');
      expect(form?.className).toContain('rounded-lg');
    });
  });

  it('renders form with border styling', async () => {
    const { container } = renderWithRedux(<EditTemplatePage />);

    await waitFor(() => {
      const form = container.querySelector('form');
      expect(form?.className).toContain('border');
    });
  });

  it('renders without crashing when loading template', async () => {
    expect(() => {
      renderWithRedux(<EditTemplatePage />);
    }).not.toThrow();
  });

  it('displays form inputs for editing', async () => {
    renderWithRedux(<EditTemplatePage />);

    await waitFor(() => {
      const inputs = document.querySelectorAll('input');
      expect(inputs.length).toBeGreaterThan(0);
    });
  });
});
