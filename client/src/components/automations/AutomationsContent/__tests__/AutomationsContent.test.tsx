import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AutomationsContent } from '@/components/automations/AutomationsContent';
import { makeAutomation } from '@/test/factories/automation.factory';

const defaultProps = {
  loading: false,
  error: null,
  automations: [],
  activeCount: 0,
  pausedCount: 0,
  onToggle: vi.fn(),
  onEdit: vi.fn(),
};

describe('AutomationsContent', () => {
  describe('status chip', () => {
    it('shows active and paused counts', () => {
      render(<AutomationsContent {...defaultProps} activeCount={2} pausedCount={1} />);
      expect(screen.getByText(/2 active · 1 paused/i)).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('shows skeleton cards while loading', () => {
      // RuleCardSkeleton renders an animate-pulse div — check no automation names appear
      const { container } = render(<AutomationsContent {...defaultProps} loading />);
      expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
      // Three skeleton cards are rendered
      expect(container.querySelectorAll('.animate-pulse')).toHaveLength(3);
    });
  });

  describe('empty state', () => {
    it('shows a friendly message when automations list is empty', () => {
      render(<AutomationsContent {...defaultProps} />);
      expect(
        screen.getByText(/no automations configured in this category yet/i),
      ).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('shows the error message when an error is provided', () => {
      render(<AutomationsContent {...defaultProps} error="Failed to load" />);
      expect(screen.getByText('Failed to load')).toBeInTheDocument();
      expect(screen.getByText(/failed to load automations/i)).toBeInTheDocument();
    });

    it('does not show error banner when error is null', () => {
      render(<AutomationsContent {...defaultProps} />);
      expect(screen.queryByText(/failed to load automations/i)).not.toBeInTheDocument();
    });
  });

  describe('automation list', () => {
    it('renders a card for each automation', () => {
      const automations = [
        makeAutomation({ id: 'a1', name: 'Order Confirmed' }),
        makeAutomation({ id: 'a2', name: 'Order Cancelled' }),
      ];
      render(<AutomationsContent {...defaultProps} automations={automations} />);
      expect(screen.getByText('Order Confirmed')).toBeInTheDocument();
      expect(screen.getByText('Order Cancelled')).toBeInTheDocument();
    });

    it('calls onEdit with the automation id when Edit is clicked', async () => {
      const onEdit = vi.fn();
      render(
        <AutomationsContent
          {...defaultProps}
          automations={[makeAutomation({ id: 'auto-001' })]}
          onEdit={onEdit}
        />,
      );
      await userEvent.click(screen.getByRole('button', { name: /edit/i }));
      expect(onEdit).toHaveBeenCalledWith('auto-001');
    });
  });
});
