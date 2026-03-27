import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { socket } from '@/lib/socket';
import type { ApiResponse } from '@/types';
import type { DashboardStats, ActivityItem } from '@/types/dashboard';

// Module-level cache — persists across component mounts for instant re-navigation
let cachedStats: DashboardStats | null = null;
let cachedActivity: ActivityItem[] = [];

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(cachedStats);
  const [activity, setActivity] = useState<ActivityItem[]>(cachedActivity);
  const [loading, setLoading] = useState(cachedStats === null);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStats = useCallback(async (): Promise<void> => {
    try {
      const response = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
      cachedStats = response.data.data;
      setStats(response.data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard stats');
    }
  }, []);

  const fetchActivity = useCallback(async (): Promise<void> => {
    try {
      const response = await api.get<ApiResponse<ActivityItem[]>>('/dashboard/activity?limit=20');
      cachedActivity = response.data.data;
      setActivity(response.data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recent activity');
    }
  }, []);

  const refetch = useCallback(async (): Promise<void> => {
    setError(null);
    setIsFetching(true);
    try {
      await Promise.all([fetchStats(), fetchActivity()]);
    } finally {
      setIsFetching(false);
    }
  }, [fetchStats, fetchActivity]);

  // Initial load — background-refresh even if cache exists (stale-while-revalidate)
  useEffect(() => {
    if (cachedStats === null) setLoading(true);
    setIsFetching(true);
    Promise.all([fetchStats(), fetchActivity()]).finally(() => {
      setLoading(false);
      setIsFetching(false);
    });
  }, [fetchStats, fetchActivity]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      void fetchStats();
    }, 30_000);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchStats]);

  // Socket-driven refresh on new messages or automation events
  useEffect(() => {
    const handleRefresh = () => {
      void fetchStats();
    };

    socket.on('new_message', handleRefresh);
    socket.on('automation_triggered', handleRefresh);

    return () => {
      socket.off('new_message', handleRefresh);
      socket.off('automation_triggered', handleRefresh);
    };
  }, [fetchStats]);

  return { stats, activity, loading, isFetching, error, refetch };
}
