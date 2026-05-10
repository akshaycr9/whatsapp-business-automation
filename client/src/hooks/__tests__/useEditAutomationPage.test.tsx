import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { useEditAutomationPage } from '@/hooks/useEditAutomationPage';
import { createTestStore } from '@/test/test-utils';
import { makeAutomation, makeAutomationCategory } from '@/test/factories/automation.factory';
import { templateFactory } from '@/test/factories/template.factory';
import { resetMockAutomations } from '@/test/mocks/automations.handlers';

beforeEach(() => {
  resetMockAutomations();
});

// Wrapper that provides the `:id` route param required by useEditAutomationPage
const buildWrapper =
  (store = createTestStore(), automationId = 'auto-001') =>
  ({ children }: { children: React.ReactNode }) =>
    (
      <Provider store={store}>
        <MemoryRouter initialEntries={[`/automations/${automationId}/edit`]}>
          <Routes>
            <Route path="/automations/:id/edit" element={<>{children}</>} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );

const makeStoreWithAutomation = (automationId = 'auto-001') =>
  createTestStore({
    automations: {
      categories: [
        makeAutomationCategory({
          automations: [
            makeAutomation({
              id: automationId,
              name: 'Order Confirmed',
              isActive: true,
              templateId: 'temp-001',
              variableMapping: { '1': 'name' },
              delayMinutes: 60,
            }),
          ],
        }),
      ],
      approvedTemplates: [templateFactory.createApproved({ id: 'temp-001', name: 'My Template' })],
      status: 'succeeded',
      approvedTemplatesStatus: 'succeeded',
      error: null,
    },
  });

describe('useEditAutomationPage', () => {
  describe('initial state with preloaded automation', () => {
    it('returns the automation name once data is available', () => {
      const store = makeStoreWithAutomation();
      const { result } = renderHook(() => useEditAutomationPage(), {
        wrapper: buildWrapper(store),
      });
      expect(result.current.automationName).toBe('Order Confirmed');
    });

    it('initializes selectedTemplateId from the automation', () => {
      const store = makeStoreWithAutomation();
      const { result } = renderHook(() => useEditAutomationPage(), {
        wrapper: buildWrapper(store),
      });
      waitFor(() => expect(result.current.selectedTemplateId).toBe('temp-001'));
    });

    it('initializes varMapping from the automation', () => {
      const store = makeStoreWithAutomation();
      const { result } = renderHook(() => useEditAutomationPage(), {
        wrapper: buildWrapper(store),
      });
      waitFor(() => expect(result.current.varMapping).toEqual({ '1': 'name' }));
    });

    it('returns loading=false when data is preloaded', () => {
      const store = makeStoreWithAutomation();
      const { result } = renderHook(() => useEditAutomationPage(), {
        wrapper: buildWrapper(store),
      });
      expect(result.current.loading).toBe(false);
    });

    it('returns approvedTemplates from the store', () => {
      const store = makeStoreWithAutomation();
      const { result } = renderHook(() => useEditAutomationPage(), {
        wrapper: buildWrapper(store),
      });
      expect(result.current.approvedTemplates).toHaveLength(1);
    });
  });

  describe('timing derivations', () => {
    it('showTimingSelect is false for non-timing events', () => {
      const store = makeStoreWithAutomation();
      const { result } = renderHook(() => useEditAutomationPage(), {
        wrapper: buildWrapper(store),
      });
      expect(result.current.showTimingSelect).toBe(false);
    });

    it('showTimingSelect is true for ABANDONED_CART events', () => {
      const store = createTestStore({
        automations: {
          categories: [
            makeAutomationCategory({
              automations: [
                makeAutomation({ id: 'auto-001', shopifyEvent: 'ABANDONED_CART_1' }),
              ],
            }),
          ],
          approvedTemplates: [],
          status: 'succeeded',
          approvedTemplatesStatus: 'succeeded',
          error: null,
        },
      });
      const { result } = renderHook(() => useEditAutomationPage(), {
        wrapper: buildWrapper(store),
      });
      expect(result.current.showTimingSelect).toBe(true);
      expect(result.current.isAbandonedCart).toBe(true);
    });

    it('isCODFollowUp is true for COD_ORDER_FOLLOW_UP event', () => {
      const store = createTestStore({
        automations: {
          categories: [
            makeAutomationCategory({
              automations: [
                makeAutomation({ id: 'auto-001', shopifyEvent: 'COD_ORDER_FOLLOW_UP' }),
              ],
            }),
          ],
          approvedTemplates: [],
          status: 'succeeded',
          approvedTemplatesStatus: 'succeeded',
          error: null,
        },
      });
      const { result } = renderHook(() => useEditAutomationPage(), {
        wrapper: buildWrapper(store),
      });
      expect(result.current.isCODFollowUp).toBe(true);
      expect(result.current.showTimingSelect).toBe(true);
    });
  });

  describe('handlers', () => {
    it('handleTemplateChange updates selectedTemplateId', () => {
      const store = makeStoreWithAutomation();
      const { result } = renderHook(() => useEditAutomationPage(), {
        wrapper: buildWrapper(store),
      });

      act(() => {
        result.current.handleTemplateChange('temp-new');
      });

      expect(result.current.selectedTemplateId).toBe('temp-new');
    });

    it('handlePathChange updates the varMapping for the given key', () => {
      const store = makeStoreWithAutomation();
      const { result } = renderHook(() => useEditAutomationPage(), {
        wrapper: buildWrapper(store),
      });

      act(() => {
        result.current.handlePathChange('2', 'total_price');
      });

      waitFor(() => expect(result.current.varMapping['2']).toBe('total_price'));
    });

    it('handleDelayChange updates selectedDelay', () => {
      const store = makeStoreWithAutomation();
      const { result } = renderHook(() => useEditAutomationPage(), {
        wrapper: buildWrapper(store),
      });

      act(() => {
        result.current.handleDelayChange(180);
      });

      expect(result.current.selectedDelay).toBe(180);
    });

    it('handleSave sets error when automation is not found', async () => {
      // Store has no automation matching the id
      const store = createTestStore({
        automations: {
          categories: [],
          approvedTemplates: [],
          status: 'succeeded',
          approvedTemplatesStatus: 'succeeded',
          error: null,
        },
      });
      const { result } = renderHook(() => useEditAutomationPage(), {
        wrapper: buildWrapper(store),
      });

      await act(async () => {
        await result.current.handleSave();
      });

      expect(result.current.error).toBe('Automation not found');
    });
  });

  describe('automationNotFound', () => {
    it('is false when automation exists in the store', () => {
      const store = makeStoreWithAutomation();
      const { result } = renderHook(() => useEditAutomationPage(), {
        wrapper: buildWrapper(store),
      });
      expect(result.current.automationNotFound).toBe(false);
    });

    it('is true when automation is absent and loading is false', () => {
      const store = createTestStore({
        automations: {
          categories: [],
          approvedTemplates: [],
          status: 'succeeded',
          approvedTemplatesStatus: 'succeeded',
          error: null,
        },
      });
      const { result } = renderHook(() => useEditAutomationPage(), {
        wrapper: buildWrapper(store),
      });
      expect(result.current.automationNotFound).toBe(true);
    });
  });
});
