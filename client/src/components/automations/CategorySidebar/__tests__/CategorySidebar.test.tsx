import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategorySidebar } from '@/components/automations/CategorySidebar';
import { makeAutomationCategory, makeAutomation } from '@/test/factories/automation.factory';

const categories = [
  makeAutomationCategory({
    categoryId: 'order-flow',
    categoryName: 'Order Flow',
    automations: [
      makeAutomation({ isActive: true }),
      makeAutomation({ id: 'auto-002', isActive: false }),
    ],
  }),
  makeAutomationCategory({
    categoryId: 'cod-flow',
    categoryName: 'COD Flow',
    automations: [makeAutomation({ id: 'auto-003', isActive: true })],
  }),
];

describe('CategorySidebar', () => {
  it('renders all category names as buttons', () => {
    render(
      <CategorySidebar
        categories={categories}
        selectedCategoryId={null}
        onSelectCategory={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /order flow/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cod flow/i })).toBeInTheDocument();
  });

  it('shows the active automation count badge for each category', () => {
    render(
      <CategorySidebar
        categories={categories}
        selectedCategoryId={null}
        onSelectCategory={vi.fn()}
      />,
    );
    // Order Flow has 1 active automation, COD Flow has 1 active automation
    const badges = screen.getAllByText('1');
    expect(badges).toHaveLength(2);
  });

  it('calls onSelectCategory with the category id when a button is clicked', async () => {
    const onSelectCategory = vi.fn();
    render(
      <CategorySidebar
        categories={categories}
        selectedCategoryId={null}
        onSelectCategory={onSelectCategory}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /cod flow/i }));
    expect(onSelectCategory).toHaveBeenCalledWith('cod-flow');
  });

  it('renders an empty sidebar when no categories are provided', () => {
    render(
      <CategorySidebar categories={[]} selectedCategoryId={null} onSelectCategory={vi.fn()} />,
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
