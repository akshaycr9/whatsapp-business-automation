import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { api } from "@/lib/api";
import type {
  Automation,
  AutomationLog,
  Template,
  AutomationCategoryGroup,
} from "@/types";
import type { RootState } from "@/app/store";

interface ApiResponse<T> {
  data: T;
}

interface PaginatedResponse<T> {
  data: T[];
  meta?: { total: number };
}

export interface CreateAutomationInput {
  name: string;
  categoryId: string;
  triggerType: "SHOPIFY_EVENT" | "BUTTON_REPLY";
  shopifyEvent?:
    | "PREPAID_ORDER_CONFIRMED"
    | "COD_ORDER_CONFIRMATION"
    | "ORDER_FULFILLED"
    | "ORDER_CANCELLED"
    | "COD_ORDER_FOLLOW_UP"
    | "ABANDONED_CART_1"
    | "ABANDONED_CART_2"
    | "ABANDONED_CART_3";
  buttonTriggerText?: string;
  templateId?: string;
  variableMapping: Record<string, string>;
  isActive: boolean;
  delayMinutes: number;
}

type LoadStatus = "idle" | "loading" | "succeeded" | "failed";

interface AutomationsState {
  categories: AutomationCategoryGroup[];
  approvedTemplates: Template[];
  status: LoadStatus;
  approvedTemplatesStatus: LoadStatus;
  error: string | null;
}

const initialState: AutomationsState = {
  categories: [],
  approvedTemplates: [],
  status: "idle",
  approvedTemplatesStatus: "idle",
  error: null,
};

// ─── Thunks ────────────────────────────────────────────────────────────────────

export const fetchAutomations = createAsyncThunk<
  AutomationCategoryGroup[],
  void,
  { rejectValue: string }
>("automations/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get<{ data: AutomationCategoryGroup[] }>("/automations");
    return res.data.data;
  } catch (err: unknown) {
    return rejectWithValue(
      err instanceof Error ? err.message : "Failed to load automations",
    );
  }
});

export const fetchApprovedTemplates = createAsyncThunk<
  Template[],
  void,
  { rejectValue: string }
>("automations/fetchApprovedTemplates", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get<PaginatedResponse<Template>>("/templates", {
      params: { status: "APPROVED", limit: 100 },
    });
    return res.data.data;
  } catch (err: unknown) {
    return rejectWithValue(
      err instanceof Error ? err.message : "Failed to load approved templates",
    );
  }
});

export const createAutomation = createAsyncThunk<
  Automation,
  CreateAutomationInput,
  { rejectValue: string }
>("automations/create", async (input, { rejectWithValue }) => {
  try {
    const res = await api.post<ApiResponse<Automation>>("/automations", input);
    return res.data.data;
  } catch (err: unknown) {
    return rejectWithValue(
      err instanceof Error ? err.message : "Failed to create automation",
    );
  }
});

export const updateAutomation = createAsyncThunk<
  Automation,
  { id: string; input: Partial<CreateAutomationInput> },
  { rejectValue: string }
>("automations/update", async ({ id, input }, { rejectWithValue }) => {
  try {
    const res = await api.put<ApiResponse<Automation>>(
      `/automations/${id}`,
      input,
    );
    return res.data.data;
  } catch (err: unknown) {
    return rejectWithValue(
      err instanceof Error ? err.message : "Failed to update automation",
    );
  }
});

