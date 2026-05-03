import { describe, it, expect } from 'vitest';
import templatesReducer, {
  setSearch,
  setStatusFilter,
  setPage,
  selectTemplates,
  selectTemplatesMeta,
  selectTemplatesStatus,
  selectTemplatesError,
  selectTemplatesSearch,
  selectTemplatesStatusFilter,
  selectTemplatesPage,
  selectStatusCounts,
  selectStatusCountsLoaded,
} from '../templatesSlice';
import { TemplateStatus } from '@/types/templates';
import type { TemplatesState } from '@/types';
import type { RootState } from '@/app/store';

describe('templatesSlice', () => {
  const getInitialState = (): TemplatesState => ({
    list: [],
    meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
    status: 'idle',
    error: null,
    search: '',
    statusFilter: 'all',
    page: 1,
    statusCounts: {
      all: 0,
      [TemplateStatus.APPROVED]: 0,
      [TemplateStatus.PENDING]: 0,
      [TemplateStatus.REJECTED]: 0,
    },
    statusCountsLoaded: false,
  });

  describe('Reducers', () => {
    describe('setSearch', () => {
      it('updates search state', () => {
        const state = getInitialState();
        const result = templatesReducer(state, setSearch('test'));

        expect(result.search).toBe('test');
      });

      it('resets page to 1 when search changes', () => {
        const state = getInitialState();
        state.page = 5;
        const result = templatesReducer(state, setSearch('test'));

        expect(result.page).toBe(1);
        expect(result.search).toBe('test');
      });

      it('clears search when empty string', () => {
        const state = getInitialState();
        state.search = 'previous';
        const result = templatesReducer(state, setSearch(''));

        expect(result.search).toBe('');
      });
    });

    describe('setStatusFilter', () => {
      it('updates statusFilter state', () => {
        const state = getInitialState();
        const result = templatesReducer(state, setStatusFilter(TemplateStatus.APPROVED));

        expect(result.statusFilter).toBe(TemplateStatus.APPROVED);
      });

      it('resets page to 1 when filter changes', () => {
        const state = getInitialState();
        state.page = 3;
        const result = templatesReducer(state, setStatusFilter(TemplateStatus.PENDING));

        expect(result.page).toBe(1);
        expect(result.statusFilter).toBe(TemplateStatus.PENDING);
      });

      it('changes back to "all" filter', () => {
        const state = getInitialState();
        state.statusFilter = TemplateStatus.APPROVED;
        const result = templatesReducer(state, setStatusFilter('all'));

        expect(result.statusFilter).toBe('all');
      });

      it('handles all status values', () => {
        const state = getInitialState();

        let result = templatesReducer(state, setStatusFilter(TemplateStatus.APPROVED));
        expect(result.statusFilter).toBe(TemplateStatus.APPROVED);

        result = templatesReducer(state, setStatusFilter(TemplateStatus.PENDING));
        expect(result.statusFilter).toBe(TemplateStatus.PENDING);

        result = templatesReducer(state, setStatusFilter(TemplateStatus.REJECTED));
        expect(result.statusFilter).toBe(TemplateStatus.REJECTED);
      });
    });

    describe('setPage', () => {
      it('updates page state', () => {
        const state = getInitialState();
        const result = templatesReducer(state, setPage(2));

        expect(result.page).toBe(2);
      });

      it('updates to higher page numbers', () => {
        const state = getInitialState();
        let result = templatesReducer(state, setPage(10));
        expect(result.page).toBe(10);

        result = templatesReducer(result, setPage(100));
        expect(result.page).toBe(100);
      });

      it('keeps search and filter unchanged', () => {
        const state = getInitialState();
        state.search = 'test';
        state.statusFilter = TemplateStatus.APPROVED;
        const result = templatesReducer(state, setPage(5));

        expect(result.search).toBe('test');
        expect(result.statusFilter).toBe(TemplateStatus.APPROVED);
        expect(result.page).toBe(5);
      });
    });
  });

  describe('Selectors', () => {
    const createMockState = (): RootState => ({
      templates: getInitialState(),
    } as unknown as RootState);

    describe('selectTemplates', () => {
      it('returns templates array', () => {
        const state = createMockState();
        const result = selectTemplates(state);

        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(0);
      });

      it('returns list with templates', () => {
        const state = createMockState();
        const mockTemplate = {
          id: '1',
          name: 'Test',
          status: TemplateStatus.APPROVED,
          category: 'MARKETING' as const,
          language: 'en',
          components: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        state.templates.list = [mockTemplate];
        const result = selectTemplates(state);

        expect(result.length).toBe(1);
        expect(result[0].id).toBe('1');
      });
    });

    describe('selectTemplatesMeta', () => {
      it('returns metadata', () => {
        const state = createMockState();
        const result = selectTemplatesMeta(state);

        expect(result.total).toBe(0);
        expect(result.page).toBe(1);
        expect(result.limit).toBe(20);
      });

      it('returns updated metadata', () => {
        const state = createMockState();
        state.templates.meta = { total: 100, page: 2, limit: 20, totalPages: 5 };
        const result = selectTemplatesMeta(state);

        expect(result.total).toBe(100);
        expect(result.page).toBe(2);
        expect(result.totalPages).toBe(5);
      });
    });

    describe('selectTemplatesStatus', () => {
      it('returns loading status', () => {
        const state = createMockState();
        state.templates.status = 'loading';
        const result = selectTemplatesStatus(state);

        expect(result).toBe('loading');
      });

      it('returns succeeded status', () => {
        const state = createMockState();
        state.templates.status = 'succeeded';
        const result = selectTemplatesStatus(state);

        expect(result).toBe('succeeded');
      });

      it('returns failed status', () => {
        const state = createMockState();
        state.templates.status = 'failed';
        const result = selectTemplatesStatus(state);

        expect(result).toBe('failed');
      });
    });

    describe('selectTemplatesError', () => {
      it('returns null when no error', () => {
        const state = createMockState();
        const result = selectTemplatesError(state);

        expect(result).toBeNull();
      });

      it('returns error message', () => {
        const state = createMockState();
        state.templates.error = 'Failed to fetch templates';
        const result = selectTemplatesError(state);

        expect(result).toBe('Failed to fetch templates');
      });
    });

    describe('selectTemplatesSearch', () => {
      it('returns search value', () => {
        const state = createMockState();
        state.templates.search = 'test search';
        const result = selectTemplatesSearch(state);

        expect(result).toBe('test search');
      });
    });

    describe('selectTemplatesStatusFilter', () => {
      it('returns filter value', () => {
        const state = createMockState();
        state.templates.statusFilter = TemplateStatus.APPROVED;
        const result = selectTemplatesStatusFilter(state);

        expect(result).toBe(TemplateStatus.APPROVED);
      });
    });

    describe('selectTemplatesPage', () => {
      it('returns page value', () => {
        const state = createMockState();
        state.templates.page = 3;
        const result = selectTemplatesPage(state);

        expect(result).toBe(3);
      });
    });

    describe('selectStatusCounts', () => {
      it('returns status counts', () => {
        const state = createMockState();
        const result = selectStatusCounts(state);

        expect(result.all).toBe(0);
        expect(result[TemplateStatus.APPROVED]).toBe(0);
        expect(result[TemplateStatus.PENDING]).toBe(0);
        expect(result[TemplateStatus.REJECTED]).toBe(0);
      });

      it('returns updated counts', () => {
        const state = createMockState();
        state.templates.statusCounts = {
          all: 10,
          [TemplateStatus.APPROVED]: 5,
          [TemplateStatus.PENDING]: 3,
          [TemplateStatus.REJECTED]: 2,
        };
        const result = selectStatusCounts(state);

        expect(result.all).toBe(10);
        expect(result[TemplateStatus.APPROVED]).toBe(5);
        expect(result[TemplateStatus.PENDING]).toBe(3);
        expect(result[TemplateStatus.REJECTED]).toBe(2);
      });
    });

    describe('selectStatusCountsLoaded', () => {
      it('returns false initially', () => {
        const state = createMockState();
        const result = selectStatusCountsLoaded(state);

        expect(result).toBe(false);
      });

      it('returns true when loaded', () => {
        const state = createMockState();
        state.templates.statusCountsLoaded = true;
        const result = selectStatusCountsLoaded(state);

        expect(result).toBe(true);
      });
    });
  });

  describe('State Combinations', () => {
    it('maintains consistency across multiple actions', () => {
      let state = getInitialState();

      state = templatesReducer(state, setSearch('order'));
      expect(state.search).toBe('order');
      expect(state.page).toBe(1);

      state = templatesReducer(state, setPage(2));
      expect(state.page).toBe(2);
      expect(state.search).toBe('order');

      state = templatesReducer(state, setStatusFilter(TemplateStatus.PENDING));
      expect(state.statusFilter).toBe(TemplateStatus.PENDING);
      expect(state.page).toBe(1);
      expect(state.search).toBe('order');
    });

    it('preserves list and metadata through filter changes', () => {
      const state = getInitialState();
      state.list = [{ id: '1', name: 'Test', status: TemplateStatus.APPROVED } as any];
      state.meta = { total: 1, page: 1, limit: 20, totalPages: 1 };

      const result = templatesReducer(state, setStatusFilter(TemplateStatus.PENDING));

      expect(result.list.length).toBe(1);
      expect(result.meta.total).toBe(1);
    });
  });
});
