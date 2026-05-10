import { describe, it, expect } from 'vitest';
import reducer from '@/store/slices/automations.slice';
import type { AutomationsState } from '@/store/slices/automations.slice';
import {
  fetchAutomations,
  fetchApprovedTemplates,
  updateAutomation,
  deleteAutomation,
  toggleAutomation,
} from '@/store/actions/automations.actions';
import { makeAutomation, makeAutomationCategory } from '@/test/factories/automation.factory';
import { templateFactory } from '@/test/factories/template.factory';

const initialState: AutomationsState = {
  categories: [],
  approvedTemplates: [],
  status: 'idle',
  approvedTemplatesStatus: 'idle',
  error: null,
};

describe('automations slice', () => {
  // ── Initial state ───────────────────────────────────────────────────────────

  it('returns correct initial state', () => {
    const state = reducer(undefined, { type: '@@INIT' });
    expect(state.categories).toEqual([]);
    expect(state.approvedTemplates).toEqual([]);
    expect(state.status).toBe('idle');
    expect(state.error).toBeNull();
  });

  // ── fetchAutomations ────────────────────────────────────────────────────────

  describe('fetchAutomations', () => {
    it('sets status to loading when pending (from idle)', () => {
      const state = reducer(initialState, fetchAutomations.pending('', undefined));
      expect(state.status).toBe('loading');
    });

    it('does not change status from succeeded to loading on re-fetch', () => {
      const succeededState: AutomationsState = { ...initialState, status: 'succeeded' };
      const state = reducer(succeededState, fetchAutomations.pending('', undefined));
      expect(state.status).toBe('succeeded');
    });

    it('stores categories on fulfilled', () => {
      const categories = [makeAutomationCategory()];
      const state = reducer(
        initialState,
        fetchAutomations.fulfilled(categories, '', undefined),
      );
      expect(state.status).toBe('succeeded');
      expect(state.categories).toEqual(categories);
    });

    it('clears error on pending', () => {
      const errorState: AutomationsState = { ...initialState, error: 'previous error' };
      const state = reducer(errorState, fetchAutomations.pending('', undefined));
      expect(state.error).toBeNull();
    });

    it('records error and sets failed status on rejected', () => {
      const state = reducer(
        initialState,
        fetchAutomations.rejected(null, '', undefined, 'Network error'),
      );
      expect(state.status).toBe('failed');
      expect(state.error).toBe('Network error');
    });
  });

  // ── fetchApprovedTemplates ──────────────────────────────────────────────────

  describe('fetchApprovedTemplates', () => {
    it('stores approved templates on fulfilled', () => {
      const templates = [templateFactory.createApproved({ id: 'temp-approved-1' })];
      const state = reducer(
        initialState,
        fetchApprovedTemplates.fulfilled(templates, '', undefined),
      );
      expect(state.approvedTemplates).toEqual(templates);
      expect(state.approvedTemplatesStatus).toBe('succeeded');
    });

    it('sets approvedTemplatesStatus to loading on pending', () => {
      const state = reducer(initialState, fetchApprovedTemplates.pending('', undefined));
      expect(state.approvedTemplatesStatus).toBe('loading');
    });

    it('sets approvedTemplatesStatus to failed on rejected', () => {
      const state = reducer(
        initialState,
        fetchApprovedTemplates.rejected(null, '', undefined, 'error'),
      );
      expect(state.approvedTemplatesStatus).toBe('failed');
    });
  });

  // ── updateAutomation ────────────────────────────────────────────────────────

  describe('updateAutomation', () => {
    it('upserts the automation in its category on fulfilled', () => {
      const existing = makeAutomation({ id: 'auto-001', name: 'Old Name' });
      const category = makeAutomationCategory({ automations: [existing] });
      const stateWithData: AutomationsState = { ...initialState, categories: [category] };
      const updated = makeAutomation({ id: 'auto-001', name: 'New Name' });

      const state = reducer(
        stateWithData,
        updateAutomation.fulfilled(updated, '', { id: 'auto-001', input: {} }),
      );

      const found = state.categories[0].automations.find((a) => a.id === 'auto-001');
      expect(found?.name).toBe('New Name');
    });

    it('does not mutate other automations in the same category', () => {
      const auto1 = makeAutomation({ id: 'auto-001', name: 'First' });
      const auto2 = makeAutomation({ id: 'auto-002', name: 'Second', categoryId: 'order-flow' });
      const category = makeAutomationCategory({ automations: [auto1, auto2] });
      const stateWithData: AutomationsState = { ...initialState, categories: [category] };
      const updated = makeAutomation({ id: 'auto-001', name: 'Updated First' });

      const state = reducer(
        stateWithData,
        updateAutomation.fulfilled(updated, '', { id: 'auto-001', input: {} }),
      );

      const second = state.categories[0].automations.find((a) => a.id === 'auto-002');
      expect(second?.name).toBe('Second');
    });
  });

  // ── deleteAutomation ────────────────────────────────────────────────────────

  describe('deleteAutomation', () => {
    it('removes the automation from its category on fulfilled', () => {
      const auto1 = makeAutomation({ id: 'auto-001' });
      const auto2 = makeAutomation({ id: 'auto-002', categoryId: 'order-flow' });
      const category = makeAutomationCategory({ automations: [auto1, auto2] });
      const stateWithData: AutomationsState = { ...initialState, categories: [category] };

      const state = reducer(
        stateWithData,
        deleteAutomation.fulfilled('auto-001', '', 'auto-001'),
      );

      const remaining = state.categories[0].automations;
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe('auto-002');
    });
  });

  // ── toggleAutomation — optimistic update ────────────────────────────────────

  describe('toggleAutomation (optimistic)', () => {
    const stateWithActiveAuto = (): AutomationsState => ({
      ...initialState,
      categories: [
        makeAutomationCategory({
          automations: [makeAutomation({ id: 'auto-001', isActive: true })],
        }),
      ],
    });

    it('flips isActive optimistically on pending', () => {
      const state = reducer(
        stateWithActiveAuto(),
        toggleAutomation.pending('', 'auto-001'),
      );
      expect(state.categories[0].automations[0].isActive).toBe(false);
    });

    it('rolls back isActive on rejected', () => {
      // Apply pending first (optimistic flip: true → false)
      const afterPending = reducer(
        stateWithActiveAuto(),
        toggleAutomation.pending('', 'auto-001'),
      );
      expect(afterPending.categories[0].automations[0].isActive).toBe(false);

      // Then apply rejected (rollback: false → true)
      const afterRejected = reducer(
        afterPending,
        toggleAutomation.rejected(null, '', 'auto-001', 'Server error'),
      );
      expect(afterRejected.categories[0].automations[0].isActive).toBe(true);
    });

    it('syncs with server response on fulfilled', () => {
      const serverAuto = makeAutomation({ id: 'auto-001', isActive: false, name: 'Synced' });
      const state = reducer(
        stateWithActiveAuto(),
        toggleAutomation.fulfilled(serverAuto, '', 'auto-001'),
      );
      expect(state.categories[0].automations[0].isActive).toBe(false);
      expect(state.categories[0].automations[0].name).toBe('Synced');
    });
  });
});
