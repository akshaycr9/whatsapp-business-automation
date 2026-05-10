import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { TemplateStatus } from '@/types';
import type { StatusFilter, TemplateMeta, StatusCounts, TemplatesState } from '@/types';
import {
  fetchTemplates,
  deleteTemplate,
  syncTemplate,
  fetchStatusCounts,
  updateTemplate,
} from '@/store/actions/templates.actions';

const DEFAULT_META: TemplateMeta = { total: 0, page: 1, limit: 20, totalPages: 0 };

const DEFAULT_STATUS_COUNTS: StatusCounts = {
  all: 0,
  [TemplateStatus.APPROVED]: 0,
  [TemplateStatus.PENDING]: 0,
  [TemplateStatus.REJECTED]: 0,
};

const initialState: TemplatesState = {
  list: [],
  meta: DEFAULT_META,
  status: 'idle',
  error: null,
  search: '',
  statusFilter: 'all',
  page: 1,
  statusCounts: DEFAULT_STATUS_COUNTS,
  statusCountsLoaded: false,
};

const templatesSlice = createSlice({
  name: 'templates',
  initialState,
  reducers: {
    setSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload;
      state.page = 1;
    },
    setStatusFilter: (state, action: PayloadAction<StatusFilter>) => {
      state.statusFilter = action.payload;
      state.page = 1;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTemplates.pending, (state) => {
        if (state.status === 'idle') state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchTemplates.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload.templates;
        state.meta = action.payload.meta;
      })
      .addCase(fetchTemplates.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Unknown error';
      })
      .addCase(deleteTemplate.fulfilled, (state, action) => {
        state.list = state.list.filter((t) => t.id !== action.payload);
        state.meta.total = Math.max(0, state.meta.total - 1);
      })
      .addCase(syncTemplate.fulfilled, (state, action) => {
        const idx = state.list.findIndex((t) => t.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(updateTemplate.fulfilled, (state, action) => {
        const idx = state.list.findIndex((t) => t.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(fetchStatusCounts.fulfilled, (state, action) => {
        state.statusCounts = action.payload;
        state.statusCountsLoaded = true;
      });
  },
});

export const { setSearch, setStatusFilter, setPage } = templatesSlice.actions;
export default templatesSlice.reducer;
