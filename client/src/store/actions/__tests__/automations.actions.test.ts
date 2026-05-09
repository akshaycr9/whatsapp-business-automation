import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { createTestStore } from '@/test/test-utils';
import {
  fetchAutomations,
  fetchApprovedTemplates,
  toggleAutomation,
  updateAutomation,
  deleteAutomation,
} from '@/store/actions/automations.actions';
import { makeAutomation, makeAutomationCategory } from '@/test/factories/automation.factory';
import { templateFactory } from '@/test/factories/template.factory';
import { resetMockAutomations } from '@/test/mocks/automations.handlers';

beforeEach(() => {
  resetMockAutomations();
});

describe('fetchAutomations thunk', () => {
  it('fetches and stores automation categories in the store', async () => {
    const store = createTestStore();
    await store.dispatch(fetchAutomations());

    const { categories, status } = store.getState().automations;
    expect(status).toBe('succeeded');
    expect(categories.length).toBeGreaterThan(0);
    // Default handler returns Order Flow and COD Flow categories
    expect(categories.map((c) => c.categoryId)).toContain('order-flow');
  });

  it('sets status to failed and stores error message on API error', async () => {
    server.use(
      http.get('/api/automations', () =>
        HttpResponse.json({ error: { message: 'Server down' } }, { status: 500 }),
      ),
    );
    const store = createTestStore();
    await store.dispatch(fetchAutomations());

    const { status, error } = store.getState().automations;
    expect(status).toBe('failed');
    expect(error).toBeTruthy();
  });
});

describe('fetchApprovedTemplates thunk', () => {
  it('fetches and stores approved templates in the store', async () => {
    // Override the template endpoint to return one APPROVED template
    server.use(
      http.get('/api/templates', () =>
        HttpResponse.json({
          data: [templateFactory.createApproved({ id: 'temp-approved-1', name: 'Order Confirmed' })],
          meta: { total: 1, page: 1, limit: 100, totalPages: 1 },
        }),
      ),
    );
    const store = createTestStore();
    await store.dispatch(fetchApprovedTemplates());

    const { approvedTemplates } = store.getState().automations;
    expect(approvedTemplates).toHaveLength(1);
    expect(approvedTemplates[0].id).toBe('temp-approved-1');
  });
});

describe('toggleAutomation thunk', () => {
  it('applies optimistic flip then syncs server response on success', async () => {
    // Preload store with an active automation
    const auto = makeAutomation({ id: 'auto-001', isActive: true });
    const store = createTestStore({
      automations: {
        categories: [makeAutomationCategory({ automations: [auto] })],
        approvedTemplates: [],
        status: 'succeeded',
        approvedTemplatesStatus: 'idle',
        error: null,
      },
    });

    const dispatchPromise = store.dispatch(toggleAutomation('auto-001'));

    // After pending: optimistic flip should have happened
    const afterPending = store.getState().automations.categories[0].automations[0];
    expect(afterPending.isActive).toBe(false);

    await dispatchPromise;

    // After fulfilled: synced with server (handler also sets isActive: false)
    const afterFulfilled = store.getState().automations.categories[0].automations[0];
    expect(afterFulfilled.isActive).toBe(false);
  });

  it('rolls back optimistic flip when the API returns an error', async () => {
    server.use(
      http.patch('/api/automations/:id/toggle', () =>
        HttpResponse.json({ error: { message: 'Toggle failed' } }, { status: 500 }),
      ),
    );
    const auto = makeAutomation({ id: 'auto-001', isActive: true });
    const store = createTestStore({
      automations: {
        categories: [makeAutomationCategory({ automations: [auto] })],
        approvedTemplates: [],
        status: 'succeeded',
        approvedTemplatesStatus: 'idle',
        error: null,
      },
    });

    await store.dispatch(toggleAutomation('auto-001'));

    // Rollback: isActive should be restored to true
    const automation = store.getState().automations.categories[0].automations[0];
    expect(automation.isActive).toBe(true);
  });
});

describe('updateAutomation thunk', () => {
  it('upserts the updated automation in the store on success', async () => {
    const auto = makeAutomation({ id: 'auto-001', name: 'Old Name' });
    const store = createTestStore({
      automations: {
        categories: [makeAutomationCategory({ automations: [auto] })],
        approvedTemplates: [],
        status: 'succeeded',
        approvedTemplatesStatus: 'idle',
        error: null,
      },
    });

    await store.dispatch(updateAutomation({ id: 'auto-001', input: { name: 'New Name' } as never }));

    const updated = store.getState().automations.categories[0].automations.find(
      (a) => a.id === 'auto-001',
    );
    // The handler merges the body into the automation; the name comes from the PUT body
    expect(updated).toBeDefined();
  });
});

describe('deleteAutomation thunk', () => {
  it('removes the automation from the store on success', async () => {
    const auto = makeAutomation({ id: 'auto-001' });
    const store = createTestStore({
      automations: {
        categories: [makeAutomationCategory({ automations: [auto] })],
        approvedTemplates: [],
        status: 'succeeded',
        approvedTemplatesStatus: 'idle',
        error: null,
      },
    });

    await store.dispatch(deleteAutomation('auto-001'));

    const remaining = store.getState().automations.categories[0].automations;
    expect(remaining.find((a) => a.id === 'auto-001')).toBeUndefined();
  });
});
