import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { useAutomationsPage } from '@/hooks/useAutomationsPage';
import { createTestStore } from '@/test/test-utils';
import { makeAutomation, makeAutomationCategory } from '@/test/factories/automation.factory';
import { resetMockAutomations } from '@/test/mocks/automations.handlers';

beforeEach(() => {
  resetMockAutomations();
});

const renderHookWithStore = (store = createTestStore()) =>
  renderHook(() => useAutomationsPage(), {
    wrapper: ({ children }) => (
      <Provider store={store}>
        <MemoryRouter>{children}</MemoryRouter>
      </Provider>
    ),
  });

describe('useAutomationsPage', () => {
  describe('initial state', () => {
    it('returns loading=true before data arrives', () => {
      const { result } = renderHookWithStore();
      expect(result.current.loading).toBe(true);
    });

    it('returns empty categories initially', () => {
      const { result } = renderHookWithStore();
      expect(result.current.categories).toEqual([]);
    });

    it('selectedCategoryId is null before any data or selection', () => {
      const { result } = renderHookWithStore();
      expect(result.current.selectedCategoryId).toBeNull();
    });
  });

  describe('after data loads', () => {
    it('loading becomes false once categories arrive', async () => {
      const { result } = renderHookWithStore();
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.categories.length).toBeGreaterThan(0);
    });

    it('selectedCategory defaults to the first category', async () => {
      const { result } = renderHookWithStore();
      await waitFor(() => expect(result.current.loading).toBe(false));
      // Default handler returns Order Flow as the first category
      expect(result.current.selectedCategory?.categoryId).toBe('order-flow');
    });

    it('computes activeCount and pausedCount from selectedCategory automations', async () => {
      const store = createTestStore({
        automations: {
          categories: [
            makeAutomationCategory({
              automations: [
                makeAutomation({ id: 'a1', isActive: true }),
                makeAutomation({ id: 'a2', isActive: true }),
                makeAutomation({ id: 'a3', isActive: false }),
              ],
            }),
          ],
          approvedTemplates: [],
          status: 'succeeded',
          approvedTemplatesStatus: 'idle',
          error: null,
        },
      });
      const { result } = renderHookWithStore(store);
      expect(result.current.activeCount).toBe(2);
      expect(result.current.pausedCount).toBe(1);
    });
  });

  describe('handleCategorySelect', () => {
    it('updates selectedCategoryId', async () => {
      const { result } = renderHookWithStore();
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => {
        result.current.handleCategorySelect('cod-flow');
      });

      expect(result.current.selectedCategoryId).toBe('cod-flow');
    });

    it('switches selectedCategory to the newly selected one', async () => {
      const { result } = renderHookWithStore();
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => {
        result.current.handleCategorySelect('cod-flow');
      });

      expect(result.current.selectedCategory?.categoryId).toBe('cod-flow');
    });
  });

  describe('handleToggle', () => {
    it('applies optimistic isActive flip in the store immediately', async () => {
      const store = createTestStore({
        automations: {
          categories: [
            makeAutomationCategory({
              automations: [makeAutomation({ id: 'auto-001', isActive: true })],
            }),
          ],
          approvedTemplates: [],
          status: 'succeeded',
          approvedTemplatesStatus: 'idle',
          error: null,
        },
      });
      const { result } = renderHookWithStore(store);

      act(() => {
        result.current.handleToggle('auto-001');
      });

      // Optimistic flip should be reflected synchronously
      const auto = store.getState().automations.categories[0].automations[0];
      expect(auto.isActive).toBe(false);
    });
  });

  describe('return interface stability', () => {
    it('handler references are stable across re-renders', async () => {
      const { result, rerender } = renderHookWithStore();

      const { handleCategorySelect, handleToggle, handleEdit } = result.current;
      rerender();

      expect(result.current.handleCategorySelect).toBe(handleCategorySelect);
      expect(result.current.handleToggle).toBe(handleToggle);
      expect(result.current.handleEdit).toBe(handleEdit);
    });
  });
});
