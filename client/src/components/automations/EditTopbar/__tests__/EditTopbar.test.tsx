import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditTopbar } from '@/components/automations/EditTopbar';

const defaultProps = {
  automationName: 'Order Confirmed',
  saving: false,
  onCancel: vi.fn(),
  onSave: vi.fn(),
};

describe('EditTopbar', () => {
  it('renders the automation name', () => {
    render(<EditTopbar {...defaultProps} />);
    expect(screen.getByText('Order Confirmed')).toBeInTheDocument();
  });

  it('renders "Edit Automation" heading', () => {
    render(<EditTopbar {...defaultProps} />);
    expect(screen.getByText('Edit Automation')).toBeInTheDocument();
  });

  it('renders a Cancel button', () => {
    render(<EditTopbar {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('renders a Save changes button when not saving', () => {
    render(<EditTopbar {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
  });

  it('shows "Saving…" text and disables the save button when saving=true', () => {
    render(<EditTopbar {...defaultProps} saving />);
    const saveBtn = screen.getByRole('button', { name: /saving/i });
    expect(saveBtn).toBeDisabled();
  });

  it('calls onCancel when Cancel is clicked', async () => {
    const onCancel = vi.fn();
    render(<EditTopbar {...defaultProps} onCancel={onCancel} />);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('calls onSave when Save changes is clicked', async () => {
    const onSave = vi.fn();
    render(<EditTopbar {...defaultProps} onSave={onSave} />);
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(onSave).toHaveBeenCalledOnce();
  });

  it('does not call onSave when the button is disabled (saving=true)', async () => {
    const onSave = vi.fn();
    render(<EditTopbar {...defaultProps} saving onSave={onSave} />);
    await userEvent.click(screen.getByRole('button', { name: /saving/i }));
    expect(onSave).not.toHaveBeenCalled();
  });
});
