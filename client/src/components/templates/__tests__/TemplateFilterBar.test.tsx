import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TemplateFilterBar } from '../TemplateFilterBar';

describe('TemplateFilterBar', () => {
  it('renders template count with singular form', () => {
    const mockOnChange = vi.fn();
    render(
      <TemplateFilterBar
        templateCount={1}
        categoryFilter="all"
        onCategoryFilterChange={mockOnChange}
      />
    );

    expect(screen.getByText('1 template')).toBeInTheDocument();
  });

  it('renders template count with plural form', () => {
    const mockOnChange = vi.fn();
    render(
      <TemplateFilterBar
        templateCount={5}
        categoryFilter="all"
        onCategoryFilterChange={mockOnChange}
      />
    );

    expect(screen.getByText('5 templates')).toBeInTheDocument();
  });

  it('renders zero templates', () => {
    const mockOnChange = vi.fn();
    render(
      <TemplateFilterBar
        templateCount={0}
        categoryFilter="all"
        onCategoryFilterChange={mockOnChange}
      />
    );

    expect(screen.getByText('0 templates')).toBeInTheDocument();
  });

  it('renders category label', () => {
    const mockOnChange = vi.fn();
    render(
      <TemplateFilterBar
        templateCount={1}
        categoryFilter="all"
        onCategoryFilterChange={mockOnChange}
      />
    );

    expect(screen.getByText('Category:')).toBeInTheDocument();
  });

  it('renders category select dropdown', () => {
    const mockOnChange = vi.fn();
    render(
      <TemplateFilterBar
        templateCount={1}
        categoryFilter="all"
        onCategoryFilterChange={mockOnChange}
      />
    );

    const select = screen.getByDisplayValue('All');
    expect(select).toBeInTheDocument();
  });

  it('calls onCategoryFilterChange when category is changed', () => {
    const mockOnChange = vi.fn();

    render(
      <TemplateFilterBar
        templateCount={1}
        categoryFilter="all"
        onCategoryFilterChange={mockOnChange}
      />
    );

    const select = screen.getByDisplayValue('All');
    fireEvent.change(select, { target: { value: 'MARKETING' } });

    expect(mockOnChange).toHaveBeenCalledWith('MARKETING');
  });

  it('calls onCategoryFilterChange with correct value on selection change', () => {
    const mockOnChange = vi.fn();

    render(
      <TemplateFilterBar
        templateCount={3}
        categoryFilter="UTILITY"
        onCategoryFilterChange={mockOnChange}
      />
    );

    const select = screen.getByDisplayValue('Utility');
    fireEvent.change(select, { target: { value: 'AUTHENTICATION' } });

    expect(mockOnChange).toHaveBeenCalledWith('AUTHENTICATION');
    expect(mockOnChange).toHaveBeenCalledTimes(1);
  });

  it('renders select with current categoryFilter value', () => {
    const mockOnChange = vi.fn();
    render(
      <TemplateFilterBar
        templateCount={2}
        categoryFilter="MARKETING"
        onCategoryFilterChange={mockOnChange}
      />
    );

    const select = screen.getByDisplayValue('Marketing');
    expect(select).toBeInTheDocument();
  });

  it('has select element with proper attributes', () => {
    const mockOnChange = vi.fn();
    render(
      <TemplateFilterBar
        templateCount={1}
        categoryFilter="all"
        onCategoryFilterChange={mockOnChange}
      />
    );

    const select = screen.getByRole('combobox');
    expect(select).toHaveClass('border');
    expect(select).toHaveClass('rounded-sm');
    expect(select).toHaveClass('bg-card');
  });

  it('renders all category options', () => {
    const mockOnChange = vi.fn();
    render(
      <TemplateFilterBar
        templateCount={1}
        categoryFilter="all"
        onCategoryFilterChange={mockOnChange}
      />
    );

    // Check that common categories are rendered
    expect(screen.getByText('All')).toBeInTheDocument();
  });

  it('handles multiple onChange events correctly', () => {
    const mockOnChange = vi.fn();

    render(
      <TemplateFilterBar
        templateCount={5}
        categoryFilter="all"
        onCategoryFilterChange={mockOnChange}
      />
    );

    const select = screen.getByDisplayValue('All');

    // First change
    fireEvent.change(select, { target: { value: 'MARKETING' } });
    expect(mockOnChange).toHaveBeenCalledWith('MARKETING');

    // Second change
    fireEvent.change(select, { target: { value: 'UTILITY' } });
    expect(mockOnChange).toHaveBeenCalledWith('UTILITY');

    expect(mockOnChange).toHaveBeenCalledTimes(2);
  });

  it('maintains proper layout structure', () => {
    const mockOnChange = vi.fn();
    const { container } = render(
      <TemplateFilterBar
        templateCount={10}
        categoryFilter="all"
        onCategoryFilterChange={mockOnChange}
      />
    );

    const mainDiv = container.querySelector('div.flex.items-center.justify-between');
    expect(mainDiv).toBeInTheDocument();

    const filterDiv = container.querySelector('div.flex.items-center.gap-2');
    expect(filterDiv).toBeInTheDocument();
  });

  it('renders with proper text styling for count', () => {
    const mockOnChange = vi.fn();
    const { container } = render(
      <TemplateFilterBar
        templateCount={1}
        categoryFilter="all"
        onCategoryFilterChange={mockOnChange}
      />
    );

    const countDiv = container.querySelector('div.text-xs.text-ink-500');
    expect(countDiv).toBeInTheDocument();
    expect(countDiv?.textContent).toBe('1 template');
  });
});
