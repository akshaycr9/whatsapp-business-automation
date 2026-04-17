/**
 * v2AutomationsSlice
 *
 * Isolated from the v1 slice — no pagination, no create/delete.
 * Fetches all 9 fixed flows at once and provides toggle + updateFlow.
 */
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/lib/api';
import type { Automation, Template, PaginatedResponse, ApiResponse } from '@/types';
import type { RootState } from '@/app/store';

type LoadStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface V2AutomationsState {
  flows: Automation[];
  approvedTemplates: Template[];
  status: LoadStatus;
  templatesStatus: LoadStatus;
  error: string | null;
}

const initialState: V2AutomationsState = {
  flows: [],
  approvedTemplates: [],
  status: 'idle',
  templatesStatus: 'idle',
  error: null,
};

// ─── Thunks ────────────────────────────────────────────────────────────────────

export const fetchAllFlows = createAsyncThunk<Automation[], void, { rejectValue: string }>(
  'v2Automations/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get<PaginatedResponse<Automation>>('/automations', {
        params: { limit: 50 },
      });
      return res.data.data;
    } catch (err: unknown) {
      return rejectWithValue(
        err instanceof Error ? err.message : 'Failed to load automations',
      );
    }
  },
);

export const fetchV2ApprovedTemplates = createAsyncThunk<
  Template[],
  void,
  { rejectValue: string }
>(
  'v2Automations/fetchApprovedTemplates',
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

export const toggleV2Flow = createAsyncThunk<Automation, string, { rejectValue: string }>(
  'v2Automations/toggle',
  async (id, { rejectWithValue, dispatch }) => {
    // Optimistic flip — rollback on failure
    dispatch(flowToggled(id));
    try {
      const res = await api.patch<ApiResponse<Automation>>(`/automations/${id}/toggle`);
      return res.data.data;
    } catch (err: unknown) {
      dispatch(flowToggled(id)); // rollback
      return rejectWithValue(
        err instanceof Error ? err.message : 'Failed to toggle flow',
      );
    }
  },
);

export const updateV2Flow = createAsyncThunk<
  Automation,
  { id: string; templateId: string; variableMapping: Record<string, string>; delayMinutes?: number },
  { rejectValue: string }
>(
  'v2Automations/update',
  async ({ id, templateId, variableMapping, delayMinutes }, { rejectWithValue }) => {
    try {
      const res = await api.put<ApiResponse<Automation>>(`/automations/${id}`, {
        templateId,
        variableMapping,
        ...(delayMinutes !== undefined && { delayMinutes }),
      });
      return res.data.data;
    } catch (err: unknown) {
      return rejectWithValue(
        err instanceof Error ? err.message : 'Failed to update flow',
      );
    }
  },
);

// ─── Slice ─────────────────────────────────────────────────────────────────────

const v2AutomationsSlice = createSlice({
  name: 'v2Automations',
  initialState,
  reducers: {
    flowToggled: (state, action: PayloadAction<string>) => {
      const flow = state.flows.find((f) => f.id === action.payload);
      if (flow) flow.isActive = !flow.isActive;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchAllFlows
      .addCase(fetchAllFlows.pending, (state) => {
        if (state.status === 'idle') state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchAllFlows.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.flows = action.payload;
      })
      .addCase(fetchAllFlows.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Unknown error';
      })
      // fetchV2ApprovedTemplates
      .addCase(fetchV2ApprovedTemplates.pending, (state) => {
        state.templatesStatus = 'loading';
      })
      .addCase(fetchV2ApprovedTemplates.fulfilled, (state, action) => {
        state.templatesStatus = 'succeeded';
        state.approvedTemplates = action.payload;
      })
      .addCase(fetchV2ApprovedTemplates.rejected, (state) => {
        state.templatesStatus = 'failed';
      })
      // toggleV2Flow — reconcile optimistic update with server response
      .addCase(toggleV2Flow.fulfilled, (state, action) => {
        const idx = state.flows.findIndex((f) => f.id === action.payload.id);
        if (idx !== -1) state.flows[idx] = { ...state.flows[idx], ...action.payload };
      })
      // updateV2Flow
      .addCase(updateV2Flow.fulfilled, (state, action) => {
        const idx = state.flows.findIndex((f) => f.id === action.payload.id);
        if (idx !== -1) state.flows[idx] = { ...state.flows[idx], ...action.payload };
      });
  },
});

const { flowToggled } = v2AutomationsSlice.actions;

// ─── Selectors ─────────────────────────────────────────────────────────────────

export const selectV2Flows = (state: RootState): Automation[] =>
  state.v2Automations.flows;
export const selectV2ApprovedTemplates = (state: RootState): Template[] =>
  state.v2Automations.approvedTemplates;
export const selectV2FlowsStatus = (state: RootState): LoadStatus =>
  state.v2Automations.status;
export const selectV2FlowsError = (state: RootState): string | null =>
  state.v2Automations.error;

export default v2AutomationsSlice.reducer;
