import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithRedux } from '@/test/test-utils';
import { resetMockTemplates } from '@/test/mocks/handlers';
import EditTemplatePage from '../index';

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
    vi.clearAllMocks();
  });

  it('renders page without errors', async () => {
    const { container } = renderWithRedux(<EditTemplatePage />);

    await waitFor(() => {
      expect(container.querySelector('div')).toBeInTheDocument();
    });
  });

  it('loads and displays template data in form', async () => {
    renderWithRedux(<EditTemplatePage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue(/Template/i)).toBeInTheDocument();
    });
  });

  it('displays Templates in topbar', async () => {
    renderWithRedux(<EditTemplatePage />);

    await waitFor(() => {
      expect(screen.getByText('Templates')).toBeInTheDocument();
    });
  });

  it('renders page structure with form', async () => {
    const { container } = renderWithRedux(<EditTemplatePage />);

    await waitFor(() => {
      expect(container.querySelector('form')).toBeInTheDocument();
    });
  });

  it('renders form in edit mode', async () => {
    renderWithRedux(<EditTemplatePage />);

    await waitFor(() => {
      expect(document.querySelector('form')).toBeInTheDocument();
    });
  });

  it('has form loaded on page', async () => {
    const { container } = renderWithRedux(<EditTemplatePage />);

    await waitFor(() => {
      expect(container.querySelector('form')).toBeInTheDocument();
    });
  });

  it('shows form with template data', async () => {
    renderWithRedux(<EditTemplatePage />);

    await waitFor(() => {
      const form = document.querySelector('form');
      expect(form).toBeInTheDocument();
      expect(form?.textContent).toContain('Template');
    });
  });

  it('has submit button for form submission', async () => {
    renderWithRedux(<EditTemplatePage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    });
  });

  it('renders layout with topbar and form', async () => {
    const { container } = renderWithRedux(<EditTemplatePage />);

    await waitFor(() => {
      expect(container.querySelector('form')).toBeInTheDocument();
    });
  });

  it('displays form container element', async () => {
    const { container } = renderWithRedux(<EditTemplatePage />);

    await waitFor(() => {
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  it('renders form with input fields', async () => {
    renderWithRedux(<EditTemplatePage />);

    await waitFor(() => {
      expect(document.querySelectorAll('input').length).toBeGreaterThan(0);
    });
  });

  it('shows form with template data loaded', async () => {
    renderWithRedux(<EditTemplatePage />);

    await waitFor(() => {
      const form = document.querySelector('form');
      expect(form).toBeInTheDocument();
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
      expect(document.querySelectorAll('input').length).toBeGreaterThan(0);
    });
  });
});
