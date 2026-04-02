import { useEffect, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  fetchAutomations,
  fetchApprovedTemplates,
  createAutomation as createAutomationThunk,
  updateAutomation as updateAutomationThunk,
  deleteAutomation as deleteAutomationThunk,
  toggleAutomation as toggleAutomationThunk,
  fetchAutomationLogs,
  setPage,
  selectAutomations,
  selectApprovedTemplates,
  selectAutomationsMeta,
  selectAutomationsStatus,
  selectAutomationsError,
  selectAutomationsPage,
  type CreateAutomationInput,
} from '@/features/automations/automationsSlice';
import type { Automation, AutomationLog, Template } from '@/types';

export type { CreateAutomationInput };

interface AutomationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UseAutomationsReturn {
  automations: Automation[];
  approvedTemplates: Template[];
  meta: AutomationMeta;
  loading: boolean;
  isFetching: boolean;
  error: string | null;
  page: number;
  setPage: (value: number) => void;
  createAutomation: (input: CreateAutomationInput) => Promise<Automation>;
  updateAutomation: (id: string, input: Partial<CreateAutomationInput>) => Promise<Automation>;
  removeAutomation: (id: string) => Promise<void>;
  toggleAutomation: (id: string) => Promise<Automation>;
  fetchLogs: (
    automationId: string,
    logsPage?: number,
  ) => Promise<{ items: AutomationLog[]; meta: AutomationMeta }>;
  refetch: () => void;
}

export function useAutomations(): UseAutomationsReturn {
  const dispatch = useAppDispatch();
  const automations = useAppSelector(selectAutomations);
  const approvedTemplates = useAppSelector(selectApprovedTemplates);
  const meta = useAppSelector(selectAutomationsMeta);
  const status = useAppSelector(selectAutomationsStatus);
  const error = useAppSelector(selectAutomationsError);
  const page = useAppSelector(selectAutomationsPage);

  const isFirstPageEffect = useRef(true);

  // Initial fetch
  useEffect(() => {
    if (status === 'idle') {
      void dispatch(fetchAutomations(1));
      void dispatch(fetchApprovedTemplates());
    }
  }, [status, dispatch]);

  // Fetch when page changes (skip first render)
  useEffect(() => {
    if (isFirstPageEffect.current) {
      isFirstPageEffect.current = false;
      return;
    }
    void dispatch(fetchAutomations(page));
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSetPage = useCallback(
    (value: number) => {
      dispatch(setPage(value));
    },
    [dispatch],
  );

  const handleCreateAutomation = useCallback(
    async (input: CreateAutomationInput): Promise<Automation> => {
      const result = await dispatch(createAutomationThunk(input));
      if (createAutomationThunk.rejected.match(result)) {
        throw new Error((result.payload as string | undefined) ?? 'Failed to create automation');
      }
      // Refetch to get accurate pagination
      await dispatch(fetchAutomations(page));
      return result.payload as Automation;
    },
    [dispatch, page],
  );

  const handleUpdateAutomation = useCallback(
    async (id: string, input: Partial<CreateAutomationInput>): Promise<Automation> => {
      const result = await dispatch(updateAutomationThunk({ id, input }));
      if (updateAutomationThunk.rejected.match(result)) {
        throw new Error((result.payload as string | undefined) ?? 'Failed to update automation');
      }
      return result.payload as Automation;
    },
    [dispatch],
  );

  const handleRemoveAutomation = useCallback(
    async (id: string): Promise<void> => {
      const result = await dispatch(deleteAutomationThunk(id));
      if (deleteAutomationThunk.rejected.match(result)) {
        throw new Error((result.payload as string | undefined) ?? 'Failed to delete automation');
      }
    },
    [dispatch],
  );

  const handleToggleAutomation = useCallback(
    async (id: string): Promise<Automation> => {
      const result = await dispatch(toggleAutomationThunk(id));
      if (toggleAutomationThunk.rejected.match(result)) {
        throw new Error((result.payload as string | undefined) ?? 'Failed to toggle automation');
      }
      return result.payload as Automation;
    },
    [dispatch],
  );

  const handleFetchLogs = useCallback(
    async (
      automationId: string,
      logsPage = 1,
    ): Promise<{ items: AutomationLog[]; meta: AutomationMeta }> => {
      const result = await dispatch(fetchAutomationLogs({ automationId, page: logsPage }));
      if (fetchAutomationLogs.rejected.match(result)) {
        throw new Error((result.payload as string | undefined) ?? 'Failed to load logs');
      }
      return result.payload as { items: AutomationLog[]; meta: AutomationMeta };
    },
    [dispatch],
  );

  const refetch = useCallback(() => {
    void dispatch(fetchAutomations(page));
  }, [dispatch, page]);

  return {
    automations,
    approvedTemplates,
    meta,
    loading: status === 'loading',
    isFetching: status === 'loading' && automations.length > 0,
    error,
    page,
    setPage: handleSetPage,
    createAutomation: handleCreateAutomation,
    updateAutomation: handleUpdateAutomation,
    removeAutomation: handleRemoveAutomation,
    toggleAutomation: handleToggleAutomation,
    fetchLogs: handleFetchLogs,
    refetch,
  };
}
