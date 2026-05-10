import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MappingRow } from '@/components/automations/MappingRow';

describe('MappingRow', () => {
  it('renders the variable label', () => {
    render(
      <MappingRow label="{{1}}" path="" isAbandonedCart={false} onChange={vi.fn()} />,
    );
    expect(screen.getByText('{{1}}')).toBeInTheDocument();
  });

  it('renders a select (combobox) for the field mapping', () => {
    render(
      <MappingRow label="{{1}}" path="" isAbandonedCart={false} onChange={vi.fn()} />,
    );
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('shows the current path as the selected value', () => {
    render(
      <MappingRow label="{{1}}" path="name" isAbandonedCart={false} onChange={vi.fn()} />,
    );
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('name');
  });

  it('calls onChange with the newly selected path', async () => {
    const onChange = vi.fn();
    render(
      <MappingRow label="{{1}}" path="" isAbandonedCart={false} onChange={onChange} />,
    );
    await userEvent.selectOptions(screen.getByRole('combobox'), 'name');
    expect(onChange).toHaveBeenCalledWith('name');
  });

  it('shows a custom option when the current path is not in the standard list', () => {
    render(
      <MappingRow label="{{1}}" path="custom.field.path" isAbandonedCart={false} onChange={vi.fn()} />,
    );
    expect(screen.getByRole('option', { name: 'custom.field.path' })).toBeInTheDocument();
  });
});
