import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '@/lib/api';
import type { ApiResponse } from '@/types';
import type { DashboardStats, ActivityItem } from '@/types/dashboard';
import type { RootState } from '@/app/store';

type LoadStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface DashboardState {
  stats: DashboardStats | null;
  activity: ActivityItem[];
  status: LoadStatus;
  isFetching: boolean; // true during background refresh (data already loaded)
  error: string | null;
}

const initialState: DashboardState = {
  stats: null,
  activity: [],
  status: 'idle',
  isFetching: false,
  error: null,
};

// ─── Thunks ────────────────────────────────────────────────────────────────────

export const fetchDashboardStats = createAsyncThunk<
  DashboardStats,
  void,
  { rejectValue: string }
>(
  'dashboard/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
      return res.data.data;
    } catch (err: unknown) {
      return rejectWithValue(
        err instanceof Error ? err.message : 'Failed to load dashboard stats',
      );
    }
  },
);

export const fetchDashboardActivity = createAsyncThunk<
  ActivityItem[],
  void,
  { rejectValue: string }
>(
  'dashboard/fetchActivity',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get<ApiResponse<ActivityItem[]>>('/dashboard/activity?limit=20');
      return res.data.data;
    } catch (err: unknown) {
      return rejectWithValue(
        err instanceof Error ? err.message : 'Failed to load recent activity',
      );
    }
  },
);

// Convenience thunk that fetches both in parallel
export const fetchDashboard = createAsyncThunk<void, void, { rejectValue: string }>(
  'dashboard/fetchAll',
  async (_, { dispatch }) => {
    await Promise.all([dispatch(fetchDashboardStats()), dispatch(fetchDashboardActivity())]);
  },
);

// ─── Slice ─────────────────────────────────────────────────────────────────────

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (state) => {
        if (state.status === 'idle') {
          state.status = 'loading';
        } else {
          // Already loaded once — flag as background refresh, not full skeleton
          state.isFetching = true;
        }
        state.error = null;
      })
      .addCase(fetchDashboard.fulfilled, (state) => {
        state.status = 'succeeded';
        state.isFetching = false;
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.status = 'failed';
        state.isFetching = false;
        state.error = action.payload ?? 'Unknown error';
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      .addCase(fetchDashboardActivity.fulfilled, (state, action) => {
        state.activity = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        if (!state.error) state.error = action.payload ?? 'Failed to load stats';
      })
      .addCase(fetchDashboardActivity.rejected, (state, action) => {
        if (!state.error) state.error = action.payload ?? 'Failed to load activity';
      });
  },
});

// ─── Selectors ─────────────────────────────────────────────────────────────────

export const selectDashboardStats = (state: RootState): DashboardStats | null =>
  state.dashboard.stats;
export const selectDashboardActivity = (state: RootState): ActivityItem[] =>
  state.dashboard.activity;
export const selectDashboardStatus = (state: RootState): LoadStatus => state.dashboard.status;
export const selectDashboardIsFetching = (state: RootState): boolean =>
  state.dashboard.isFetching;
export const selectDashboardError = (state: RootState): string | null => state.dashboard.error;

export default dashboardSlice.reducer;
