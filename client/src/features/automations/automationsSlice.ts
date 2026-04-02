import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/lib/api';
import type { Automation, AutomationLog, Template, PaginatedResponse, ApiResponse } from '@/types';
import type { RootState } from '@/app/store';

export interface CreateAutomationInput {
  name: string;
  triggerType: 'SHOPIFY_EVENT' | 'BUTTON_REPLY';
  shopifyEvent?: 'PREPAID_ORDER_CONFIRMED' | 'COD_ORDER_CONFIRMED' | 'ORDER_FULFILLED' | 'ABANDONED_CART';
  buttonTriggerText?: string;
  templateId: string;
  variableMapping: Record<string, string>;
  isActive: boolean;
  delayMinutes: number;
}

interface AutomationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type LoadStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface AutomationsState {
  list: Automation[];
  approvedTemplates: Template[];
  meta: AutomationMeta;
  status: LoadStatus;
  approvedTemplatesStatus: LoadStatus;
  error: string | null;
  page: number;
}

const initialState: AutomationsState = {
  list: [],
  approvedTemplates: [],
  meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
  status: 'idle',
  approvedTemplatesStatus: 'idle',
  error: null,
  page: 1,
};

// ─── Thunks ────────────────────────────────────────────────────────────────────

export const fetchAutomations = createAsyncThunk<
  { automations: Automation[]; meta: AutomationMeta },
  number,
  { rejectValue: string }
>(
  'automations/fetchAll',
  async (page, { rejectWithValue }) => {
    try {
      const res = await api.get<PaginatedResponse<Automation>>('/automations', {
        params: { page, limit: 20 },
      });
      return { automations: res.data.data, meta: res.data.meta };
    } catch (err: unknown) {
      return rejectWithValue(
        err instanceof Error ? err.message : 'Failed to load automations',
      );
    }
  },
);

export const fetchApprovedTemplates = createAsyncThunk<
  Template[],
  void,
  { rejectValue: string }
>(
  'automations/fetchApprovedTemplates',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get<PaginatedResponse<Template>>('/templates', {
        params: { status: 'APPROVED', limit: 100 },
      });
      return res.data.data;
    } catch (err: unknown) {
      return rejectWithValue(
        err instanceof Error ? err.message : 'Failed to load approved templates',
      );
    }
  },
);

export const createAutomation = createAsyncThunk<
  Automation,
  CreateAutomationInput,
  { rejectValue: string }
>(
  'automations/create',
  async (input, { rejectWithValue }) => {
    try {
      const res = await api.post<ApiResponse<Automation>>('/automations', input);
      return res.data.data;
    } catch (err: unknown) {
      return rejectWithValue(
        err instanceof Error ? err.message : 'Failed to create automation',
      );
    }
  },
);

export const updateAutomation = createAsyncThunk<
  Automation,
  { id: string; input: Partial<CreateAutomationInput> },
  { rejectValue: string }
>(
  'automations/update',
  async ({ id, input }, { rejectWithValue }) => {
    try {
      const res = await api.put<ApiResponse<Automation>>(`/automations/${id}`, input);
      return res.data.data;
    } catch (err: unknown) {
      return rejectWithValue(
        err instanceof Error ? err.message : 'Failed to update automation',
      );
    }
  },
);

export const deleteAutomation = createAsyncThunk<string, string, { rejectValue: string }>(
  'automations/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/automations/${id}`);
      return id;
    } catch (err: unknown) {
      return rejectWithValue(
        err instanceof Error ? err.message : 'Failed to delete automation',
      );
    }
  },
);

export const toggleAutomation = createAsyncThunk<
  Automation,
  string,
  { rejectValue: string }
>(
  'automations/toggle',
  async (id, { rejectWithValue, dispatch }) => {
    // Optimistic update — flip the flag immediately
    dispatch(automationToggled(id));
    try {
      const res = await api.patch<ApiResponse<Automation>>(`/automations/${id}/toggle`);
      return res.data.data;
    } catch (err: unknown) {
      // Rollback
      dispatch(automationToggled(id));
      return rejectWithValue(
        err instanceof Error ? err.message : 'Failed to toggle automation',
      );
    }
  },
);

export const fetchAutomationLogs = createAsyncThunk<
  { items: AutomationLog[]; meta: AutomationMeta },
  { automationId: string; page?: number },
  { rejectValue: string }
>(
  'automations/fetchLogs',
  async ({ automationId, page = 1 }, { rejectWithValue }) => {
    try {
      const res = await api.get<{ data: AutomationLog[]; meta: AutomationMeta }>(
        `/automations/${automationId}/logs`,
        { params: { page, limit: 20 } },
      );
      return { items: res.data.data, meta: res.data.meta };
    } catch (err: unknown) {
      return rejectWithValue(
        err instanceof Error ? err.message : 'Failed to load automation logs',
      );
    }
  },
);

// ─── Slice ─────────────────────────────────────────────────────────────────────

const automationsSlice = createSlice({
  name: 'automations',
  initialState,
  reducers: {
    setPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },
    // Internal action for optimistic toggle — not exported directly (use toggleAutomation thunk)
    automationToggled: (state, action: PayloadAction<string>) => {
      const automation = state.list.find((a) => a.id === action.payload);
      if (automation) {
        automation.isActive = !automation.isActive;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAutomations.pending, (state) => {
        if (state.status === 'idle') state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchAutomations.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload.automations;
        state.meta = action.payload.meta;
      })
      .addCase(fetchAutomations.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Unknown error';
      })
      .addCase(fetchApprovedTemplates.pending, (state) => {
        state.approvedTemplatesStatus = 'loading';
      })
      .addCase(fetchApprovedTemplates.fulfilled, (state, action) => {
        state.approvedTemplatesStatus = 'succeeded';
        state.approvedTemplates = action.payload;
      })
      .addCase(fetchApprovedTemplates.rejected, (state) => {
        state.approvedTemplatesStatus = 'failed';
      })
      .addCase(createAutomation.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
        state.meta.total += 1;
      })
      .addCase(updateAutomation.fulfilled, (state, action) => {
        const idx = state.list.findIndex((a) => a.id === action.payload.id);
        if (idx !== -1) state.list[idx] = { ...state.list[idx], ...action.payload };
      })
      .addCase(deleteAutomation.fulfilled, (state, action) => {
        state.list = state.list.filter((a) => a.id !== action.payload);
        state.meta.total = Math.max(0, state.meta.total - 1);
      })
      .addCase(toggleAutomation.fulfilled, (state, action) => {
        const idx = state.list.findIndex((a) => a.id === action.payload.id);
        if (idx !== -1) state.list[idx] = { ...state.list[idx], ...action.payload };
      });
  },
});

const { automationToggled } = automationsSlice.actions;
export const { setPage } = automationsSlice.actions;

// ─── Selectors ─────────────────────────────────────────────────────────────────

export const selectAutomations = (state: RootState): Automation[] => state.automations.list;
export const selectApprovedTemplates = (state: RootState): Template[] =>
  state.automations.approvedTemplates;
export const selectAutomationsMeta = (state: RootState): AutomationMeta =>
  state.automations.meta;
export const selectAutomationsStatus = (state: RootState): LoadStatus =>
  state.automations.status;
export const selectAutomationsError = (state: RootState): string | null =>
  state.automations.error;
export const selectAutomationsPage = (state: RootState): number => state.automations.page;

export default automationsSlice.reducer;
