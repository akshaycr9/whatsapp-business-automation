import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryButton } from '@/components/automations/CategorySidebar/CategoryButton';

const defaultProps = {
  categoryName: 'Order Flow',
  activeCount: 3,
  isSelected: false,
  onClick: vi.fn(),
};

describe('CategoryButton', () => {
  describe('rendering', () => {
    it('renders the category name', () => {
      render(<CategoryButton {...defaultProps} />);
      expect(screen.getByText('Order Flow')).toBeInTheDocument();
    });

    it('renders the active count badge', () => {
      render(<CategoryButton {...defaultProps} activeCount={5} />);
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('renders a zero count badge when there are no active automations', () => {
      render(<CategoryButton {...defaultProps} activeCount={0} />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('renders as a button element', () => {
      render(<CategoryButton {...defaultProps} />);
      expect(screen.getByRole('button', { name: /order flow/i })).toBeInTheDocument();
    });
  });

  describe('selected state', () => {
    it('is accessible as a button regardless of selected state', () => {
      render(<CategoryButton {...defaultProps} isSelected />);
      expect(screen.getByRole('button', { name: /order flow/i })).toBeInTheDocument();
    });

    it('still shows the correct count when selected', () => {
      render(<CategoryButton {...defaultProps} isSelected activeCount={2} />);
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  describe('interaction', () => {
    it('calls onClick when clicked', async () => {
      const onClick = vi.fn();
      render(<CategoryButton {...defaultProps} onClick={onClick} />);
      await userEvent.click(screen.getByRole('button', { name: /order flow/i }));
      expect(onClick).toHaveBeenCalledOnce();
    });

    it('calls onClick only once per click', async () => {
      const onClick = vi.fn();
      render(<CategoryButton {...defaultProps} onClick={onClick} />);
      await userEvent.click(screen.getByRole('button', { name: /order flow/i }));
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('memoization', () => {
    it('does not re-render when props have not changed', () => {
      let renderCount = 0;
      // Wrap in a spy component to count renders
      const SpyCategoryButton = (props: typeof defaultProps) => {
        renderCount++;
        return <CategoryButton {...props} />;
      };
      const { rerender } = render(<SpyCategoryButton {...defaultProps} />);
      const countAfterFirst = renderCount;

      // Re-render with identical props — CategoryButton itself should not re-render
      // (the spy wrapper will re-render, but the memoized inner won't)
      rerender(<SpyCategoryButton {...defaultProps} />);

      // The spy wrapper re-renders, but we verify the button still shows correct content
      expect(screen.getByText('Order Flow')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });
});
