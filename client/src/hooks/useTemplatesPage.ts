import { useEffect, useCallback, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  fetchTemplates,
  fetchStatusCounts,
  deleteTemplate,
  syncTemplate,
  syncAllTemplates,
} from '@/store/actions/templates.actions';
import { setSearch, setStatusFilter, setPage } from '@/store/slices/templates.slice';
import {
  selectTemplates,
  selectTemplatesMeta,
  selectTemplatesStatus,
  selectTemplatesError,
  selectTemplatesSearch,
  selectTemplatesStatusFilter,
  selectTemplatesPage,
  selectStatusCounts,
  selectStatusCountsLoaded,
} from '@/store/selectors/templates.selectors';
import { toast } from '@/hooks/use-toast';
import type { Template, StatusFilter, StatusCounts, TemplateMeta } from '@/types';
import {
  filterTemplatesByCategory,
  buildSyncToastDescription,
  buildSyncAllToastTitle,
} from '@/utils/templates.utils';

export interface UseTemplatesPageReturn {
  // Data
  filtered: Template[];
  meta: TemplateMeta;
  statusCounts: StatusCounts;
  previewTemplate: Template | null;
  // Status
  loading: boolean;
  error: string | null;
  syncingAll: boolean;
  syncingIds: Set<string>;
  // Filters
  statusFilter: StatusFilter;
  search: string;
  page: number;
  catFilter: string;
  // Handlers
  setStatusFilter: (value: StatusFilter) => void;
  setSearch: (value: string) => void;
  setPage: (value: number) => void;
  setCatFilter: (cat: string) => void;
  setPreviewId: (id: string | null) => void;
  handleSyncAll: () => void;
  handleSync: (id: string) => void;
  handleDelete: (id: string) => void;
  handleDuplicate: (id: string) => void;
  handleClosePreview: () => void;
  handleEditPreview: () => void;
  openEditor: (id: string) => void;
  navigateToNew: () => void;
  refetch: () => void;
}

export function useTemplatesPage(): UseTemplatesPageReturn {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Redux state
  const templates = useAppSelector(selectTemplates);
  const meta = useAppSelector(selectTemplatesMeta);
  const status = useAppSelector(selectTemplatesStatus);
  const error = useAppSelector(selectTemplatesError);
  const search = useAppSelector(selectTemplatesSearch);
  const statusFilter = useAppSelector(selectTemplatesStatusFilter);
  const page = useAppSelector(selectTemplatesPage);
  const statusCounts = useAppSelector(selectStatusCounts);
  const statusCountsLoaded = useAppSelector(selectStatusCountsLoaded);

  // Local UI state
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());
  const [catFilter, setCatFilter] = useState<string>('all');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  // Fetch on mount when store is idle
  useEffect(() => {
    if (status === 'idle') {
      void dispatch(fetchTemplates({ search, page, statusFilter }));
    }
  }, [status, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch status counts once
  useEffect(() => {
    if (!statusCountsLoaded) {
      void dispatch(fetchStatusCounts());
    }
  }, [statusCountsLoaded, dispatch]);

  // Debounced re-fetch on search/filter change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void dispatch(fetchTemplates({ search, page: 1, statusFilter }));
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, statusFilter, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch on page change (skip first render — handled by idle fetch above)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    void dispatch(fetchTemplates({ search, page, statusFilter }));
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  // Derived state
  const filtered = useMemo(
    () => filterTemplatesByCategory(templates, catFilter),
    [templates, catFilter],
  );

  const previewTemplate = useMemo(
    () => (previewId ? (templates.find((t) => t.id === previewId) ?? null) : null),
    [previewId, templates],
  );

  // Filter/pagination handlers
  const handleSetSearch = useCallback(
    (value: string) => { dispatch(setSearch(value)); },
    [dispatch],
  );

  const handleSetStatusFilter = useCallback(
    (value: StatusFilter) => { dispatch(setStatusFilter(value)); },
    [dispatch],
  );

  const handleSetPage = useCallback(
    (value: number) => { dispatch(setPage(value)); },
    [dispatch],
  );

  // Sync all — returns void; async work is fire-and-forget via IIFE
  const handleSyncAll = useCallback((): void => {
    void (async () => {
      setSyncingAll(true);
      try {
        const result = await dispatch(syncAllTemplates()).unwrap();
        await Promise.all([
          dispatch(fetchTemplates({ search, page, statusFilter })),
          dispatch(fetchStatusCounts()),
        ]);
        toast({ title: buildSyncAllToastTitle(result.synced) });
      } catch (err: unknown) {
        toast({
          variant: 'destructive',
          title: 'Sync failed',
          description: err instanceof Error ? err.message : 'Unknown error',
        });
      } finally {
        setSyncingAll(false);
      }
    })();
  }, [dispatch, search, page, statusFilter]);

  // Sync single template
  const handleSync = useCallback((id: string): void => {
    void (async () => {
      setSyncingIds((prev) => new Set(prev).add(id));
      try {
        const updated = await dispatch(syncTemplate(id)).unwrap();
        toast({
          title: 'Template synced',
          description: buildSyncToastDescription(updated.status, updated.rejectedReason),
        });
      } catch (err: unknown) {
        toast({
          variant: 'destructive',
          title: 'Sync failed',
          description: err instanceof Error ? err.message : 'Unknown error',
        });
      } finally {
        setSyncingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    })();
  }, [dispatch]);

  // Delete template
  const handleDelete = useCallback((id: string): void => {
    void (async () => {
      try {
        await dispatch(deleteTemplate(id)).unwrap();
        void dispatch(fetchStatusCounts());
        toast({ title: 'Template deleted' });
      } catch (err: unknown) {
        toast({
          variant: 'destructive',
          title: 'Failed to delete template',
          description: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    })();
  }, [dispatch]);

  // Duplicate — placeholder, not yet implemented
  const handleDuplicate = useCallback((_id: string): void => {}, []);

  const handleClosePreview = useCallback((): void => {
    setPreviewId(null);
  }, []);

  const handleEditPreview = useCallback((): void => {
    if (previewId) {
      setPreviewId(null);
      navigate(`/templates/${previewId}/edit`);
    }
  }, [previewId, navigate]);

  const openEditor = useCallback(
    (id: string): void => {
      setPreviewId(null);
      navigate(`/templates/${id}/edit`);
    },
    [navigate],
  );

  const navigateToNew = useCallback((): void => {
    navigate('/templates/new');
  }, [navigate]);

  const refetch = useCallback((): void => {
    void dispatch(fetchTemplates({ search, page, statusFilter }));
  }, [dispatch, search, page, statusFilter]);

  return {
    filtered,
    meta,
    statusCounts,
    previewTemplate,
    loading: status === 'loading',
    error,
    syncingAll,
    syncingIds,
    statusFilter,
    search,
    page,
    catFilter,
    setStatusFilter: handleSetStatusFilter,
    setSearch: handleSetSearch,
    setPage: handleSetPage,
    setCatFilter,
    setPreviewId,
    handleSyncAll,
    handleSync,
    handleDelete,
    handleDuplicate,
    handleClosePreview,
    handleEditPreview,
    openEditor,
    navigateToNew,
    refetch,
  };
}
