import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useGlobalNotifications } from '@/hooks/use-global-notifications';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import DashboardPage from '@/pages/DashboardPage';
import ConversationsPage from '@/pages/ConversationsPage';
import TemplatesPage from '@/pages/TemplatesPage';
import AutomationsPage from '@/pages/AutomationsPage';
import CustomersPage from '@/pages/CustomersPage';
import LoginPage from '@/pages/LoginPage';

// Layout wrapper that connects the socket and starts notification listener.
// Placed inside <ProtectedRoute> so it only runs when the user is authenticated.
function AppShellLayout() {
  useEffect(() => {
    connectSocket();
    return () => disconnectSocket();
  }, []);

  useGlobalNotifications();

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <TooltipProvider delayDuration={300}>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected — all app routes require a valid JWT */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppShellLayout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/conversations" element={<ConversationsPage />} />
                <Route path="/conversations/:id" element={<ConversationsPage />} />
                <Route path="/templates" element={<TemplatesPage />} />
                <Route path="/automations" element={<AutomationsPage />} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  );
}
