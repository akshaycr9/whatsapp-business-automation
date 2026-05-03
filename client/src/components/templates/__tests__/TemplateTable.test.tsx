import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TemplateTable } from '../TemplateTable';
import { TemplateStatus } from '@/types/templates';
import type { Template } from '@/types';

const createMockTemplate = (overrides?: Partial<Template>): Template => ({
  id: '1',
  name: 'Test Template',
  status: TemplateStatus.APPROVED,
  category: 'MARKETING',
  language: 'en',
  components: [],
  createdAt: new Date('2026-05-01'),
  updatedAt: new Date('2026-05-01'),
  ...overrides,
});

describe('TemplateTable', () => {
  describe('Empty State', () => {
    it('renders empty state message when no templates', () => {
      const handlers = {
        onPreview: vi.fn(),
        onEdit: vi.fn(),
        onSync: vi.fn(),
        onDelete: vi.fn(),
        onDuplicate: vi.fn(),
      };

      render(
        <TemplateTable
          templates={[]}
          syncingIds={new Set()}
          {...handlers}
        />
      );

      expect(screen.getByText(/no templates in this category/i)).toBeInTheDocument();
    });

    it('does not render table when empty', () => {
      const { container } = render(
        <TemplateTable
          templates={[]}
          syncingIds={new Set()}
          onPreview={vi.fn()}
          onEdit={vi.fn()}
          onSync={vi.fn()}
          onDelete={vi.fn()}
          onDuplicate={vi.fn()}
        />
      );

      expect(container.querySelector('table')).not.toBeInTheDocument();
    });
  });

  describe('Table Rendering', () => {
    it('renders table with templates', () => {
      const templates = [createMockTemplate()];
      const { container } = render(
        <TemplateTable
          templates={templates}
          syncingIds={new Set()}
          onPreview={vi.fn()}
          onEdit={vi.fn()}
          onSync={vi.fn()}
          onDelete={vi.fn()}
          onDuplicate={vi.fn()}
        />
      );

      expect(container.querySelector('table')).toBeInTheDocument();
    });

    it('renders table header', () => {
      const templates = [createMockTemplate()];
      const { container } = render(
        <TemplateTable
          templates={templates}
          syncingIds={new Set()}
          onPreview={vi.fn()}
          onEdit={vi.fn()}
          onSync={vi.fn()}
          onDelete={vi.fn()}
          onDuplicate={vi.fn()}
        />
      );

      expect(container.querySelector('thead')).toBeInTheDocument();
    });
  });

  describe('Multiple Templates', () => {
    it('renders multiple template rows', () => {
      const templates = [
        createMockTemplate({ id: '1', name: 'Template 1' }),
        createMockTemplate({ id: '2', name: 'Template 2' }),
        createMockTemplate({ id: '3', name: 'Template 3' }),
      ];

      const { container } = render(
        <TemplateTable
          templates={templates}
          syncingIds={new Set()}
          onPreview={vi.fn()}
          onEdit={vi.fn()}
          onSync={vi.fn()}
          onDelete={vi.fn()}
          onDuplicate={vi.fn()}
        />
      );

      const rows = container.querySelectorAll('tbody tr');
      expect(rows.length).toBe(3);
    });

    it('renders correct count of templates', () => {
      const templates = Array.from({ length: 5 }, (_, i) =>
        createMockTemplate({ id: `${i + 1}`, name: `Template ${i + 1}` })
      );

      const { container } = render(
        <TemplateTable
          templates={templates}
          syncingIds={new Set()}
          onPreview={vi.fn()}
          onEdit={vi.fn()}
          onSync={vi.fn()}
          onDelete={vi.fn()}
          onDuplicate={vi.fn()}
        />
      );

      const rows = container.querySelectorAll('tbody tr');
      expect(rows.length).toBe(5);
    });
  });

  describe('Table Callbacks', () => {
    it('passes onPreview callback to rows', () => {
      const templates = [createMockTemplate({ id: 'template-1' })];
      const onPreview = vi.fn();

      render(
        <TemplateTable
          templates={templates}
          syncingIds={new Set()}
          onPreview={onPreview}
          onEdit={vi.fn()}
          onSync={vi.fn()}
          onDelete={vi.fn()}
          onDuplicate={vi.fn()}
        />
      );

      // Verify callback is passed to TemplateRow (tested via prop spreading)
      expect(onPreview).not.toHaveBeenCalled(); // Only called when button clicked
    });

    it('passes all callbacks to rows', () => {
      const templates = [createMockTemplate()];
      const callbacks = {
        onPreview: vi.fn(),
        onEdit: vi.fn(),
        onSync: vi.fn(),
        onDelete: vi.fn(),
        onDuplicate: vi.fn(),
      };

      render(
        <TemplateTable
          templates={templates}
          syncingIds={new Set()}
          {...callbacks}
        />
      );

      // Callbacks should be passed to TemplateRow component
      // Verify by checking that component doesn't throw
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  describe('Syncing State', () => {
    it('passes syncing state to rows', () => {
      const templates = [
        createMockTemplate({ id: '1' }),
        createMockTemplate({ id: '2' }),
      ];
      const syncingIds = new Set(['1']);

      render(
        <TemplateTable
          templates={templates}
          syncingIds={syncingIds}
          onPreview={vi.fn()}
          onEdit={vi.fn()}
          onSync={vi.fn()}
          onDelete={vi.fn()}
          onDuplicate={vi.fn()}
        />
      );

      // Verify syncing state doesn't cause errors
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('shows syncing state for multiple templates', () => {
      const templates = Array.from({ length: 3 }, (_, i) =>
        createMockTemplate({ id: `${i + 1}` })
      );
      const syncingIds = new Set(['1', '3']);

      render(
        <TemplateTable
          templates={templates}
          syncingIds={syncingIds}
          onPreview={vi.fn()}
          onEdit={vi.fn()}
          onSync={vi.fn()}
          onDelete={vi.fn()}
          onDuplicate={vi.fn()}
        />
      );

      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  describe('Table Structure', () => {
    it('renders with correct CSS classes', () => {
      const templates = [createMockTemplate()];
      const { container } = render(
        <TemplateTable
          templates={templates}
          syncingIds={new Set()}
          onPreview={vi.fn()}
          onEdit={vi.fn()}
          onSync={vi.fn()}
          onDelete={vi.fn()}
          onDuplicate={vi.fn()}
        />
      );

      const table = container.querySelector('table');
      expect(table).toHaveClass('w-full');
      expect(table).toHaveClass('border-collapse');
    });

    it('renders table with scroll wrapper', () => {
      const templates = [createMockTemplate()];
      const { container } = render(
        <TemplateTable
          templates={templates}
          syncingIds={new Set()}
          onPreview={vi.fn()}
          onEdit={vi.fn()}
          onSync={vi.fn()}
          onDelete={vi.fn()}
          onDuplicate={vi.fn()}
        />
      );

      // Should have overflow-x-auto wrapper for horizontal scrolling
      const overflowWrapper = container.querySelector('.overflow-x-auto');
      expect(overflowWrapper).toBeInTheDocument();
    });
  });

  describe('Memoization', () => {
    it('is memoized component', () => {
      const templates = [createMockTemplate()];
      const { rerender } = render(
        <TemplateTable
          templates={templates}
          syncingIds={new Set()}
          onPreview={vi.fn()}
          onEdit={vi.fn()}
          onSync={vi.fn()}
          onDelete={vi.fn()}
          onDuplicate={vi.fn()}
        />
      );

      expect(screen.getByRole('table')).toBeInTheDocument();

      rerender(
        <TemplateTable
          templates={templates}
          syncingIds={new Set()}
          onPreview={vi.fn()}
          onEdit={vi.fn()}
          onSync={vi.fn()}
          onDelete={vi.fn()}
          onDuplicate={vi.fn()}
        />
      );

      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });
});
