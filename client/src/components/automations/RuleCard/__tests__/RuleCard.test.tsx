import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RuleCard } from '@/components/automations/RuleCard';
import { makeAutomation } from '@/test/factories/automation.factory';

describe('RuleCard', () => {
  describe('automation name', () => {
    it('renders the automation name', () => {
      render(
        <RuleCard automation={makeAutomation({ name: 'Order Confirmed' })} onToggle={vi.fn()} onEdit={vi.fn()} />,
      );
      expect(screen.getByText('Order Confirmed')).toBeInTheDocument();
    });
  });

  describe('condition badges', () => {
    it('renders the IF badge label', () => {
      render(<RuleCard automation={makeAutomation()} onToggle={vi.fn()} onEdit={vi.fn()} />);
      expect(screen.getByText('IF')).toBeInTheDocument();
    });

    it('renders the WAIT badge label', () => {
      render(<RuleCard automation={makeAutomation()} onToggle={vi.fn()} onEdit={vi.fn()} />);
      expect(screen.getByText('WAIT')).toBeInTheDocument();
    });

    it('renders the SEND badge label', () => {
      render(<RuleCard automation={makeAutomation()} onToggle={vi.fn()} onEdit={vi.fn()} />);
      expect(screen.getByText('SEND')).toBeInTheDocument();
    });

    it('shows the trigger label inside the IF badge', () => {
      render(
        <RuleCard
          automation={makeAutomation({ shopifyEvent: 'PREPAID_ORDER_CONFIRMED' })}
          onToggle={vi.fn()}
          onEdit={vi.fn()}
        />,
      );
      expect(screen.getByText('Order placed')).toBeInTheDocument();
    });

    it('shows "Immediate" in the WAIT badge for 0 delay', () => {
      render(
        <RuleCard automation={makeAutomation({ delayMinutes: 0 })} onToggle={vi.fn()} onEdit={vi.fn()} />,
      );
      expect(screen.getByText('Immediate')).toBeInTheDocument();
    });

    it('shows the template name in the SEND badge', () => {
      render(
        <RuleCard
          automation={makeAutomation({ template: { id: 'temp-1', name: 'Shipping Update' } as never })}
          onToggle={vi.fn()}
          onEdit={vi.fn()}
        />,
      );
      expect(screen.getByText('Shipping Update')).toBeInTheDocument();
    });

    it('shows "(No template)" when template is null', () => {
      render(
        <RuleCard automation={makeAutomation({ template: null })} onToggle={vi.fn()} onEdit={vi.fn()} />,
      );
      expect(screen.getByText('(No template)')).toBeInTheDocument();
    });
  });

  describe('paused badge', () => {
    it('shows a Paused badge when automation is inactive', () => {
      render(
        <RuleCard automation={makeAutomation({ isActive: false })} onToggle={vi.fn()} onEdit={vi.fn()} />,
      );
      expect(screen.getByText('Paused')).toBeInTheDocument();
    });

    it('does not show Paused badge when automation is active', () => {
      render(
        <RuleCard automation={makeAutomation({ isActive: true })} onToggle={vi.fn()} onEdit={vi.fn()} />,
      );
      expect(screen.queryByText('Paused')).not.toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onEdit with the automation id when Edit is clicked', async () => {
      const onEdit = vi.fn();
      render(
        <RuleCard automation={makeAutomation({ id: 'auto-007' })} onToggle={vi.fn()} onEdit={onEdit} />,
      );
      await userEvent.click(screen.getByRole('button', { name: /edit/i }));
      expect(onEdit).toHaveBeenCalledWith('auto-007');
    });

    it('calls onToggle with the automation id when the toggle switch is clicked', async () => {
      const onToggle = vi.fn();
      render(
        <RuleCard automation={makeAutomation({ id: 'auto-007' })} onToggle={onToggle} onEdit={vi.fn()} />,
      );
      // The toggle is a button — find all buttons and click the first (the toggle)
      const buttons = screen.getAllByRole('button');
      const toggleButton = buttons.find((b) => !b.textContent?.includes('Edit'))!;
      await userEvent.click(toggleButton);
      expect(onToggle).toHaveBeenCalledWith('auto-007');
    });
  });
});
