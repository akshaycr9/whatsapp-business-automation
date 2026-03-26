import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import type { Template, PaginatedResponse, ApiResponse } from '@/types';

interface TemplateMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type StatusFilter = 'all' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface TemplateButtonInput {
  type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | 'COPY_CODE';
  text: string;
  url?: string;
  phone_number?: string;
  /** Example value for dynamic URL {{1}} or COPY_CODE */
  example?: string;
}

export interface TemplateComponentInput {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
  format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  text?: string;
  /** Sample values for {{1}}, {{2}}, … — required by Meta when variables present */
  example?: string[];
  buttons?: TemplateButtonInput[];
}

export interface CreateTemplateInput {
  name: string;
  language: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  components: TemplateComponentInput[];
}

interface SyncAllResult {
  synced: number;
}

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [meta, setMeta] = useState<TemplateMeta>({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchTemplates = useCallback(
    async (searchTerm: string, pageNum: number, status: StatusFilter) => {
      setLoading(true);
      setError(null);
      try {
        const params: Record<string, string | number> = { page: pageNum, limit: 20 };
        if (searchTerm.trim()) params['search'] = searchTerm.trim();
        if (status !== 'all') params['status'] = status;

        const response = await api.get<PaginatedResponse<Template>>('/templates', { params });
        setTemplates(response.data.data);
        setMeta(response.data.meta);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load templates');
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Debounce search changes — reset to page 1
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setPage(1);
      void fetchTemplates(search, 1, statusFilter);
    }, 300);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [search, statusFilter, fetchTemplates]);

  // Fetch when page changes
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    void fetchTemplates(search, page, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const createTemplate = useCallback(
    async (input: CreateTemplateInput): Promise<Template> => {
      const response = await api.post<ApiResponse<Template>>('/templates', input);
      await fetchTemplates(search, page, statusFilter);
      return response.data.data;
    },
    [fetchTemplates, search, page, statusFilter],
  );

  const removeTemplate = useCallback(
    async (id: string): Promise<void> => {
      await api.delete(`/templates/${id}`);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      setMeta((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
    },
    [],
  );

  const syncOne = useCallback(async (id: string): Promise<Template> => {
    const response = await api.post<ApiResponse<Template>>(`/templates/${id}/sync`);
    const updated = response.data.data;
    setTemplates((prev) => prev.map((t) => (t.id === id ? updated : t)));
    return updated;
  }, []);

  const syncAll = useCallback(async (): Promise<SyncAllResult> => {
    const response = await api.post<ApiResponse<SyncAllResult>>('/templates/sync-all');
    await fetchTemplates(search, page, statusFilter);
    return response.data.data;
  }, [fetchTemplates, search, page, statusFilter]);

  const refetch = useCallback(() => {
    void fetchTemplates(search, page, statusFilter);
  }, [fetchTemplates, search, page, statusFilter]);

  return {
    templates,
    meta,
    loading,
    error,
    statusFilter,
    setStatusFilter,
    search,
    setSearch,
    page,
    setPage,
    createTemplate,
    removeTemplate,
    syncOne,
    syncAll,
    refetch,
  };
}
