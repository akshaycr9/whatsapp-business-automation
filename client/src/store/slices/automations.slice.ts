import { createSlice } from '@reduxjs/toolkit';
import type { Automation, AutomationCategoryGroup, Template } from '@/types';
import {
  fetchAutomations,
  fetchApprovedTemplates,
  createAutomation,
  updateAutomation,
  deleteAutomation,
  toggleAutomation,
} from '@/store/actions/automations.actions';

type LoadStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

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
  status: 'idle',
  approvedTemplatesStatus: 'idle',
  error: null,
};

// Flip isActive for a single automation by id — used for optimistic toggle
function flipAutomationActive(categories: AutomationCategoryGroup[], id: string): void {
  for (const category of categories) {
    const automation = category.automations.find((a) => a.id === id);
    if (automation) {
      automation.isActive = !automation.isActive;
      return;
    }
  }
}

function upsertAutomation(categories: AutomationCategoryGroup[], automation: Automation): void {
  const category = categories.find((c) => c.categoryId === automation.categoryId);
  if (!category) return;
  const idx = category.automations.findIndex((a) => a.id === automation.id);
  if (idx !== -1) {
    category.automations[idx] = { ...category.automations[idx], ...automation };
  }
}

const automationsSlice = createSlice({
  name: 'automations',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // ── fetchAutomations ──────────────────────────────────────────────────────
      .addCase(fetchAutomations.pending, (state) => {
        if (state.status === 'idle') state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchAutomations.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.categories = action.payload;
      })
      .addCase(fetchAutomations.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Unknown error';
      })

      // ── fetchApprovedTemplates ────────────────────────────────────────────────
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

      // ── createAutomation ──────────────────────────────────────────────────────
      .addCase(createAutomation.fulfilled, (state, action) => {
        const automation = action.payload;
        const category = state.categories.find((c) => c.categoryId === automation.categoryId);
        if (category) {
          category.automations.unshift(automation);
        }
      })

      // ── updateAutomation ──────────────────────────────────────────────────────
      .addCase(updateAutomation.fulfilled, (state, action) => {
        upsertAutomation(state.categories, action.payload);
      })

      // ── deleteAutomation ──────────────────────────────────────────────────────
      .addCase(deleteAutomation.fulfilled, (state, action) => {
        const id = action.payload;
        for (const category of state.categories) {
          category.automations = category.automations.filter((a) => a.id !== id);
        }
      })

      // ── toggleAutomation — optimistic update via pending/rejected ─────────────
      .addCase(toggleAutomation.pending, (state, action) => {
        flipAutomationActive(state.categories, action.meta.arg);
      })
      .addCase(toggleAutomation.rejected, (state, action) => {
        // Rollback the optimistic flip
        flipAutomationActive(state.categories, action.meta.arg);
      })
      .addCase(toggleAutomation.fulfilled, (state, action) => {
        // Sync with authoritative server response
        upsertAutomation(state.categories, action.payload);
      });
  },
});

export default automationsSlice.reducer;
export type { AutomationsState, LoadStatus };
