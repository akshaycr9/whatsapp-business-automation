import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';

const selectTemplatesState = (state: RootState) => state.templates;

export const selectTemplates = createSelector(
  selectTemplatesState,
  (s) => s.list,
);

export const selectTemplatesMeta = createSelector(
  selectTemplatesState,
  (s) => s.meta,
);

export const selectTemplatesStatus = createSelector(
  selectTemplatesState,
  (s) => s.status,
);

export const selectTemplatesError = createSelector(
  selectTemplatesState,
  (s) => s.error,
);

export const selectTemplatesSearch = createSelector(
  selectTemplatesState,
  (s) => s.search,
);

export const selectTemplatesStatusFilter = createSelector(
  selectTemplatesState,
  (s) => s.statusFilter,
);

export const selectTemplatesPage = createSelector(
  selectTemplatesState,
  (s) => s.page,
);

export const selectStatusCounts = createSelector(
  selectTemplatesState,
  (s) => s.statusCounts,
);

export const selectStatusCountsLoaded = createSelector(
  selectTemplatesState,
  (s) => s.statusCountsLoaded,
);
