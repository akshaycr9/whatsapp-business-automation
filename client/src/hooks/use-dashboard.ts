import { useEffect, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  fetchDashboard,
  fetchDashboardStats,
  selectDashboardStats,
  selectDashboardActivity,
  selectDashboardStatus,
  selectDashboardIsFetching,
  selectDashboardError,
} from '@/features/dashboard/dashboardSlice';
import type { DashboardStats, ActivityItem } from '@/types/dashboard';

export interface UseDashboardReturn {
  stats: DashboardStats | null;
  activity: ActivityItem[];
  loading: boolean;
  isFetching: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDashboard(): UseDashboardReturn {
  const dispatch = useAppDispatch();
  const stats = useAppSelector(selectDashboardStats);
  const activity = useAppSelector(selectDashboardActivity);
  const status = useAppSelector(selectDashboardStatus);
  const isFetching = useAppSelector(selectDashboardIsFetching);
  const error = useAppSelector(selectDashboardError);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initial load — always fetch (stale-while-revalidate pattern)
  useEffect(() => {
    void dispatch(fetchDashboard());
  }, [dispatch]);

  // Auto-refresh stats every 30 seconds — interval is a side effect, not state
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      void dispatch(fetchDashboardStats());
    }, 30_000);
    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, [dispatch]);

  const refetch = useCallback(async (): Promise<void> => {
    await dispatch(fetchDashboard());
  }, [dispatch]);

  return {
    stats,
    activity,
    loading: status === 'loading',
    isFetching,
    error,
    refetch,
  };
}
