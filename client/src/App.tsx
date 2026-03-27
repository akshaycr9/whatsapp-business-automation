import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useGlobalNotifications } from '@/hooks/use-global-notifications';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import DashboardPage from '@/pages/DashboardPage';
import ConversationsPage from '@/pages/ConversationsPage';
import TemplatesPage from '@/pages/TemplatesPage';
import AutomationsPage from '@/pages/AutomationsPage';
import CustomersPage from '@/pages/CustomersPage';

export default function App() {
  useEffect(() => {
    connectSocket();
    return () => disconnectSocket();
  }, []);

  useGlobalNotifications();

  return (
    <TooltipProvider delayDuration={300}>
    <BrowserRouter>
      <AppShell>
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
      </AppShell>
    </BrowserRouter>
    </TooltipProvider>
  );
}
