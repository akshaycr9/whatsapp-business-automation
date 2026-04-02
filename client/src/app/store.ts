import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/features/auth/authSlice';
import conversationsReducer from '@/features/conversations/conversationsSlice';
import messagesReducer from '@/features/messages/messagesSlice';
import templatesReducer from '@/features/templates/templatesSlice';
import automationsReducer from '@/features/automations/automationsSlice';
import customersReducer from '@/features/customers/customersSlice';
import dashboardReducer from '@/features/dashboard/dashboardSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    conversations: conversationsReducer,
    messages: messagesReducer,
    templates: templatesReducer,
    automations: automationsReducer,
    customers: customersReducer,
    dashboard: dashboardReducer,
  },
});

// Infer types from store — never write these manually
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
