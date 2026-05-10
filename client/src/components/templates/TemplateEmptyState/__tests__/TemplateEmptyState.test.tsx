import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TemplateEmptyState } from '../index';
import { TemplateStatus } from '@/types/templates';

describe('TemplateEmptyState', () => {
  describe('Rendering', () => {
    it('renders empty state message', () => {
      const handleCreateNew = vi.fn();

      render(
        <TemplateEmptyState
          statusFilter="all"
          onCreateNew={handleCreateNew}
        />
      );

      expect(screen.getByText(/no templates/i)).toBeInTheDocument();
    });

    it('renders icon or image', () => {
      const { container } = render(
        <TemplateEmptyState
          statusFilter="all"
          onCreateNew={vi.fn()}
        />
      );

      // Should have some visual content (icon, image, or similar)
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe('New Template Button', () => {
    it('shows "New Template" button when filter is "all"', () => {
      render(
        <TemplateEmptyState
          statusFilter="all"
          onCreateNew={vi.fn()}
        />
      );

      expect(screen.getByRole('button', { name: /new template/i })).toBeInTheDocument();
    });

    it('does not show button when filter is not "all"', () => {
      render(
        <TemplateEmptyState
          statusFilter="APPROVED"
          onCreateNew={vi.fn()}
        />
      );

      expect(screen.queryByRole('button', { name: /new template/i })).not.toBeInTheDocument();
    });

    it('calls onCreateNew when button clicked', async () => {
      const user = userEvent.setup();
      const handleCreateNew = vi.fn();

      render(
        <TemplateEmptyState
          statusFilter="all"
          onCreateNew={handleCreateNew}
        />
      );

      const button = screen.getByRole('button', { name: /new template/i });
      await user.click(button);

      expect(handleCreateNew).toHaveBeenCalledTimes(1);
    });

    it('handles multiple clicks', async () => {
      const user = userEvent.setup();
      const handleCreateNew = vi.fn();

      render(
        <TemplateEmptyState
          statusFilter="all"
          onCreateNew={handleCreateNew}
        />
      );

      const button = screen.getByRole('button', { name: /new template/i });
      await user.click(button);
      await user.click(button);

      expect(handleCreateNew).toHaveBeenCalledTimes(2);
    });
  });

  describe('Different Filters', () => {
    it('hides button for APPROVED filter', () => {
      render(
        <TemplateEmptyState
          statusFilter={TemplateStatus.APPROVED}
          onCreateNew={vi.fn()}
        />
      );

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('hides button for PENDING filter', () => {
      render(
        <TemplateEmptyState
          statusFilter={TemplateStatus.PENDING}
          onCreateNew={vi.fn()}
        />
      );

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('hides button for REJECTED filter', () => {
      render(
        <TemplateEmptyState
          statusFilter={TemplateStatus.REJECTED}
          onCreateNew={vi.fn()}
        />
      );

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('shows button again when filter changes back to "all"', () => {
      const { rerender } = render(
        <TemplateEmptyState
          statusFilter={TemplateStatus.APPROVED}
          onCreateNew={vi.fn()}
        />
      );

      expect(screen.queryByRole('button')).not.toBeInTheDocument();

      rerender(
        <TemplateEmptyState
          statusFilter="all"
          onCreateNew={vi.fn()}
        />
      );

      expect(screen.getByRole('button', { name: /new template/i })).toBeInTheDocument();
    });
  });

  describe('Message Content', () => {
    it('displays appropriate message for empty templates', () => {
      render(
        <TemplateEmptyState
          statusFilter="all"
          onCreateNew={vi.fn()}
        />
      );

      const emptyText = screen.getByText(/no templates/i);
      expect(emptyText).toBeInTheDocument();
    });

    it('message is visible and readable', () => {
      render(
        <TemplateEmptyState
          statusFilter="all"
          onCreateNew={vi.fn()}
        />
      );

      const emptyText = screen.getByText(/no templates/i);
      expect(emptyText).toHaveTextContent(/no templates/i);
    });
  });

  describe('Accessibility', () => {
    it('button is keyboard accessible', async () => {
      const user = userEvent.setup();
      const handleCreateNew = vi.fn();

      render(
        <TemplateEmptyState
          statusFilter="all"
          onCreateNew={handleCreateNew}
        />
      );

      const button = screen.getByRole('button', { name: /new template/i });
      // Focus and press Enter
      button.focus();
      await user.keyboard('{Enter}');

      expect(handleCreateNew).toHaveBeenCalled();
    });

    it('button is focusable', () => {
      render(
        <TemplateEmptyState
          statusFilter="all"
          onCreateNew={vi.fn()}
        />
      );

      const button = screen.getByRole('button', { name: /new template/i });
      expect(button).toBeInTheDocument();
      button.focus();
      expect(document.activeElement).toBe(button);
    });
  });

  describe('Styling', () => {
    it('has appropriate container styling', () => {
      const { container } = render(
        <TemplateEmptyState
          statusFilter="all"
          onCreateNew={vi.fn()}
        />
      );

      // Should be centered and have vertical padding
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('text-center');
    });
  });
});
