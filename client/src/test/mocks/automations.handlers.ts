import { http, HttpResponse } from 'msw';
import type { AutomationCategoryGroup } from '@/types';
import {
  makeAutomation,
  makeAutomationCategory,
  makeAutomationLog,
} from '../factories/automation.factory';

// ── Default data ──────────────────────────────────────────────────────────────

const buildDefaultCategories = (): AutomationCategoryGroup[] => [
  makeAutomationCategory({
    categoryId: 'order-flow',
    categoryName: 'Order Flow',
    automations: [
      makeAutomation({ id: 'auto-001', name: 'Order Confirmed', isActive: true }),
      makeAutomation({
        id: 'auto-002',
        name: 'Order Cancelled',
        isActive: false,
        shopifyEvent: 'ORDER_CANCELLED',
        categoryId: 'order-flow',
      }),
    ],
  }),
  makeAutomationCategory({
    categoryId: 'cod-flow',
    categoryName: 'COD Flow',
    automations: [
      makeAutomation({
        id: 'auto-003',
        name: 'COD Confirmation',
        isActive: true,
        shopifyEvent: 'COD_ORDER_CONFIRMATION',
        categoryId: 'cod-flow',
      }),
    ],
  }),
];

let mockCategories = buildDefaultCategories();

// ── Handlers ──────────────────────────────────────────────────────────────────

export const automationHandlers = [
  http.get('/api/automations', () => {
    return HttpResponse.json({ data: mockCategories });
  }),

  http.post('/api/automations', async ({ request }) => {
    const body = (await request.json()) as Partial<ReturnType<typeof makeAutomation>>;
    const created = makeAutomation({ id: `auto-${Date.now()}`, ...body });
    return HttpResponse.json({ data: created }, { status: 201 });
  }),

  http.put('/api/automations/:id', async ({ params, request }) => {
    const { id } = params as { id: string };
    const body = (await request.json()) as Partial<ReturnType<typeof makeAutomation>>;
    for (const category of mockCategories) {
      const idx = category.automations.findIndex((a) => a.id === id);
      if (idx !== -1) {
        category.automations[idx] = { ...category.automations[idx], ...body };
        return HttpResponse.json({ data: category.automations[idx] });
      }
    }
    return HttpResponse.json({ error: { message: 'Not found' } }, { status: 404 });
  }),

  http.patch('/api/automations/:id/toggle', ({ params }) => {
    const { id } = params as { id: string };
    for (const category of mockCategories) {
      const automation = category.automations.find((a) => a.id === id);
      if (automation) {
        automation.isActive = !automation.isActive;
        return HttpResponse.json({ data: { ...automation } });
      }
    }
    return HttpResponse.json({ error: { message: 'Not found' } }, { status: 404 });
  }),

  http.delete('/api/automations/:id', ({ params }) => {
    const { id } = params as { id: string };
    for (const category of mockCategories) {
      category.automations = category.automations.filter((a) => a.id !== id);
    }
    return new HttpResponse(null, { status: 204 });
  }),

  http.get('/api/automations/:id/logs', ({ params }) => {
    const { id } = params as { id: string };
    return HttpResponse.json({
      data: [makeAutomationLog({ automationId: id })],
      meta: { total: 1 },
    });
  }),
];

// ── Test helpers ──────────────────────────────────────────────────────────────

export function resetMockAutomations(): void {
  mockCategories = buildDefaultCategories();
}

export function setMockAutomations(categories: AutomationCategoryGroup[]): void {
  mockCategories = categories;
}
