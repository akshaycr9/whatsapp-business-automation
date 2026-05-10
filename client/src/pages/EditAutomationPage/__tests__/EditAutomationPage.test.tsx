import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import EditAutomationPage from '@/pages/EditAutomationPage/index';
import { renderWithRedux } from '@/test/test-utils';
import { makeAutomation, makeAutomationCategory } from '@/test/factories/automation.factory';
import { templateFactory } from '@/test/factories/template.factory';
import { resetMockAutomations } from '@/test/mocks/automations.handlers';

beforeEach(() => {
  resetMockAutomations();
});

// Helper: render inside a route that provides the :id param
const renderPage = (
  automationId = 'auto-001',
  preloadedState?: Parameters<typeof renderWithRedux>[1]['preloadedState'],
) =>
  renderWithRedux(
    <Routes>
      <Route path="/automations/:id/edit" element={<EditAutomationPage />} />
      <Route path="/automations" element={<div>Automations List</div>} />
    </Routes>,
    {
      initialRoute: `/automations/${automationId}/edit`,
      preloadedState,
    },
  );

const preloadedWithAutomation = (
  templateId = '',
): Parameters<typeof renderWithRedux>[1]['preloadedState'] => ({
  automations: {
    categories: [
      makeAutomationCategory({
        automations: [
          makeAutomation({
            id: 'auto-001',
            name: 'Order Confirmed',
            isActive: true,
            shopifyEvent: 'PREPAID_ORDER_CONFIRMED',
            templateId,
            variableMapping: {},
            delayMinutes: 0,
          }),
        ],
      }),
    ],
    approvedTemplates: [
      templateFactory.createApproved({ id: 'temp-approved', name: 'Shipping Update' }),
    ],
    status: 'succeeded' as const,
    approvedTemplatesStatus: 'succeeded' as const,
    error: null,
  },
});

describe('EditAutomationPage', () => {
  describe('loading state', () => {
    it('shows a skeleton while data is loading', () => {
      const { container } = renderPage();
      expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    });
  });

  describe('form rendered with preloaded data', () => {
    it('shows the automation name in the topbar', () => {
      renderPage('auto-001', preloadedWithAutomation());
      expect(screen.getByText('Order Confirmed')).toBeInTheDocument();
    });

    it('shows the "Edit Automation" heading', () => {
      renderPage('auto-001', preloadedWithAutomation());
      expect(screen.getByText('Edit Automation')).toBeInTheDocument();
    });

    it('shows the Template section', () => {
      renderPage('auto-001', preloadedWithAutomation());
      expect(screen.getByText('Template (optional)')).toBeInTheDocument();
    });

    it('shows the Timing section', () => {
      renderPage('auto-001', preloadedWithAutomation());
      expect(screen.getByText('Timing')).toBeInTheDocument();
    });

    it('shows "Immediate" for a zero-delay automation', () => {
      renderPage('auto-001', preloadedWithAutomation());
      expect(screen.getByText('Immediate')).toBeInTheDocument();
    });

    it('renders the template dropdown with approved templates', () => {
      renderPage('auto-001', preloadedWithAutomation());
      expect(screen.getByRole('option', { name: 'Shipping Update' })).toBeInTheDocument();
    });
  });

  describe('cancel flow', () => {
    it('navigates back to the automations list when Cancel is clicked', async () => {
      renderPage('auto-001', preloadedWithAutomation());
      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      await waitFor(() =>
        expect(screen.getByText('Automations List')).toBeInTheDocument(),
      );
    });
  });

  describe('save flow', () => {
    it('navigates to the automations list after a successful save', async () => {
      renderPage('auto-001', preloadedWithAutomation('temp-approved'));
      const saveBtn = screen.getByRole('button', { name: 'Save changes' });
      await userEvent.click(saveBtn);
      await waitFor(() =>
        expect(screen.getByText('Automations List')).toBeInTheDocument(),
      );
    });

    it('shows an error message when save fails', async () => {
      const { server } = await import('@/test/mocks/server');
      const { http, HttpResponse } = await import('msw');

      server.use(
        http.put('/api/automations/:id', () =>
          HttpResponse.json({ error: { message: 'Save failed' } }, { status: 500 }),
        ),
      );

      renderPage('auto-001', preloadedWithAutomation('temp-approved'));
      await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
      await waitFor(() => expect(screen.getByText('Save failed')).toBeInTheDocument());
    });
  });

  describe('template selection', () => {
    it('shows the parameter mapping section after selecting a template with variables', async () => {
      const preloaded: Parameters<typeof renderWithRedux>[1]['preloadedState'] = {
        automations: {
          categories: [
            makeAutomationCategory({
              automations: [
                makeAutomation({ id: 'auto-001', templateId: '', variableMapping: {} }),
              ],
            }),
          ],
          approvedTemplates: [
            templateFactory.createApproved({
              id: 'temp-vars',
              name: 'Has Variables',
              components: [{ type: 'BODY', text: 'Hello {{1}}, order {{2}} shipped' }] as never,
            }),
          ],
          status: 'succeeded' as const,
          approvedTemplatesStatus: 'succeeded' as const,
          error: null,
        },
      };

      renderPage('auto-001', preloaded);
      await userEvent.selectOptions(screen.getByRole('combobox'), 'temp-vars');

      await waitFor(() =>
        expect(screen.getByText('Parameter Mapping')).toBeInTheDocument(),
      );
    });
  });
});
