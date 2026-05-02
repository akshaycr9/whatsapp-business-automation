import { createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '@/lib/api';
import {
  TemplateStatus,
  Template,
  CreateTemplateInput,
  UpdateTemplateInput,
  TemplateMeta,
  StatusCounts,
  FetchTemplatesArg,
} from '@/types';
import type { PaginatedResponse, ApiResponse } from '@/types';

// ──── Template API Thunks ──────────────────────────────────────────────────

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

export const fetchStatusCounts = createAsyncThunk<StatusCounts, void, { rejectValue: string }>(
  'templates/fetchStatusCounts',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get<ApiResponse<StatusCounts>>('/templates/status-counts');
      return res.data.data;
    } catch (err: unknown) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to fetch status counts');
    }
  },
);

export const updateTemplate = createAsyncThunk<Template, UpdateTemplateInput, { rejectValue: string }>(
  'templates/update',
  async ({ id, components }, { rejectWithValue }) => {
    try {
      const res = await api.patch<ApiResponse<Template>>(`/templates/${id}`, { components });
      return res.data.data;
    } catch (err: unknown) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to update template');
    }
  },
);
