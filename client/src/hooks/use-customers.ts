import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import type { Customer, PaginatedResponse, ApiResponse } from '@/types';

interface CustomerMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface SyncResult {
  created: number;
  updated: number;
  skipped: number;
}

interface CreateCustomerInput {
  phone: string;
  name?: string;
  email?: string;
  city?: string;
  tags?: string[];
}

interface UpdateCustomerInput {
  name?: string;
  email?: string;
  city?: string;
  tags?: string[];
}

const DEFAULT_META: CustomerMeta = { total: 0, page: 1, limit: 20, totalPages: 0 };

// Module-level cache — persists across component mounts for instant re-navigation
let cache: { customers: Customer[]; meta: CustomerMeta } | null = null;

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>(cache?.customers ?? []);
  const [meta, setMeta] = useState<CustomerMeta>(cache?.meta ?? DEFAULT_META);
  const [loading, setLoading] = useState(cache === null);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchCustomers = useCallback(async (searchTerm: string, pageNum: number) => {
    setIsFetching(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { page: pageNum, limit: 20 };
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const response = await api.get<PaginatedResponse<Customer>>('/customers', { params });
      const newCustomers = response.data.data;
      const newMeta = response.data.meta;
      setCustomers(newCustomers);
      setMeta(newMeta);
      // Only cache the default view (no search, page 1)
      if (!searchTerm.trim() && pageNum === 1) {
        cache = { customers: newCustomers, meta: newMeta };
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customers');
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  }, []);

  // Debounce search changes — reset to page 1
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setPage(1);
      void fetchCustomers(search, 1);
    }, 300);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [search, fetchCustomers]);

  // Fetch when page changes (but not when search changes — handled above)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    void fetchCustomers(search, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const createCustomer = useCallback(async (input: CreateCustomerInput): Promise<Customer> => {
    const response = await api.post<ApiResponse<Customer>>('/customers', input);
    cache = null; // Invalidate cache on mutation
    await fetchCustomers(search, page);
    return response.data.data;
  }, [fetchCustomers, search, page]);

  const updateCustomer = useCallback(
    async (id: string, input: UpdateCustomerInput): Promise<Customer> => {
      const response = await api.put<ApiResponse<Customer>>(`/customers/${id}`, input);
      setCustomers((prev) => prev.map((c) => (c.id === id ? response.data.data : c)));
      cache = null; // Invalidate cache on mutation
      return response.data.data;
    },
    [],
  );

  const deleteCustomer = useCallback(
    async (id: string): Promise<void> => {
      await api.delete(`/customers/${id}`);
      cache = null; // Invalidate cache on mutation
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      setMeta((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
    },
    [],
  );

  const syncFromShopify = useCallback(async (): Promise<SyncResult> => {
    const response = await api.post<ApiResponse<SyncResult>>('/customers/sync-shopify');
    cache = null; // Invalidate cache on sync
    await fetchCustomers(search, page);
    return response.data.data;
  }, [fetchCustomers, search, page]);

  const refetch = useCallback(() => {
    void fetchCustomers(search, page);
  }, [fetchCustomers, search, page]);

  return {
    customers,
    meta,
    loading,
    isFetching,
    error,
    search,
    setSearch,
    page,
    setPage,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    syncFromShopify,
    refetch,
  };
}
