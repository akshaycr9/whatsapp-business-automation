import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/lib/api';
import type { Template, PaginatedResponse, ApiResponse } from '@/types';
import type { RootState } from '@/app/store';

export type StatusFilter = 'all' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface TemplateButtonInput {
  type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | 'COPY_CODE';
  text: string;
  url?: string;
  phone_number?: string;
  example?: string;
}

export interface TemplateComponentInput {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
  format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  text?: string;
  example?: string[];
  buttons?: TemplateButtonInput[];
}

export interface CreateTemplateInput {
  name: string;
  language: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  components: TemplateComponentInput[];
}

interface TemplateMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type LoadStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface TemplatesState {
  list: Template[];
  meta: TemplateMeta;
  status: LoadStatus;
  error: string | null;
  // UI filter state — lives in Redux so it persists across navigation
  search: string;
  statusFilter: StatusFilter;
  page: number;
}

const DEFAULT_META: TemplateMeta = { total: 0, page: 1, limit: 20, totalPages: 0 };

const initialState: TemplatesState = {
  list: [],
  meta: DEFAULT_META,
  status: 'idle',
  error: null,
  search: '',
  statusFilter: 'all',
  page: 1,
};

// ─── Thunks ────────────────────────────────────────────────────────────────────

interface FetchTemplatesArg {
  search: string;
  page: number;
  statusFilter: StatusFilter;
}

export const fetchTemplates = createAsyncThunk<
  { templates: Template[]; meta: TemplateMeta },
  FetchTemplatesArg,
  { rejectValue: string }
>(
  'templates/fetchAll',
  async ({ search, page, statusFilter }, { rejectWithValue }) => {
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await api.get<PaginatedResponse<Template>>('/templates', { params });
      return { templates: res.data.data, meta: res.data.meta };
    } catch (err: unknown) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to load templates');
    }
  },
);

export const createTemplate = createAsyncThunk<
  Template,
  CreateTemplateInput,
  { rejectValue: string }
>(
  'templates/create',
  async (input, { rejectWithValue }) => {
    try {
      const res = await api.post<ApiResponse<Template>>('/templates', input);
      return res.data.data;
    } catch (err: unknown) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to create template');
    }
  },
);

export const deleteTemplate = createAsyncThunk<string, string, { rejectValue: string }>(
  'templates/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/templates/${id}`);
      return id;
    } catch (err: unknown) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to delete template');
    }
  },
);

export const syncTemplate = createAsyncThunk<Template, string, { rejectValue: string }>(
  'templates/syncOne',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.post<ApiResponse<Template>>(`/templates/${id}/sync`);
      return res.data.data;
    } catch (err: unknown) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to sync template');
    }
  },
);

export const syncAllTemplates = createAsyncThunk<
  { synced: number },
  void,
  { rejectValue: string }
>(
  'templates/syncAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.post<ApiResponse<{ synced: number }>>('/templates/sync-all');
      return res.data.data;
    } catch (err: unknown) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to sync all templates');
    }
  },
);

// ─── Slice ─────────────────────────────────────────────────────────────────────

const templatesSlice = createSlice({
  name: 'templates',
  initialState,
  reducers: {
    setSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload;
      state.page = 1; // reset to page 1 on search change
    },
    setStatusFilter: (state, action: PayloadAction<StatusFilter>) => {
      state.statusFilter = action.payload;
      state.page = 1; // reset to page 1 on filter change
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
      });
  },
});

// ─── Actions ───────────────────────────────────────────────────────────────────

export const { setSearch, setStatusFilter, setPage } = templatesSlice.actions;

// ─── Selectors ─────────────────────────────────────────────────────────────────

export const selectTemplates = (state: RootState): Template[] => state.templates.list;
export const selectTemplatesMeta = (state: RootState): TemplateMeta => state.templates.meta;
export const selectTemplatesStatus = (state: RootState): LoadStatus => state.templates.status;
export const selectTemplatesError = (state: RootState): string | null => state.templates.error;
export const selectTemplatesSearch = (state: RootState): string => state.templates.search;
export const selectTemplatesStatusFilter = (state: RootState): StatusFilter =>
  state.templates.statusFilter;
export const selectTemplatesPage = (state: RootState): number => state.templates.page;

export default templatesSlice.reducer;
