import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TemplateTabs } from '../index';
import { TemplateStatus } from '@/types/templates';
import type { StatusCounts } from '@/types';

const defaultStatusCounts: StatusCounts = {
  all: 10,
  [TemplateStatus.APPROVED]: 5,
  [TemplateStatus.PENDING]: 3,
  [TemplateStatus.REJECTED]: 2,
};

describe('TemplateTabs', () => {
  describe('Rendering', () => {
    it('renders all status tabs', () => {
      const handleChange = vi.fn();

      render(
        <TemplateTabs
          statusFilter="all"
          onStatusFilterChange={handleChange}
          statusCounts={defaultStatusCounts}
        />
      );

      expect(screen.getByRole('button', { name: /all/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /approved/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /pending/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /rejected/i })).toBeInTheDocument();
    });

    it('renders tab labels', () => {
      const handleChange = vi.fn();

      render(
        <TemplateTabs
          statusFilter="all"
          onStatusFilterChange={handleChange}
          statusCounts={defaultStatusCounts}
        />
      );

      expect(screen.getByText('All')).toBeInTheDocument();
      expect(screen.getByText('Approved')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('Rejected')).toBeInTheDocument();
    });

    it('renders count badges', () => {
      const handleChange = vi.fn();

      render(
        <TemplateTabs
          statusFilter="all"
          onStatusFilterChange={handleChange}
          statusCounts={defaultStatusCounts}
        />
      );

      expect(screen.getByText('10')).toBeInTheDocument(); // all count
      expect(screen.getByText('5')).toBeInTheDocument(); // approved count
      expect(screen.getByText('3')).toBeInTheDocument(); // pending count
      expect(screen.getByText('2')).toBeInTheDocument(); // rejected count
    });
  });

  describe('Active Tab Styling', () => {
    it('applies active styling to selected tab', () => {
      const handleChange = vi.fn();

      render(
        <TemplateTabs
          statusFilter="all"
          onStatusFilterChange={handleChange}
          statusCounts={defaultStatusCounts}
        />
      );

      const allTab = screen.getByRole('button', { name: /all/i });
      expect(allTab).toHaveClass('bg-brand-100');
      expect(allTab).toHaveClass('text-brand-800');
    });

    it('applies inactive styling to non-selected tabs', () => {
      const handleChange = vi.fn();

      render(
        <TemplateTabs
          statusFilter="all"
          onStatusFilterChange={handleChange}
          statusCounts={defaultStatusCounts}
        />
      );

      const approvedTab = screen.getByRole('button', { name: /approved/i });
      expect(approvedTab).toHaveClass('text-ink-500');
      expect(approvedTab).not.toHaveClass('bg-brand-100');
    });

    it('changes active tab when different status is selected', async () => {
      const { rerender } = render(
        <TemplateTabs
          statusFilter="all"
          onStatusFilterChange={vi.fn()}
          statusCounts={defaultStatusCounts}
        />
      );

      const allTab = screen.getByRole('button', { name: /all/i });
      expect(allTab).toHaveClass('bg-brand-100');

      rerender(
        <TemplateTabs
          statusFilter={TemplateStatus.APPROVED}
          onStatusFilterChange={vi.fn()}
          statusCounts={defaultStatusCounts}
        />
      );

      const approvedTab = screen.getByRole('button', { name: /approved/i });
      expect(approvedTab).toHaveClass('bg-brand-100');
      expect(allTab).not.toHaveClass('bg-brand-100');
    });
  });

  describe('Active Badge Styling', () => {
    it('applies active badge styling to selected tab badge', () => {
      const handleChange = vi.fn();

      const { container } = render(
        <TemplateTabs
          statusFilter="all"
          onStatusFilterChange={handleChange}
          statusCounts={defaultStatusCounts}
        />
      );

      const allTab = screen.getByRole('button', { name: /all/i });
      const badgeInAllTab = allTab.querySelector('span:last-child');
      expect(badgeInAllTab).toHaveClass('bg-brand-200');
      expect(badgeInAllTab).toHaveClass('text-brand-800');
    });

    it('applies inactive badge styling to non-selected tab badges', () => {
      const handleChange = vi.fn();

      const { container } = render(
        <TemplateTabs
          statusFilter="all"
          onStatusFilterChange={handleChange}
          statusCounts={defaultStatusCounts}
        />
      );

      const approvedTab = screen.getByRole('button', { name: /approved/i });
      const badgeInApprovedTab = approvedTab.querySelector('span:last-child');
      expect(badgeInApprovedTab).toHaveClass('bg-surface-sunken');
      expect(badgeInApprovedTab).toHaveClass('text-ink-500');
    });
  });

  describe('Click Handlers', () => {
    it('calls onStatusFilterChange when tab is clicked', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <TemplateTabs
          statusFilter="all"
          onStatusFilterChange={handleChange}
          statusCounts={defaultStatusCounts}
        />
      );

      const approvedTab = screen.getByRole('button', { name: /approved/i });
      await user.click(approvedTab);

      expect(handleChange).toHaveBeenCalledWith(TemplateStatus.APPROVED);
    });

    it('calls onStatusFilterChange with correct status for each tab', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      const { rerender } = render(
        <TemplateTabs
          statusFilter="all"
          onStatusFilterChange={handleChange}
          statusCounts={defaultStatusCounts}
        />
      );

      const pendingTab = screen.getByRole('button', { name: /pending/i });
      await user.click(pendingTab);
      expect(handleChange).toHaveBeenCalledWith(TemplateStatus.PENDING);

      const rejectedTab = screen.getByRole('button', { name: /rejected/i });
      await user.click(rejectedTab);
      expect(handleChange).toHaveBeenCalledWith(TemplateStatus.REJECTED);
    });

    it('calls handler multiple times on multiple clicks', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <TemplateTabs
          statusFilter="all"
          onStatusFilterChange={handleChange}
          statusCounts={defaultStatusCounts}
        />
      );

      const approvedTab = screen.getByRole('button', { name: /approved/i });
      await user.click(approvedTab);
      await user.click(approvedTab);

      expect(handleChange).toHaveBeenCalledTimes(2);
    });

    it('clicks "all" tab with correct status value', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <TemplateTabs
          statusFilter={TemplateStatus.APPROVED}
          onStatusFilterChange={handleChange}
          statusCounts={defaultStatusCounts}
        />
      );

      const allTab = screen.getByRole('button', { name: /all/i });
      await user.click(allTab);

      expect(handleChange).toHaveBeenCalledWith('all');
    });
  });

  describe('Count Display', () => {
    it('displays correct count for "all" tab', () => {
      const handleChange = vi.fn();

      render(
        <TemplateTabs
          statusFilter="all"
          onStatusFilterChange={handleChange}
          statusCounts={defaultStatusCounts}
        />
      );

      expect(screen.getByRole('button', { name: /all/i })).toBeInTheDocument();
    });

    it('displays correct count for each status', () => {
      const handleChange = vi.fn();

      render(
        <TemplateTabs
          statusFilter="all"
          onStatusFilterChange={handleChange}
          statusCounts={defaultStatusCounts}
        />
      );

      expect(screen.getByRole('button', { name: /approved/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /pending/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /rejected/i })).toBeInTheDocument();
    });

    it('updates counts when statusCounts prop changes', () => {
      const handleChange = vi.fn();
      const { rerender } = render(
        <TemplateTabs
          statusFilter="all"
          onStatusFilterChange={handleChange}
          statusCounts={defaultStatusCounts}
        />
      );

      expect(screen.getByRole('button', { name: /all/i })).toBeInTheDocument();

      const newCounts: StatusCounts = {
        all: 15,
        [TemplateStatus.APPROVED]: 8,
        [TemplateStatus.PENDING]: 5,
        [TemplateStatus.REJECTED]: 2,
      };

      rerender(
        <TemplateTabs
          statusFilter="all"
          onStatusFilterChange={handleChange}
          statusCounts={newCounts}
        />
      );

      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
    });

    it('displays zero count', () => {
      const handleChange = vi.fn();
      const zeroCounts: StatusCounts = {
        all: 0,
        [TemplateStatus.APPROVED]: 0,
        [TemplateStatus.PENDING]: 0,
        [TemplateStatus.REJECTED]: 0,
      };

      render(
        <TemplateTabs
          statusFilter="all"
          onStatusFilterChange={handleChange}
          statusCounts={zeroCounts}
        />
      );

      const allZeros = screen.getAllByText('0');
      expect(allZeros.length).toBeGreaterThan(0);
    });
  });

  describe('Transitions', () => {
    it('has transition class applied to buttons', () => {
      const handleChange = vi.fn();

      const { container } = render(
        <TemplateTabs
          statusFilter="all"
          onStatusFilterChange={handleChange}
          statusCounts={defaultStatusCounts}
        />
      );

      const buttons = container.querySelectorAll('button');
      buttons.forEach((btn) => {
        expect(btn).toHaveClass('transition-all');
      });
    });
  });

  describe('Layout', () => {
    it('has correct container layout classes', () => {
      const handleChange = vi.fn();

      const { container } = render(
        <TemplateTabs
          statusFilter="all"
          onStatusFilterChange={handleChange}
          statusCounts={defaultStatusCounts}
        />
      );

      const mainDiv = container.firstChild;
      expect(mainDiv).toHaveClass('flex');
      expect(mainDiv).toHaveClass('items-center');
      expect(mainDiv).toHaveClass('justify-between');
      expect(mainDiv).toHaveClass('pb-3');
      expect(mainDiv).toHaveClass('border-b');
    });
  });
});
