import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageLoader } from '@/components/layout/PageLoader';
import { connectSocket, disconnectSocket } from '@/lib/socket';

const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const ConversationsPage = lazy(() => import('@/pages/ConversationsPage'));
const TemplatesPage = lazy(() => import('@/pages/TemplatesPage'));
const AutomationsPage = lazy(() => import('@/pages/AutomationsPage'));
const CustomersPage = lazy(() => import('@/pages/CustomersPage'));

export default function App() {
  useEffect(() => {
    connectSocket();
    return () => disconnectSocket();
  }, []);

  return (
    <BrowserRouter>
      <AppShell>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/conversations" element={<ConversationsPage />} />
            <Route path="/conversations/:id" element={<ConversationsPage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/automations" element={<AutomationsPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </AppShell>
    </BrowserRouter>
  );
}
