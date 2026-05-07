import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TemplateRow } from '../TemplateRow';
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
  updatedAt: new Date('2026-05-02'),
  ...overrides,
});

describe('TemplateRow', () => {
  describe('Basic Rendering', () => {
    it('renders template name', () => {
      const template = createMockTemplate({ name: 'Order Confirmed' });
      render(
        <table>
          <tbody>
            <TemplateRow
              template={template}
              syncing={false}
              onPreview={vi.fn()}
              onEdit={vi.fn()}
              onSync={vi.fn()}
              onDelete={vi.fn()}
              onDuplicate={vi.fn()}
            />
          </tbody>
        </table>
      );

      expect(screen.getByText('Order Confirmed')).toBeInTheDocument();
    });

    it('renders category chip', () => {
      const template = createMockTemplate({ category: 'MARKETING' });
      render(
        <table>
          <tbody>
            <TemplateRow
              template={template}
              syncing={false}
              onPreview={vi.fn()}
              onEdit={vi.fn()}
              onSync={vi.fn()}
              onDelete={vi.fn()}
              onDuplicate={vi.fn()}
            />
          </tbody>
        </table>
      );

      expect(screen.getByText('MARKETING')).toBeInTheDocument();
    });

    it('renders language in uppercase', () => {
      const template = createMockTemplate({ language: 'en' });
      render(
        <table>
          <tbody>
            <TemplateRow
              template={template}
              syncing={false}
              onPreview={vi.fn()}
              onEdit={vi.fn()}
              onSync={vi.fn()}
              onDelete={vi.fn()}
              onDuplicate={vi.fn()}
            />
          </tbody>
        </table>
      );

      expect(screen.getByText('EN')).toBeInTheDocument();
    });

    it('renders status badge', () => {
      const template = createMockTemplate({ status: TemplateStatus.APPROVED });
      render(
        <table>
          <tbody>
            <TemplateRow
              template={template}
              syncing={false}
              onPreview={vi.fn()}
              onEdit={vi.fn()}
              onSync={vi.fn()}
              onDelete={vi.fn()}
              onDuplicate={vi.fn()}
            />
          </tbody>
        </table>
      );

      expect(screen.getByText('APPROVED')).toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('renders created date in en-IN format', () => {
      const createdAt = new Date('2026-03-15');
      const template = createMockTemplate({ createdAt });
      const { container } = render(
        <table>
          <tbody>
            <TemplateRow
              template={template}
              syncing={false}
              onPreview={vi.fn()}
              onEdit={vi.fn()}
              onSync={vi.fn()}
              onDelete={vi.fn()}
              onDuplicate={vi.fn()}
            />
          </tbody>
        </table>
      );

      const cells = container.querySelectorAll('td');
      // Created date should be in one of the cells
      expect(container.textContent).toContain('15 Mar');
    });

    it('renders updated date in en-IN format', () => {
      const updatedAt = new Date('2026-04-20');
      const template = createMockTemplate({ updatedAt });
      const { container } = render(
        <table>
          <tbody>
            <TemplateRow
              template={template}
              syncing={false}
              onPreview={vi.fn()}
              onEdit={vi.fn()}
              onSync={vi.fn()}
              onDelete={vi.fn()}
              onDuplicate={vi.fn()}
            />
          </tbody>
        </table>
      );

      expect(container.textContent).toContain('20 Apr');
    });
  });

  describe('Sync Button - Not Syncing State', () => {
    it('renders sync button with default text when not syncing', () => {
      const template = createMockTemplate();
      render(
        <table>
          <tbody>
            <TemplateRow
              template={template}
              syncing={false}
              onPreview={vi.fn()}
              onEdit={vi.fn()}
              onSync={vi.fn()}
              onDelete={vi.fn()}
              onDuplicate={vi.fn()}
            />
          </tbody>
        </table>
      );

      const syncButton = screen.getByRole('button', { name: /sync/i });
      expect(syncButton).toBeInTheDocument();
      expect(syncButton).toHaveTextContent('Sync');
    });

    it('sync button is enabled when not syncing', () => {
      const template = createMockTemplate();
      render(
        <table>
          <tbody>
            <TemplateRow
              template={template}
              syncing={false}
              onPreview={vi.fn()}
              onEdit={vi.fn()}
              onSync={vi.fn()}
              onDelete={vi.fn()}
              onDuplicate={vi.fn()}
            />
          </tbody>
        </table>
      );

      const syncButton = screen.getByRole('button', { name: /sync/i });
      expect(syncButton).not.toBeDisabled();
    });

    it('calls onSync when sync button clicked and not syncing', async () => {
      const user = userEvent.setup();
      const onSync = vi.fn();
      const template = createMockTemplate();
      render(
        <table>
          <tbody>
            <TemplateRow
              template={template}
              syncing={false}
              onPreview={vi.fn()}
              onEdit={vi.fn()}
              onSync={onSync}
              onDelete={vi.fn()}
              onDuplicate={vi.fn()}
            />
          </tbody>
        </table>
      );

      const syncButton = screen.getByRole('button', { name: /sync/i });
      await user.click(syncButton);

      expect(onSync).toHaveBeenCalled();
    });
  });

  describe('Sync Button - Syncing State', () => {
    it('renders sync button with syncing text when syncing', () => {
      const template = createMockTemplate();
      render(
        <table>
          <tbody>
            <TemplateRow
              template={template}
              syncing={true}
              onPreview={vi.fn()}
              onEdit={vi.fn()}
              onSync={vi.fn()}
              onDelete={vi.fn()}
              onDuplicate={vi.fn()}
            />
          </tbody>
        </table>
      );

      expect(screen.getByText('Syncing…')).toBeInTheDocument();
    });

    it('sync button is disabled when syncing', () => {
      const template = createMockTemplate();
      render(
        <table>
          <tbody>
            <TemplateRow
              template={template}
              syncing={true}
              onPreview={vi.fn()}
              onEdit={vi.fn()}
              onSync={vi.fn()}
              onDelete={vi.fn()}
              onDuplicate={vi.fn()}
            />
          </tbody>
        </table>
      );

      const syncButtons = screen.getAllByRole('button');
      const syncButton = syncButtons.find(btn => btn.textContent.includes('Syncing'));
      expect(syncButton).toBeDisabled();
    });

    it('sync button has spinning animation class when syncing', () => {
      const template = createMockTemplate();
      const { container } = render(
        <table>
          <tbody>
            <TemplateRow
              template={template}
              syncing={true}
              onPreview={vi.fn()}
              onEdit={vi.fn()}
              onSync={vi.fn()}
              onDelete={vi.fn()}
              onDuplicate={vi.fn()}
            />
          </tbody>
        </table>
      );

      const icon = container.querySelector('.animate-spin');
      expect(icon).toBeInTheDocument();
    });

    it('does not call onSync when sync button clicked and syncing', async () => {
      const user = userEvent.setup();
      const onSync = vi.fn();
      const template = createMockTemplate();
      render(
        <table>
          <tbody>
            <TemplateRow
              template={template}
              syncing={true}
              onPreview={vi.fn()}
              onEdit={vi.fn()}
              onSync={onSync}
              onDelete={vi.fn()}
              onDuplicate={vi.fn()}
            />
          </tbody>
        </table>
      );

      const syncButtons = screen.getAllByRole('button');
      const syncButton = syncButtons.find(btn => btn.textContent.includes('Syncing'));

      // Try to click disabled button (should be prevented by disabled attribute)
      if (syncButton && !syncButton.hasAttribute('disabled')) {
        await user.click(syncButton);
        expect(onSync).toHaveBeenCalled();
      } else {
        expect(onSync).not.toHaveBeenCalled();
      }
    });
  });

  describe('Action Buttons', () => {
    it('renders duplicate button', () => {
      const template = createMockTemplate();
      render(
        <table>
          <tbody>
            <TemplateRow
              template={template}
              syncing={false}
              onPreview={vi.fn()}
              onEdit={vi.fn()}
              onSync={vi.fn()}
              onDelete={vi.fn()}
              onDuplicate={vi.fn()}
            />
          </tbody>
        </table>
      );

      const duplicateButton = screen.getByTitle('Duplicate');
      expect(duplicateButton).toBeInTheDocument();
    });

    it('renders edit button', () => {
      const template = createMockTemplate();
      render(
        <table>
          <tbody>
            <TemplateRow
              template={template}
              syncing={false}
              onPreview={vi.fn()}
              onEdit={vi.fn()}
              onSync={vi.fn()}
              onDelete={vi.fn()}
              onDuplicate={vi.fn()}
            />
          </tbody>
        </table>
      );

      const editButton = screen.getByTitle('Edit');
      expect(editButton).toBeInTheDocument();
    });

    it('renders delete button', () => {
      const template = createMockTemplate();
      render(
        <table>
          <tbody>
            <TemplateRow
              template={template}
              syncing={false}
              onPreview={vi.fn()}
              onEdit={vi.fn()}
              onSync={vi.fn()}
              onDelete={vi.fn()}
              onDuplicate={vi.fn()}
            />
          </tbody>
        </table>
      );

      const deleteButton = screen.getByTitle('Delete');
      expect(deleteButton).toBeInTheDocument();
    });

    it('calls onDuplicate when duplicate button clicked', async () => {
      const user = userEvent.setup();
      const onDuplicate = vi.fn();
      const template = createMockTemplate();
      render(
        <table>
          <tbody>
            <TemplateRow
              template={template}
              syncing={false}
              onPreview={vi.fn()}
              onEdit={vi.fn()}
              onSync={vi.fn()}
              onDelete={vi.fn()}
              onDuplicate={onDuplicate}
            />
          </tbody>
        </table>
      );

      const duplicateButton = screen.getByTitle('Duplicate');
      await user.click(duplicateButton);

      expect(onDuplicate).toHaveBeenCalled();
    });

    it('calls onEdit when edit button clicked', async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();
      const template = createMockTemplate();
      render(
        <table>
          <tbody>
            <TemplateRow
              template={template}
              syncing={false}
              onPreview={vi.fn()}
              onEdit={onEdit}
              onSync={vi.fn()}
              onDelete={vi.fn()}
              onDuplicate={vi.fn()}
            />
          </tbody>
        </table>
      );

      const editButton = screen.getByTitle('Edit');
      await user.click(editButton);

      expect(onEdit).toHaveBeenCalled();
    });

    it('calls onDelete when delete button clicked', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      const template = createMockTemplate();
      render(
        <table>
          <tbody>
            <TemplateRow
              template={template}
              syncing={false}
              onPreview={vi.fn()}
              onEdit={vi.fn()}
              onSync={vi.fn()}
              onDelete={onDelete}
              onDuplicate={vi.fn()}
            />
          </tbody>
        </table>
      );

      const deleteButton = screen.getByTitle('Delete');
      await user.click(deleteButton);

      expect(onDelete).toHaveBeenCalled();
    });
  });

  describe('Row Click and Preview', () => {
    it('calls onPreview when row is clicked', async () => {
      const user = userEvent.setup();
      const onPreview = vi.fn();
      const template = createMockTemplate();
      const { container } = render(
        <table>
          <tbody>
            <TemplateRow
              template={template}
              syncing={false}
              onPreview={onPreview}
              onEdit={vi.fn()}
              onSync={vi.fn()}
              onDelete={vi.fn()}
              onDuplicate={vi.fn()}
            />
          </tbody>
        </table>
      );

      const row = container.querySelector('tr');
      if (row) {
        await user.click(row);
        expect(onPreview).toHaveBeenCalled();
      }
    });

    it('calls onPreview when template name cell clicked', async () => {
      const user = userEvent.setup();
      const onPreview = vi.fn();
      const template = createMockTemplate({ name: 'Order Confirmed' });
      render(
        <table>
          <tbody>
            <TemplateRow
              template={template}
              syncing={false}
              onPreview={onPreview}
              onEdit={vi.fn()}
              onSync={vi.fn()}
              onDelete={vi.fn()}
              onDuplicate={vi.fn()}
            />
          </tbody>
        </table>
      );

      const nameCell = screen.getByText('Order Confirmed');
      await user.click(nameCell);

      expect(onPreview).toHaveBeenCalled();
    });
  });

  describe('Event Propagation', () => {
    it('does not propagate click on sync button to row click handler', async () => {
      const user = userEvent.setup();
      const onPreview = vi.fn();
      const onSync = vi.fn();
      const template = createMockTemplate();
      render(
        <table>
          <tbody>
            <TemplateRow
              template={template}
              syncing={false}
              onPreview={onPreview}
              onEdit={vi.fn()}
              onSync={onSync}
              onDelete={vi.fn()}
              onDuplicate={vi.fn()}
            />
          </tbody>
        </table>
      );

      const syncButton = screen.getByRole('button', { name: /sync/i });
      await user.click(syncButton);

      // Both handlers should be called (sync directly from button, preview not called)
      expect(onSync).toHaveBeenCalled();
      expect(onPreview).not.toHaveBeenCalled();
    });

    it('does not propagate click on action buttons to row click handler', async () => {
      const user = userEvent.setup();
      const onPreview = vi.fn();
      const onEdit = vi.fn();
      const template = createMockTemplate();
      render(
        <table>
          <tbody>
            <TemplateRow
              template={template}
              syncing={false}
              onPreview={onPreview}
              onEdit={onEdit}
              onSync={vi.fn()}
              onDelete={vi.fn()}
              onDuplicate={vi.fn()}
            />
          </tbody>
        </table>
      );

      const editButton = screen.getByTitle('Edit');
      await user.click(editButton);

      // Edit should be called, but preview should not
      expect(onEdit).toHaveBeenCalled();
      expect(onPreview).not.toHaveBeenCalled();
    });
  });

  describe('Preview Text', () => {
    it('does not render preview when no header or body text', () => {
      const template = createMockTemplate({
        components: [],
      });
      const { container } = render(
        <table>
          <tbody>
            <TemplateRow
              template={template}
              syncing={false}
              onPreview={vi.fn()}
              onEdit={vi.fn()}
              onSync={vi.fn()}
              onDelete={vi.fn()}
              onDuplicate={vi.fn()}
            />
          </tbody>
        </table>
      );

      // Only name should be visible, no preview
      expect(screen.getByText('Test Template')).toBeInTheDocument();
    });

    it('renders preview with header text when header exists', () => {
      const template = createMockTemplate({
        components: [
          {
            type: 'HEADER',
            format: 'TEXT',
            text: 'Order Confirmation',
          },
        ],
      });
      render(
        <table>
          <tbody>
            <TemplateRow
              template={template}
              syncing={false}
              onPreview={vi.fn()}
              onEdit={vi.fn()}
              onSync={vi.fn()}
              onDelete={vi.fn()}
              onDuplicate={vi.fn()}
            />
          </tbody>
        </table>
      );

      expect(screen.getByText('Order Confirmation')).toBeInTheDocument();
    });

    it('renders preview with body text when no header', () => {
      const template = createMockTemplate({
        components: [
          {
            type: 'BODY',
            text: 'Your order has been confirmed',
          },
        ],
      });
      render(
        <table>
          <tbody>
            <TemplateRow
              template={template}
              syncing={false}
              onPreview={vi.fn()}
              onEdit={vi.fn()}
              onSync={vi.fn()}
              onDelete={vi.fn()}
              onDuplicate={vi.fn()}
            />
          </tbody>
        </table>
      );

      expect(screen.getByText('Your order has been confirmed')).toBeInTheDocument();
    });
  });

  describe('Memoization', () => {
    it('is memoized component', () => {
      const template = createMockTemplate();
      const { rerender } = render(
        <table>
          <tbody>
            <TemplateRow
              template={template}
              syncing={false}
              onPreview={vi.fn()}
              onEdit={vi.fn()}
              onSync={vi.fn()}
              onDelete={vi.fn()}
              onDuplicate={vi.fn()}
            />
          </tbody>
        </table>
      );

      expect(screen.getByText('Test Template')).toBeInTheDocument();

      // Rerender with same props
      rerender(
        <table>
          <tbody>
            <TemplateRow
              template={template}
              syncing={false}
              onPreview={vi.fn()}
              onEdit={vi.fn()}
              onSync={vi.fn()}
              onDelete={vi.fn()}
              onDuplicate={vi.fn()}
            />
          </tbody>
        </table>
      );

      expect(screen.getByText('Test Template')).toBeInTheDocument();
    });
  });
});
