import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import AutomationsPage from '@/pages/AutomationsPage/index';
import { renderWithRedux } from '@/test/test-utils';
import { resetMockAutomations } from '@/test/mocks/automations.handlers';

beforeEach(() => {
  resetMockAutomations();
});

// Helper: render the page inside a route so react-router hooks work correctly
const renderPage = (preloadedState?: Parameters<typeof renderWithRedux>[1]['preloadedState']) =>
  renderWithRedux(
    <Routes>
      <Route path="/automations" element={<AutomationsPage />} />
      <Route path="/automations/:id/edit" element={<div>Edit Page</div>} />
    </Routes>,
    { initialRoute: '/automations', preloadedState },
  );

describe('AutomationsPage', () => {
  describe('loading state', () => {
    it('shows skeleton cards before data arrives', () => {
      const { container } = renderPage();
      // Three skeleton cards are rendered while loading
      expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    });
  });

  describe('data loaded state', () => {
    it('shows category names in the sidebar once data loads', async () => {
      renderPage();
      await waitFor(() => expect(screen.getByText('Order Flow')).toBeInTheDocument());
      expect(screen.getByText('COD Flow')).toBeInTheDocument();
    });

    it('shows automations from the first category by default', async () => {
      renderPage();
      await waitFor(() => expect(screen.getByText('Order Confirmed')).toBeInTheDocument());
    });

    it('shows the active/paused status chip with correct counts', async () => {
      renderPage();
      // Order Flow has 1 active (auto-001) and 1 paused (auto-002)
      await waitFor(() =>
        expect(screen.getByText(/1 active · 1 paused/i)).toBeInTheDocument(),
      );
    });
  });

  describe('category switching', () => {
    it('switches to the selected category automations when a sidebar button is clicked', async () => {
      renderPage();
      await waitFor(() => expect(screen.getByText('Order Flow')).toBeInTheDocument());

      await userEvent.click(screen.getByRole('button', { name: /cod flow/i }));

      await waitFor(() => expect(screen.getByText('COD Confirmation')).toBeInTheDocument());
    });
  });

  describe('edit navigation', () => {
    it('navigates to the edit page when Edit is clicked on an automation', async () => {
      renderPage();
      await waitFor(() => expect(screen.getByText('Order Confirmed')).toBeInTheDocument());

      // Click the Edit button on the first card
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await userEvent.click(editButtons[0]);

      // The stub edit route renders "Edit Page"
      await waitFor(() => expect(screen.getByText('Edit Page')).toBeInTheDocument());
    });
  });

  describe('toggle interaction', () => {
    it('optimistically flips the Paused badge on toggle', async () => {
      renderPage();
      // auto-002 is paused — it shows a Paused badge initially
      await waitFor(() => expect(screen.getByText('Paused')).toBeInTheDocument());

      // Scope to the card containing the paused automation and click its toggle
      const card = screen.getByText('Order Cancelled').closest('[style]') as HTMLElement;
      const toggleButton = within(card).getAllByRole('button')[0];
      await userEvent.click(toggleButton);

      // Optimistic update: Paused badge should disappear immediately
      await waitFor(() => expect(screen.queryByText('Paused')).not.toBeInTheDocument());
    });
  });

  describe('error state', () => {
    it('shows an error banner when the API call fails', async () => {
      const { server } = await import('@/test/mocks/server');
      const { http, HttpResponse } = await import('msw');

      server.use(
        http.get('/api/automations', () =>
          HttpResponse.json({ error: { message: 'Server error' } }, { status: 500 }),
        ),
      );

      renderPage();
      await waitFor(() =>
        expect(screen.getByText(/failed to load automations/i)).toBeInTheDocument(),
      );
    });
  });
});
