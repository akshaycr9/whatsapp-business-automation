import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  fetchAutomationsApi,
  fetchApprovedTemplatesApi,
  createAutomationApi,
  updateAutomationApi,
  deleteAutomationApi,
  toggleAutomationApi,
  fetchAutomationLogsApi,
  type CreateAutomationInput,
} from '@/api/automations.api';
import type { Automation, AutomationLog, AutomationCategoryGroup, Template } from '@/types';

export type { CreateAutomationInput };

export const fetchAutomations = createAsyncThunk<
  AutomationCategoryGroup[],
  void,
  { rejectValue: string }
>('automations/fetchAll', async (_, { rejectWithValue }) => {
  try {
    return await fetchAutomationsApi();
  } catch (err: unknown) {
    return rejectWithValue(
      err instanceof Error ? err.message : 'Failed to load automations',
    );
  }
});

export const fetchApprovedTemplates = createAsyncThunk<
  Template[],
  void,
  { rejectValue: string }
>('automations/fetchApprovedTemplates', async (_, { rejectWithValue }) => {
  try {
    return await fetchApprovedTemplatesApi();
  } catch (err: unknown) {
    return rejectWithValue(
      err instanceof Error ? err.message : 'Failed to load approved templates',
    );
  }
});

export const createAutomation = createAsyncThunk<
  Automation,
  CreateAutomationInput,
  { rejectValue: string }
>('automations/create', async (input, { rejectWithValue }) => {
  try {
    return await createAutomationApi(input);
  } catch (err: unknown) {
    return rejectWithValue(
      err instanceof Error ? err.message : 'Failed to create automation',
    );
  }
});

export const updateAutomation = createAsyncThunk<
  Automation,
  { id: string; input: Partial<CreateAutomationInput> },
  { rejectValue: string }
>('automations/update', async ({ id, input }, { rejectWithValue }) => {
  try {
    return await updateAutomationApi(id, input);
  } catch (err: unknown) {
    return rejectWithValue(
      err instanceof Error ? err.message : 'Failed to update automation',
    );
  }
});

export const deleteAutomation = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>('automations/delete', async (id, { rejectWithValue }) => {
  try {
    return await deleteAutomationApi(id);
  } catch (err: unknown) {
    return rejectWithValue(
      err instanceof Error ? err.message : 'Failed to delete automation',
    );
  }
});

// Optimistic toggle: the slice handles isActive flip in the pending/rejected cases.
// No dispatch of a synchronous action here — avoids circular dependency with the slice.
export const toggleAutomation = createAsyncThunk<
  Automation,
  string,
  { rejectValue: string }
>('automations/toggle', async (id, { rejectWithValue }) => {
  try {
    return await toggleAutomationApi(id);
  } catch (err: unknown) {
    return rejectWithValue(
      err instanceof Error ? err.message : 'Failed to toggle automation',
    );
  }
});

export const fetchAutomationLogs = createAsyncThunk<
  { items: AutomationLog[]; meta: Record<string, unknown> },
  { automationId: string; page?: number },
  { rejectValue: string }
>('automations/fetchLogs', async ({ automationId, page = 1 }, { rejectWithValue }) => {
  try {
    return await fetchAutomationLogsApi(automationId, page);
  } catch (err: unknown) {
    return rejectWithValue(
      err instanceof Error ? err.message : 'Failed to load automation logs',
    );
  }
});
