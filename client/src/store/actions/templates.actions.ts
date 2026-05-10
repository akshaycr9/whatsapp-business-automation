import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  fetchTemplatesApi,
  createTemplateApi,
  deleteTemplateApi,
  syncTemplateApi,
  syncAllTemplatesApi,
  fetchStatusCountsApi,
  updateTemplateApi,
} from '@/api/templates.api';
import type {
  Template,
  CreateTemplateInput,
  UpdateTemplateInput,
  TemplateMeta,
  StatusCounts,
  FetchTemplatesArg,
} from '@/types';

export const fetchTemplates = createAsyncThunk<
  { templates: Template[]; meta: TemplateMeta },
  FetchTemplatesArg,
  { rejectValue: string }
>(
  'templates/fetchAll',
  async (args, { rejectWithValue }) => {
    try {
      return await fetchTemplatesApi(args);
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
      return await createTemplateApi(input);
    } catch (err: unknown) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to create template');
    }
  },
);

export const deleteTemplate = createAsyncThunk<string, string, { rejectValue: string }>(
  'templates/delete',
  async (id, { rejectWithValue }) => {
    try {
      return await deleteTemplateApi(id);
    } catch (err: unknown) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to delete template');
    }
  },
);

export const syncTemplate = createAsyncThunk<Template, string, { rejectValue: string }>(
  'templates/syncOne',
  async (id, { rejectWithValue }) => {
    try {
      return await syncTemplateApi(id);
    } catch (err: unknown) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to sync template');
    }
  },
);

export const syncAllTemplates = createAsyncThunk<{ synced: number }, void, { rejectValue: string }>(
  'templates/syncAll',
  async (_, { rejectWithValue }) => {
    try {
      return await syncAllTemplatesApi();
    } catch (err: unknown) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to sync all templates');
    }
  },
);

export const fetchStatusCounts = createAsyncThunk<StatusCounts, void, { rejectValue: string }>(
  'templates/fetchStatusCounts',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchStatusCountsApi();
    } catch (err: unknown) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to fetch status counts');
    }
  },
);

export const updateTemplate = createAsyncThunk<Template, UpdateTemplateInput, { rejectValue: string }>(
  'templates/update',
  async (input, { rejectWithValue }) => {
    try {
      return await updateTemplateApi(input);
    } catch (err: unknown) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to update template');
    }
  },
);
