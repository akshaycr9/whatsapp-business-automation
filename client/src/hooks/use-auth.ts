import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { loginThunk, logout, selectIsAuthenticated } from '@/features/auth/authSlice';

export interface UseAuthReturn {
  isAuthenticated: boolean;
  /** Always false — token is hydrated synchronously from localStorage at store init. */
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export function useAuth(): UseAuthReturn {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const login = useCallback(
    async (username: string, password: string): Promise<void> => {
      const result = await dispatch(loginThunk({ username, password }));
      if (loginThunk.rejected.match(result)) {
        throw new Error((result.payload as string | undefined) ?? 'Login failed');
      }
    },
    [dispatch],
  );

  const handleLogout = useCallback(() => {
    dispatch(logout());
  }, [dispatch]);

  return {
    isAuthenticated,
    isLoading: false,
    login,
    logout: handleLogout,
  };
}
