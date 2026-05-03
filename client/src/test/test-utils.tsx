import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { configureStore, PreloadedState } from '@reduxjs/toolkit';
import { RootState } from '@/app/store';

// Import all slices
import authReducer from '@/features/auth/authSlice';
import conversationsReducer from '@/features/conversations/conversationsSlice';
import messagesReducer from '@/features/messages/messagesSlice';
import templatesReducer from '@/features/templates/templatesSlice';
import automationsReducer from '@/features/automations/automationsSlice';
import customersReducer from '@/features/customers/customersSlice';
import dashboardReducer from '@/features/dashboard/dashboardSlice';

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  preloadedState?: PreloadedState<RootState>;
  store?: any;
  initialRoute?: string;
}

export function createTestStore(preloadedState?: PreloadedState<RootState>) {
  return configureStore({
    reducer: {
      auth: authReducer,
      conversations: conversationsReducer,
      messages: messagesReducer,
      templates: templatesReducer,
      automations: automationsReducer,
      customers: customersReducer,
      dashboard: dashboardReducer,
    },
    preloadedState,
  });
}

export function renderWithRedux(
  ui: ReactElement,
  {
    preloadedState = {},
    store = createTestStore(preloadedState),
    initialRoute = '/',
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <MemoryRouter initialEntries={[initialRoute]}>
          {children}
        </MemoryRouter>
      </Provider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    store,
  };
}

export function renderWithRouter(
  ui: ReactElement,
  {
    initialRoute = '/',
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MemoryRouter initialEntries={[initialRoute]}>
        {children}
      </MemoryRouter>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Re-export everything from testing library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// Export store type
export type { RootState } from '@/app/store';
export type { AppDispatch } from '@/app/store';
