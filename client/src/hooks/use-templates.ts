import { useEffect, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  fetchTemplates,
  createTemplate as createTemplateThunk,
  deleteTemplate as deleteTemplateThunk,
  syncTemplate as syncTemplateThunk,
  syncAllTemplates as syncAllTemplatesThunk,
  setSearch,
  setStatusFilter,
  setPage,
  selectTemplates,
  selectTemplatesMeta,
  selectTemplatesStatus,
  selectTemplatesError,
  selectTemplatesSearch,
  selectTemplatesStatusFilter,
  selectTemplatesPage,
  type StatusFilter,
  type CreateTemplateInput,
} from '@/features/templates/templatesSlice';
import type { Template } from '@/types';

export type {
  StatusFilter,
  CreateTemplateInput,
  TemplateComponentInput,
  TemplateButtonInput,
} from '@/features/templates/templatesSlice';

interface TemplateMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UseTemplatesReturn {
  templates: Template[];
  meta: TemplateMeta;
  loading: boolean;
  isFetching: boolean;
  error: string | null;
  statusFilter: StatusFilter;
  setStatusFilter: (value: StatusFilter) => void;
  search: string;
  setSearch: (value: string) => void;
  page: number;
  setPage: (value: number) => void;
  createTemplate: (input: CreateTemplateInput) => Promise<Template>;
  removeTemplate: (id: string) => Promise<void>;
  syncOne: (id: string) => Promise<Template>;
  syncAll: () => Promise<{ synced: number }>;
  refetch: () => void;
}

export function useTemplates(): UseTemplatesReturn {
  const dispatch = useAppDispatch();
  const templates = useAppSelector(selectTemplates);
  const meta = useAppSelector(selectTemplatesMeta);
  const status = useAppSelector(selectTemplatesStatus);
  const error = useAppSelector(selectTemplatesError);
  const search = useAppSelector(selectTemplatesSearch);
  const statusFilter = useAppSelector(selectTemplatesStatusFilter);
  const page = useAppSelector(selectTemplatesPage);

  // Debounce timer for search/filter — local implementation detail
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track whether this is initial render to avoid double-fetch on page change
  const isFirstRender = useRef(true);

  // Initial fetch on mount
  useEffect(() => {
    if (status === 'idle') {
      void dispatch(fetchTemplates({ search, page, statusFilter }));
    }
  }, [status, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounce search/filter changes — reset to page 1
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void dispatch(fetchTemplates({ search, page: 1, statusFilter }));
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, statusFilter, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch when page changes (skip first render — initial fetch above handles it)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    void dispatch(fetchTemplates({ search, page, statusFilter }));
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSetSearch = useCallback(
    (value: string) => {
      dispatch(setSearch(value)); // also resets page to 1 in the slice
    },
    [dispatch],
  );

  const handleSetStatusFilter = useCallback(
    (value: StatusFilter) => {
      dispatch(setStatusFilter(value)); // also resets page to 1 in the slice
    },
    [dispatch],
  );

  const handleSetPage = useCallback(
    (value: number) => {
      dispatch(setPage(value));
    },
    [dispatch],
  );

  const handleCreateTemplate = useCallback(
    async (input: CreateTemplateInput): Promise<Template> => {
      const result = await dispatch(createTemplateThunk(input));
      if (createTemplateThunk.rejected.match(result)) {
        throw new Error((result.payload as string | undefined) ?? 'Failed to create template');
      }
      // Refetch to get accurate pagination
      await dispatch(fetchTemplates({ search, page, statusFilter }));
      return result.payload as Template;
    },
    [dispatch, search, page, statusFilter],
  );

  const handleRemoveTemplate = useCallback(
    async (id: string): Promise<void> => {
      const result = await dispatch(deleteTemplateThunk(id));
      if (deleteTemplateThunk.rejected.match(result)) {
        throw new Error((result.payload as string | undefined) ?? 'Failed to delete template');
      }
    },
    [dispatch],
  );

  const handleSyncOne = useCallback(
    async (id: string): Promise<Template> => {
      const result = await dispatch(syncTemplateThunk(id));
      if (syncTemplateThunk.rejected.match(result)) {
        throw new Error((result.payload as string | undefined) ?? 'Failed to sync template');
      }
      return result.payload as Template;
    },
    [dispatch],
  );

  const handleSyncAll = useCallback(async (): Promise<{ synced: number }> => {
    const result = await dispatch(syncAllTemplatesThunk());
    if (syncAllTemplatesThunk.rejected.match(result)) {
      throw new Error((result.payload as string | undefined) ?? 'Failed to sync templates');
    }
    // Refetch after sync
    await dispatch(fetchTemplates({ search, page, statusFilter }));
    return result.payload as { synced: number };
  }, [dispatch, search, page, statusFilter]);

  const refetch = useCallback(() => {
    void dispatch(fetchTemplates({ search, page, statusFilter }));
  }, [dispatch, search, page, statusFilter]);

  return {
    templates,
    meta,
    loading: status === 'loading',
    isFetching: status === 'loading' && templates.length > 0,
    error,
    statusFilter,
    setStatusFilter: handleSetStatusFilter,
    search,
    setSearch: handleSetSearch,
    page,
    setPage: handleSetPage,
    createTemplate: handleCreateTemplate,
    removeTemplate: handleRemoveTemplate,
    syncOne: handleSyncOne,
    syncAll: handleSyncAll,
    refetch,
  };
}
