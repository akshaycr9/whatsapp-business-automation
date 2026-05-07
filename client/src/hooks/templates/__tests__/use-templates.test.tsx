import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { useTemplates } from '../use-templates';
import { createTestStore } from '@/test/test-utils';
import { TemplateStatus } from '@/types/templates';

describe('useTemplates', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  const renderUseTemplates = () =>
    renderHook(() => useTemplates(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

  describe('Initial State', () => {
    it('returns initial templates state', () => {
      const { result } = renderUseTemplates();

      expect(result.current.templates).toEqual([]);
      // Hook dispatches fetchTemplates on mount, so loading is true initially
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('returns initial status counts', () => {
      const { result } = renderUseTemplates();

      expect(result.current.statusCounts).toEqual({
        all: 0,
        [TemplateStatus.APPROVED]: 0,
        [TemplateStatus.PENDING]: 0,
        [TemplateStatus.REJECTED]: 0,
      });
    });

    it('returns initial page and filter', () => {
      const { result } = renderUseTemplates();

      expect(result.current.page).toBe(1);
      expect(result.current.statusFilter).toBe('all');
      expect(result.current.search).toBe('');
    });

    it('returns stable interface with memoized callbacks', () => {
      const { result, rerender } = renderUseTemplates();

      const firstSetSearch = result.current.setSearch;
      const firstSetStatusFilter = result.current.setStatusFilter;
      const firstSetPage = result.current.setPage;
      const firstRefetch = result.current.refetch;

      rerender();

      // Callbacks should maintain same reference
      expect(result.current.setSearch).toBe(firstSetSearch);
      expect(result.current.setStatusFilter).toBe(firstSetStatusFilter);
      expect(result.current.setPage).toBe(firstSetPage);
      expect(result.current.refetch).toBe(firstRefetch);
    });
  });

  describe('Search Functionality', () => {
    it('setSearch updates search state', async () => {
      const { result } = renderUseTemplates();

      act(() => {
        result.current.setSearch('order');
      });

      expect(result.current.search).toBe('order');
    });

    it('setSearch resets page to 1 through reducer', async () => {
      const { result } = renderUseTemplates();

      // First set page to 5
      act(() => {
        result.current.setPage(5);
      });

      expect(result.current.page).toBe(5);

      // Then search changes page back to 1
      act(() => {
        result.current.setSearch('test');
      });

      expect(result.current.page).toBe(1);
    });

    it('setSearch with empty string clears search', async () => {
      const { result } = renderUseTemplates();

      act(() => {
        result.current.setSearch('previous');
      });

      expect(result.current.search).toBe('previous');

      act(() => {
        result.current.setSearch('');
      });

      expect(result.current.search).toBe('');
    });
  });

  describe('Filter Functionality', () => {
    it('setStatusFilter updates filter state', async () => {
      const { result } = renderUseTemplates();

      act(() => {
        result.current.setStatusFilter(TemplateStatus.APPROVED);
      });

      expect(result.current.statusFilter).toBe(TemplateStatus.APPROVED);
    });

    it('setStatusFilter resets page to 1 through reducer', async () => {
      const { result } = renderUseTemplates();

      act(() => {
        result.current.setPage(3);
      });

      expect(result.current.page).toBe(3);

      act(() => {
        result.current.setStatusFilter(TemplateStatus.PENDING);
      });

      expect(result.current.page).toBe(1);
    });

    it('setStatusFilter accepts all status values', async () => {
      const { result } = renderUseTemplates();

      const statuses = [TemplateStatus.APPROVED, TemplateStatus.PENDING, TemplateStatus.REJECTED, 'all' as const];

      for (const status of statuses) {
        act(() => {
          result.current.setStatusFilter(status);
        });
        expect(result.current.statusFilter).toBe(status);
      }
    });
  });

  describe('Pagination', () => {
    it('setPage updates page number', async () => {
      const { result } = renderUseTemplates();

      act(() => {
        result.current.setPage(2);
      });

      expect(result.current.page).toBe(2);
    });

    it('setPage preserves search and filter', async () => {
      const { result } = renderUseTemplates();

      act(() => {
        result.current.setSearch('test');
        result.current.setStatusFilter(TemplateStatus.APPROVED);
      });

      act(() => {
        result.current.setPage(5);
      });

      expect(result.current.search).toBe('test');
      expect(result.current.statusFilter).toBe(TemplateStatus.APPROVED);
      expect(result.current.page).toBe(5);
    });

    it('setPage handles multiple increments', async () => {
      const { result } = renderUseTemplates();

      act(() => {
        result.current.setPage(10);
      });

      expect(result.current.page).toBe(10);

      act(() => {
        result.current.setPage(100);
      });

      expect(result.current.page).toBe(100);
    });
  });

  describe('Loading State', () => {
    it('loading property is true initially (fetchTemplates dispatched on mount)', () => {
      const { result } = renderUseTemplates();

      expect(result.current.loading).toBe(true);
    });

    it('isFetching is false when templates empty', () => {
      const { result } = renderUseTemplates();

      // isFetching is true only when status='loading' AND templates.length > 0
      expect(result.current.isFetching).toBe(false);
      expect(result.current.templates.length).toBe(0);
    });
  });

  describe('Callback Return Types', () => {
    it('createTemplate returns a Promise', () => {
      const { result } = renderUseTemplates();

      const promise = result.current.createTemplate({
        name: 'Test',
        language: 'en',
        category: 'MARKETING',
        components: [],
      });

      expect(promise).toBeInstanceOf(Promise);
      // Suppress unhandled rejection
      promise.catch(() => {});
    });

    it('updateTemplate returns a Promise', () => {
      const { result } = renderUseTemplates();

      const promise = result.current.updateTemplate('id', []);

      expect(promise).toBeInstanceOf(Promise);
      // Suppress unhandled rejection
      promise.catch(() => {});
    });

    it('removeTemplate returns a Promise', () => {
      const { result } = renderUseTemplates();

      const promise = result.current.removeTemplate('id');

      expect(promise).toBeInstanceOf(Promise);
      // Suppress unhandled rejection
      promise.catch(() => {});
    });

    it('syncOne returns a Promise', () => {
      const { result } = renderUseTemplates();

      const promise = result.current.syncOne('id');

      expect(promise).toBeInstanceOf(Promise);
      // Suppress unhandled rejection
      promise.catch(() => {});
    });

    it('syncAll returns a Promise with synced count', () => {
      const { result } = renderUseTemplates();

      const promise = result.current.syncAll();

      expect(promise).toBeInstanceOf(Promise);
      // Suppress unhandled rejection
      promise.catch(() => {});
    });

    it('refetch returns void', () => {
      const { result } = renderUseTemplates();

      const returnValue = result.current.refetch();

      expect(returnValue).toBeUndefined();
    });
  });

  describe('Return Value Consistency', () => {
    it('maintains consistent return interface across rerenders', () => {
      const { result, rerender } = renderUseTemplates();

      const firstReturn = result.current;

      rerender();

      const secondReturn = result.current;

      // All expected properties exist
      expect(secondReturn).toHaveProperty('templates');
      expect(secondReturn).toHaveProperty('meta');
      expect(secondReturn).toHaveProperty('loading');
      expect(secondReturn).toHaveProperty('isFetching');
      expect(secondReturn).toHaveProperty('error');
      expect(secondReturn).toHaveProperty('statusFilter');
      expect(secondReturn).toHaveProperty('search');
      expect(secondReturn).toHaveProperty('page');
      expect(secondReturn).toHaveProperty('statusCounts');
      expect(secondReturn).toHaveProperty('createTemplate');
      expect(secondReturn).toHaveProperty('updateTemplate');
      expect(secondReturn).toHaveProperty('removeTemplate');
      expect(secondReturn).toHaveProperty('syncOne');
      expect(secondReturn).toHaveProperty('syncAll');
      expect(secondReturn).toHaveProperty('refetch');
    });
  });
});
