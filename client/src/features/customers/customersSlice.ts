import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/lib/api';
import type { Customer, PaginatedResponse, ApiResponse } from '@/types';
import type { RootState } from '@/app/store';

interface CustomerMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateCustomerInput {
  phone: string;
  name?: string;
  email?: string;
  city?: string;
  tags?: string[];
}

export interface UpdateCustomerInput {
  name?: string;
  email?: string;
  city?: string;
  tags?: string[];
}

export interface SyncResult {
  created: number;
  updated: number;
  skipped: number;
}

type LoadStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface CustomersState {
  list: Customer[];
  meta: CustomerMeta;
  status: LoadStatus;
  error: string | null;
  search: string;
  page: number;
}

const DEFAULT_META: CustomerMeta = { total: 0, page: 1, limit: 20, totalPages: 0 };

const initialState: CustomersState = {
  list: [],
  meta: DEFAULT_META,
  status: 'idle',
  error: null,
  search: '',
  page: 1,
};

// ─── Thunks ────────────────────────────────────────────────────────────────────

interface FetchCustomersArg {
  search: string;
  page: number;
}

export const fetchCustomers = createAsyncThunk<
  { customers: Customer[]; meta: CustomerMeta },
  FetchCustomersArg,
  { rejectValue: string }
>(
  'customers/fetchAll',
  async ({ search, page }, { rejectWithValue }) => {
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (search.trim()) params.search = search.trim();
      const res = await api.get<PaginatedResponse<Customer>>('/customers', { params });
      return { customers: res.data.data, meta: res.data.meta };
    } catch (err: unknown) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to load customers');
    }
  },
);

export const createCustomer = createAsyncThunk<
  Customer,
  CreateCustomerInput,
  { rejectValue: string }
>(
  'customers/create',
  async (input, { rejectWithValue }) => {
    try {
      const res = await api.post<ApiResponse<Customer>>('/customers', input);
      return res.data.data;
    } catch (err: unknown) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to create customer');
    }
  },
);

export const updateCustomer = createAsyncThunk<
  Customer,
  { id: string; input: UpdateCustomerInput },
  { rejectValue: string }
>(
  'customers/update',
  async ({ id, input }, { rejectWithValue }) => {
    try {
      const res = await api.put<ApiResponse<Customer>>(`/customers/${id}`, input);
      return res.data.data;
    } catch (err: unknown) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to update customer');
    }
  },
);

export const deleteCustomer = createAsyncThunk<string, string, { rejectValue: string }>(
  'customers/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/customers/${id}`);
      return id;
    } catch (err: unknown) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to delete customer');
    }
  },
);

export const syncCustomersFromShopify = createAsyncThunk<
  SyncResult,
  void,
  { rejectValue: string }
>(
  'customers/syncFromShopify',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.post<ApiResponse<SyncResult>>('/customers/sync-shopify');
      return res.data.data;
    } catch (err: unknown) {
      return rejectWithValue(
        err instanceof Error ? err.message : 'Failed to sync customers from Shopify',
      );
    }
  },
);

// ─── Slice ─────────────────────────────────────────────────────────────────────

const customersSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    setSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload;
      state.page = 1; // reset to page 1 on search change
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomers.pending, (state) => {
        if (state.status === 'idle') state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload.customers;
        state.meta = action.payload.meta;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Unknown error';
      })
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
        state.meta.total += 1;
      })
      .addCase(updateCustomer.fulfilled, (state, action) => {
        const idx = state.list.findIndex((c) => c.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.list = state.list.filter((c) => c.id !== action.payload);
        state.meta.total = Math.max(0, state.meta.total - 1);
      });
  },
});

// ─── Actions ───────────────────────────────────────────────────────────────────

export const { setSearch, setPage } = customersSlice.actions;

// ─── Selectors ─────────────────────────────────────────────────────────────────

export const selectCustomers = (state: RootState): Customer[] => state.customers.list;
export const selectCustomersMeta = (state: RootState): CustomerMeta => state.customers.meta;
export const selectCustomersStatus = (state: RootState): LoadStatus => state.customers.status;
export const selectCustomersError = (state: RootState): string | null => state.customers.error;
export const selectCustomersSearch = (state: RootState): string => state.customers.search;
export const selectCustomersPage = (state: RootState): number => state.customers.page;

export default customersSlice.reducer;
