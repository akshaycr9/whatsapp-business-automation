import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { Automation, AutomationLog, Template, PaginatedResponse, ApiResponse } from '@/types';

interface AutomationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateAutomationInput {
  name: string;
  shopifyEvent: 'PREPAID_ORDER_CONFIRMED' | 'COD_ORDER_CONFIRMED' | 'ORDER_FULFILLED' | 'ABANDONED_CART';
  templateId: string;
  variableMapping: Record<string, string>;
  isActive: boolean;
  delayMinutes: number;
}

export function useAutomations() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [approvedTemplates, setApprovedTemplates] = useState<Template[]>([]);
  const [meta, setMeta] = useState<AutomationMeta>({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const fetchAutomations = useCallback(async (pageNum: number): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<PaginatedResponse<Automation>>('/automations', {
        params: { page: pageNum, limit: 20 },
      });
      setAutomations(response.data.data);
      setMeta(response.data.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load automations');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchApprovedTemplates = useCallback(async (): Promise<void> => {
    try {
      const response = await api.get<PaginatedResponse<Template>>('/templates', {
        params: { status: 'APPROVED', limit: 100 },
      });
      setApprovedTemplates(response.data.data);
    } catch {
      // Non-critical — templates list failing shouldn't block the page
    }
  }, []);

  useEffect(() => {
    void fetchAutomations(1);
    void fetchApprovedTemplates();
  }, [fetchAutomations, fetchApprovedTemplates]);

  useEffect(() => {
    void fetchAutomations(page);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const createAutomation = useCallback(
    async (input: CreateAutomationInput): Promise<Automation> => {
      const response = await api.post<ApiResponse<Automation>>('/automations', input);
      await fetchAutomations(page);
      return response.data.data;
    },
    [fetchAutomations, page],
  );

  const updateAutomation = useCallback(
    async (id: string, input: Partial<CreateAutomationInput>): Promise<Automation> => {
      const response = await api.put<ApiResponse<Automation>>(`/automations/${id}`, input);
      const updated = response.data.data;
      setAutomations((prev) => prev.map((a) => (a.id === id ? { ...a, ...updated } : a)));
      return updated;
    },
    [],
  );

  const removeAutomation = useCallback(async (id: string): Promise<void> => {
    await api.delete(`/automations/${id}`);
    setAutomations((prev) => prev.filter((a) => a.id !== id));
    setMeta((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
  }, []);

  const toggleAutomation = useCallback(async (id: string): Promise<Automation> => {
    // Optimistic update
    setAutomations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a)),
    );
    try {
      const response = await api.patch<ApiResponse<Automation>>(`/automations/${id}/toggle`);
      const updated = response.data.data;
      setAutomations((prev) => prev.map((a) => (a.id === id ? { ...a, ...updated } : a)));
      return updated;
    } catch (err) {
      // Revert optimistic update on failure
      setAutomations((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a)),
      );
      throw err;
    }
  }, []);

  const fetchLogs = useCallback(
    async (
      automationId: string,
      logsPage = 1,
    ): Promise<{ items: AutomationLog[]; meta: AutomationMeta }> => {
      const response = await api.get<{ data: AutomationLog[]; meta: AutomationMeta }>(
        `/automations/${automationId}/logs`,
        { params: { page: logsPage, limit: 20 } },
      );
      return { items: response.data.data, meta: response.data.meta };
    },
    [],
  );

  const refetch = useCallback(() => {
    void fetchAutomations(page);
  }, [fetchAutomations, page]);

  return {
    automations,
    approvedTemplates,
    meta,
    loading,
    error,
    page,
    setPage,
    createAutomation,
    updateAutomation,
    removeAutomation,
    toggleAutomation,
    fetchLogs,
    refetch,
  };
}
