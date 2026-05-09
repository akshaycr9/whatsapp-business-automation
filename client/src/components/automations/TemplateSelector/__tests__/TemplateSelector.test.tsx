import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TemplateSelector } from '@/components/automations/TemplateSelector';
import { templateFactory } from '@/test/factories/template.factory';

describe('TemplateSelector', () => {
  it('shows an empty-state message when there are no templates', () => {
    render(<TemplateSelector value="" templates={[]} onChange={vi.fn()} />);
    expect(screen.getByText(/no approved templates available/i)).toBeInTheDocument();
  });

  it('does not render a select element when there are no templates', () => {
    render(<TemplateSelector value="" templates={[]} onChange={vi.fn()} />);
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('renders a select when templates are provided', () => {
    const templates = [templateFactory.createApproved({ id: 'temp-1', name: 'Shipping Update' })];
    render(<TemplateSelector value="" templates={templates} onChange={vi.fn()} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders each template as an option', () => {
    const templates = [
      templateFactory.createApproved({ id: 'temp-1', name: 'Shipping Update' }),
      templateFactory.createApproved({ id: 'temp-2', name: 'Order Cancelled' }),
    ];
    render(<TemplateSelector value="" templates={templates} onChange={vi.fn()} />);
    expect(screen.getByRole('option', { name: 'Shipping Update' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Order Cancelled' })).toBeInTheDocument();
  });

  it('calls onChange with the selected template id', async () => {
    const onChange = vi.fn();
    const templates = [templateFactory.createApproved({ id: 'temp-1', name: 'My Template' })];
    render(<TemplateSelector value="" templates={templates} onChange={onChange} />);

    await userEvent.selectOptions(screen.getByRole('combobox'), 'temp-1');
    expect(onChange).toHaveBeenCalledWith('temp-1');
  });

  it('shows the placeholder option by default when value is empty', () => {
    const templates = [templateFactory.createApproved({ id: 'temp-1', name: 'My Template' })];
    render(<TemplateSelector value="" templates={templates} onChange={vi.fn()} />);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('');
  });
});
