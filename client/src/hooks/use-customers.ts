import { useEffect, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  fetchCustomers,
  createCustomer as createCustomerThunk,
  updateCustomer as updateCustomerThunk,
  deleteCustomer as deleteCustomerThunk,
  syncCustomersFromShopify,
  setSearch,
  setPage,
  selectCustomers,
  selectCustomersMeta,
  selectCustomersStatus,
  selectCustomersError,
  selectCustomersSearch,
  selectCustomersPage,
  type CreateCustomerInput,
  type UpdateCustomerInput,
  type SyncResult,
} from '@/features/customers/customersSlice';
import type { Customer } from '@/types';

export type { CreateCustomerInput, UpdateCustomerInput, SyncResult };

interface CustomerMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UseCustomersReturn {
  customers: Customer[];
  meta: CustomerMeta;
  loading: boolean;
  isFetching: boolean;
  error: string | null;
  search: string;
  setSearch: (value: string) => void;
  page: number;
  setPage: (value: number) => void;
  createCustomer: (input: CreateCustomerInput) => Promise<Customer>;
  updateCustomer: (id: string, input: UpdateCustomerInput) => Promise<Customer>;
  deleteCustomer: (id: string) => Promise<void>;
  syncFromShopify: () => Promise<SyncResult>;
  refetch: () => void;
}

export function useCustomers(): UseCustomersReturn {
  const dispatch = useAppDispatch();
  const customers = useAppSelector(selectCustomers);
  const meta = useAppSelector(selectCustomersMeta);
  const status = useAppSelector(selectCustomersStatus);
  const error = useAppSelector(selectCustomersError);
  const search = useAppSelector(selectCustomersSearch);
  const page = useAppSelector(selectCustomersPage);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  // Initial fetch on mount
  useEffect(() => {
    if (status === 'idle') {
      void dispatch(fetchCustomers({ search: '', page: 1 }));
    }
  }, [status, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounce search changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void dispatch(fetchCustomers({ search, page: 1 }));
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch when page changes (skip first render)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    void dispatch(fetchCustomers({ search, page }));
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSetSearch = useCallback(
    (value: string) => {
      dispatch(setSearch(value)); // also resets page to 1 in the slice
    },
    [dispatch],
  );

  const handleSetPage = useCallback(
    (value: number) => {
      dispatch(setPage(value));
    },
    [dispatch],
  );

  const handleCreateCustomer = useCallback(
    async (input: CreateCustomerInput): Promise<Customer> => {
      const result = await dispatch(createCustomerThunk(input));
      if (createCustomerThunk.rejected.match(result)) {
        throw new Error((result.payload as string | undefined) ?? 'Failed to create customer');
      }
      await dispatch(fetchCustomers({ search, page }));
      return result.payload as Customer;
    },
    [dispatch, search, page],
  );

  const handleUpdateCustomer = useCallback(
    async (id: string, input: UpdateCustomerInput): Promise<Customer> => {
      const result = await dispatch(updateCustomerThunk({ id, input }));
      if (updateCustomerThunk.rejected.match(result)) {
        throw new Error((result.payload as string | undefined) ?? 'Failed to update customer');
      }
      return result.payload as Customer;
    },
    [dispatch],
  );

  const handleDeleteCustomer = useCallback(
    async (id: string): Promise<void> => {
      const result = await dispatch(deleteCustomerThunk(id));
      if (deleteCustomerThunk.rejected.match(result)) {
        throw new Error((result.payload as string | undefined) ?? 'Failed to delete customer');
      }
    },
    [dispatch],
  );

  const handleSyncFromShopify = useCallback(async (): Promise<SyncResult> => {
    const result = await dispatch(syncCustomersFromShopify());
    if (syncCustomersFromShopify.rejected.match(result)) {
      throw new Error((result.payload as string | undefined) ?? 'Failed to sync from Shopify');
    }
    await dispatch(fetchCustomers({ search, page }));
    return result.payload as SyncResult;
  }, [dispatch, search, page]);

  const refetch = useCallback(() => {
    void dispatch(fetchCustomers({ search, page }));
  }, [dispatch, search, page]);

  return {
    customers,
    meta,
    loading: status === 'loading',
    isFetching: status === 'loading' && customers.length > 0,
    error,
    search,
    setSearch: handleSetSearch,
    page,
    setPage: handleSetPage,
    createCustomer: handleCreateCustomer,
    updateCustomer: handleUpdateCustomer,
    deleteCustomer: handleDeleteCustomer,
    syncFromShopify: handleSyncFromShopify,
    refetch,
  };
}
