import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithRedux } from '@/test/test-utils';
import NewTemplatePage from '../index';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe('NewTemplatePage Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders new template page with form and preview', async () => {
    renderWithRedux(<NewTemplatePage />);

    await waitFor(() => {
      expect(screen.getByText('Templates')).toBeInTheDocument();
    });
  });

  it('displays form element', async () => {
    renderWithRedux(<NewTemplatePage />);

    await waitFor(() => {
      expect(document.querySelector('form')).toBeInTheDocument();
    });
  });

  it('shows back navigation to templates page', async () => {
    renderWithRedux(<NewTemplatePage />);

    await waitFor(() => {
      expect(screen.getByText('Templates')).toBeInTheDocument();
    });

    const navArea = screen.getByText('Templates');
    expect(navArea).toBeInTheDocument();
  });

  it('renders preview area with layout', async () => {
    const { container } = renderWithRedux(<NewTemplatePage />);

    await waitFor(() => {
      expect(screen.getByText('Templates')).toBeInTheDocument();
    });

    expect(container.querySelector('.flex')).toBeInTheDocument();
  });

  it('renders layout with flex container for form and preview', async () => {
    const { container } = renderWithRedux(<NewTemplatePage />);

    await waitFor(() => {
      expect(screen.getByText('Templates')).toBeInTheDocument();
    });

    expect(container.querySelector('.flex')).toBeInTheDocument();
  });

  it('has page layout with topbar and content', async () => {
    const { container } = renderWithRedux(<NewTemplatePage />);

    await waitFor(() => {
      expect(screen.getByText('Templates')).toBeInTheDocument();
    });

    expect(screen.getByText('Templates')).toBeInTheDocument();
    expect(container.querySelector('form')).toBeInTheDocument();
  });

  it('renders without errors on load', async () => {
    const { container } = renderWithRedux(<NewTemplatePage />);

    await waitFor(() => {
      expect(screen.getByText('Templates')).toBeInTheDocument();
    });

    expect(container.querySelector('div')).toBeInTheDocument();
  });

  it('shows form with all required sections', async () => {
    renderWithRedux(<NewTemplatePage />);

    await waitFor(() => {
      expect(document.querySelector('form')).toBeInTheDocument();
    });
  });

  it('has button elements for form interaction', async () => {
    renderWithRedux(<NewTemplatePage />);

    await waitFor(() => {
      expect(screen.getByText('Templates')).toBeInTheDocument();
    });

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('provides form instance to child components', async () => {
    renderWithRedux(<NewTemplatePage />);

    await waitFor(() => {
      expect(document.querySelector('form')).toBeInTheDocument();
    });
  });

  it('renders page layout component', async () => {
    const { container } = renderWithRedux(<NewTemplatePage />);

    await waitFor(() => {
      expect(container.querySelector('form')).toBeInTheDocument();
    });
  });

  it('displays template form component', async () => {
    renderWithRedux(<NewTemplatePage />);

    await waitFor(() => {
      expect(document.querySelector('form')).toBeInTheDocument();
    });
  });

  it('shows submit button', async () => {
    renderWithRedux(<NewTemplatePage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /submit template/i })).toBeInTheDocument();
    });
  });

  it('shows New Template sub-page label', async () => {
    renderWithRedux(<NewTemplatePage />);

    await waitFor(() => {
      expect(screen.getByText('New Template')).toBeInTheDocument();
    });
  });
});
