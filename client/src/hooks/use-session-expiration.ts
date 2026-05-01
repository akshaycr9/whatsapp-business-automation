import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { logoutUser } from '@/lib/socket';

/**
 * Global hook — mounted once in App.tsx (AppShellLayout).
 *
 * Listens for session expiration events from the socket.io connection.
 * When a token is expired or invalid, the socket will emit a connect_error event.
 * This hook detects that error and automatically logs out the user, showing
 * an error message asking them to log back in.
 */
export function useSessionExpiration(): void {
  const { toast } = useToast();

  useEffect(() => {
    const handleSessionExpired = () => {
      // Show error toast
      toast({
        variant: 'destructive',
        title: 'Session Expired',
        description: 'Your login session has expired. Please log in again.',
      });

      // Wait a moment for the toast to be visible, then log out
      setTimeout(() => {
        logoutUser();
      }, 500);
    };

    // Listen for session expiration event from socket
    window.addEventListener('session-expired', handleSessionExpired);

    return () => {
      window.removeEventListener('session-expired', handleSessionExpired);
    };
  }, [toast]);
}
