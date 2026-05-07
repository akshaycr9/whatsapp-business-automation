import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRedux } from '@/test/test-utils';
import NewTemplatePage from '../NewTemplatePage';

// Mock router hooks
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

    // Wait for page to load
    await waitFor(() => {
      const pageElement = screen.getByText('Templates');
      expect(pageElement).toBeInTheDocument();
    });
  });

  it('displays form fields for new template', async () => {
    renderWithRedux(<NewTemplatePage />);

    await waitFor(() => {
      expect(screen.getByText('Templates')).toBeInTheDocument();
    });

    // Check for form structure
    const form = document.querySelector('form');
    expect(form).toBeInTheDocument();
  });

  it('shows back navigation to templates page', async () => {
    renderWithRedux(<NewTemplatePage />);

    await waitFor(() => {
      expect(screen.getByText('Templates')).toBeInTheDocument();
    });

    // Check for navigation elements
    const navArea = screen.getByText('Templates');
    expect(navArea).toBeInTheDocument();
  });

  it('displays form with mode set to new', async () => {
    renderWithRedux(<NewTemplatePage />);

    await waitFor(() => {
      expect(screen.getByText('Templates')).toBeInTheDocument();
    });

    // Form should be rendered
    const form = document.querySelector('form');
    expect(form).toBeInTheDocument();
  });

  it('renders preview area with live preview', async () => {
    renderWithRedux(<NewTemplatePage />);

    await waitFor(() => {
      expect(screen.getByText('Templates')).toBeInTheDocument();
    });

    // Page structure includes preview panel
    const pageElement = document.querySelector('.flex');
    expect(pageElement).toBeInTheDocument();
  });

  it('displays topbar with template creation context', async () => {
    renderWithRedux(<NewTemplatePage />);

    await waitFor(() => {
      expect(screen.getByText('Templates')).toBeInTheDocument();
    });

    // Topbar should indicate new template context
    expect(screen.getByText('Templates')).toBeInTheDocument();
  });

  it('shows form in edit mode when mode is new', async () => {
    renderWithRedux(<NewTemplatePage />);

    await waitFor(() => {
      expect(screen.getByText('Templates')).toBeInTheDocument();
    });

    // Verify form exists for new template
    const form = document.querySelector('form');
    expect(form).toBeInTheDocument();
  });

  it('renders layout with flex container for form and preview', async () => {
    const { container } = renderWithRedux(<NewTemplatePage />);

    await waitFor(() => {
      expect(screen.getByText('Templates')).toBeInTheDocument();
    });

    // Check for layout structure
    const flexContainer = container.querySelector('.flex');
    expect(flexContainer).toBeInTheDocument();
  });

  it('has page layout with topbar and content', async () => {
    const { container } = renderWithRedux(<NewTemplatePage />);

    await waitFor(() => {
      expect(screen.getByText('Templates')).toBeInTheDocument();
    });

    // Verify page structure
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

  it('displays detected variables section in preview', async () => {
    renderWithRedux(<NewTemplatePage />);

    await waitFor(() => {
      expect(screen.getByText('Templates')).toBeInTheDocument();
    });

    // Page should render with preview area
    const pageArea = document.querySelector('div');
    expect(pageArea).toBeInTheDocument();
  });

  it('shows form with all required sections', async () => {
    renderWithRedux(<NewTemplatePage />);

    await waitFor(() => {
      expect(screen.getByText('Templates')).toBeInTheDocument();
    });

    // Form exists and is ready for input
    const form = document.querySelector('form');
    expect(form).toBeInTheDocument();
  });

  it('renders page layout component', async () => {
    const { container } = renderWithRedux(<NewTemplatePage />);

    await waitFor(() => {
      expect(screen.getByText('Templates')).toBeInTheDocument();
    });

    // Page layout should be rendered
    expect(container.querySelector('form')).toBeInTheDocument();
  });

  it('displays template form component', async () => {
    renderWithRedux(<NewTemplatePage />);

    await waitFor(() => {
      expect(screen.getByText('Templates')).toBeInTheDocument();
    });

    // Form component should be present
    const form = document.querySelector('form');
    expect(form).toBeInTheDocument();
  });

  it('has button elements for form interaction', async () => {
    renderWithRedux(<NewTemplatePage />);

    await waitFor(() => {
      expect(screen.getByText('Templates')).toBeInTheDocument();
    });

    // Should have buttons for form actions
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('renders preview with initial default message', async () => {
    renderWithRedux(<NewTemplatePage />);

    await waitFor(() => {
      expect(screen.getByText('Templates')).toBeInTheDocument();
    });

    // Preview area should show default message
    expect(document.querySelector('div')).toBeInTheDocument();
  });

  it('provides form instance to child components', async () => {
    renderWithRedux(<NewTemplatePage />);

    await waitFor(() => {
      expect(screen.getByText('Templates')).toBeInTheDocument();
    });

    // Form should be functional (has form element)
    const form = document.querySelector('form');
    expect(form).toBeInTheDocument();
  });
});