export const deleteAutomation = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("automations/delete", async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/automations/${id}`);
    return id;
  } catch (err: unknown) {
    return rejectWithValue(
      err instanceof Error ? err.message : "Failed to delete automation",
    );
  }
});

export const toggleAutomation = createAsyncThunk<
  Automation,
  string,
  { rejectValue: string }
>("automations/toggle", async (id, { rejectWithValue, dispatch }) => {
  // Optimistic update — flip the flag immediately
  dispatch(automationToggled(id));
  try {
    const res = await api.patch<ApiResponse<Automation>>(
      `/automations/${id}/toggle`,
    );
    return res.data.data;
  } catch (err: unknown) {
    // Rollback
    dispatch(automationToggled(id));
    return rejectWithValue(
      err instanceof Error ? err.message : "Failed to toggle automation",
    );
  }
});

export const fetchAutomationLogs = createAsyncThunk<
  { items: AutomationLog[]; meta: Record<string, unknown> },
  { automationId: string; page?: number },
  { rejectValue: string }
>(
  "automations/fetchLogs",
  async ({ automationId, page = 1 }, { rejectWithValue }) => {
    try {
      const res = await api.get<{
        data: AutomationLog[];
        meta: Record<string, unknown>;
      }>(`/automations/${automationId}/logs`, { params: { page, limit: 20 } });
      return { items: res.data.data, meta: res.data.meta };
    } catch (err: unknown) {
      return rejectWithValue(
        err instanceof Error ? err.message : "Failed to load automation logs",
      );
    }
  },
);

// ─── Slice ─────────────────────────────────────────────────────────────────────

const automationsSlice = createSlice({
  name: "automations",
  initialState,
  reducers: {
    automationToggled: (state, action: PayloadAction<string>) => {
      for (const category of state.categories) {
        const automation = category.automations.find((a) => a.id === action.payload);
        if (automation) {
          automation.isActive = !automation.isActive;
          return;
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAutomations.pending, (state) => {
        if (state.status === "idle") state.status = "loading";
        state.error = null;
      })
      .addCase(fetchAutomations.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.categories = action.payload;
      })
      .addCase(fetchAutomations.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Unknown error";
      })
      .addCase(fetchApprovedTemplates.pending, (state) => {
        state.approvedTemplatesStatus = "loading";
      })
      .addCase(fetchApprovedTemplates.fulfilled, (state, action) => {
        state.approvedTemplatesStatus = "succeeded";
        state.approvedTemplates = action.payload;
      })
      .addCase(fetchApprovedTemplates.rejected, (state) => {
        state.approvedTemplatesStatus = "failed";
      })
      .addCase(createAutomation.fulfilled, (state, action) => {
        const automation = action.payload;
        const category = state.categories.find((c) => c.categoryId === automation.categoryId);
        if (category) {
          category.automations.unshift(automation);
        }
      })
      .addCase(updateAutomation.fulfilled, (state, action) => {
        const automation = action.payload;
        const category = state.categories.find((c) => c.categoryId === automation.categoryId);
        if (category) {
          const idx = category.automations.findIndex((a) => a.id === automation.id);
          if (idx !== -1) {
            category.automations[idx] = { ...category.automations[idx], ...automation };
          }
        }
      })
      .addCase(deleteAutomation.fulfilled, (state, action) => {
        const automationId = action.payload;
        for (const category of state.categories) {
          category.automations = category.automations.filter((a) => a.id !== automationId);
        }
      })
      .addCase(toggleAutomation.fulfilled, (state, action) => {
        const automation = action.payload;
        const category = state.categories.find((c) => c.categoryId === automation.categoryId);
        if (category) {
          const idx = category.automations.findIndex((a) => a.id === automation.id);
          if (idx !== -1) {
            category.automations[idx] = { ...category.automations[idx], ...automation };
          }
        }
      });
  },
});

// ─── Selectors ─────────────────────────────────────────────────────────────────

export const selectAutomationCategories = (state: RootState): AutomationCategoryGroup[] =>
  state.automations.categories;
export const selectApprovedTemplates = (state: RootState): Template[] =>
  state.automations.approvedTemplates;
export const selectAutomationsStatus = (state: RootState): LoadStatus =>
  state.automations.status;
export const selectAutomationsError = (state: RootState): string | null =>
  state.automations.error;

// Selector to get all automations (flattened from categories for backward compatibility)
export const selectAutomations = (state: RootState): Automation[] => {
  const categories = state.automations.categories;
  const automations: Automation[] = [];
  for (const category of categories) {
    automations.push(...category.automations);
  }
  return automations;
};

export const { automationToggled } = automationsSlice.actions;

export default automationsSlice.reducer;
