import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  fetchAutomations,
  fetchApprovedTemplates,
  createAutomation as createAutomationThunk,
  updateAutomation as updateAutomationThunk,
  deleteAutomation as deleteAutomationThunk,
  toggleAutomation as toggleAutomationThunk,
  fetchAutomationLogs,
  selectAutomationCategories,
  selectAutomations,
  selectApprovedTemplates,
  selectAutomationsStatus,
  selectAutomationsError,
  type CreateAutomationInput,
} from '@/features/automations/automationsSlice';
import type { Automation, AutomationCategoryGroup, AutomationLog, Template } from '@/types';

export type { CreateAutomationInput };

export interface UseAutomationsReturn {
  categories: AutomationCategoryGroup[];
  automations: Automation[];
  approvedTemplates: Template[];
  loading: boolean;
  error: string | null;
  createAutomation: (input: CreateAutomationInput) => Promise<Automation>;
  updateAutomation: (id: string, input: Partial<CreateAutomationInput>) => Promise<Automation>;
  removeAutomation: (id: string) => Promise<void>;
  toggleAutomation: (id: string) => Promise<Automation>;
  fetchLogs: (automationId: string, logsPage?: number) => Promise<AutomationLog[]>;
  refetch: () => void;
}

export function useAutomations(): UseAutomationsReturn {
  const dispatch = useAppDispatch();
  const categories = useAppSelector(selectAutomationCategories);
  const automations = useAppSelector(selectAutomations);
  const approvedTemplates = useAppSelector(selectApprovedTemplates);
  const status = useAppSelector(selectAutomationsStatus);
  const error = useAppSelector(selectAutomationsError);

  // Initial fetch
  useEffect(() => {
    if (status === 'idle') {
      void dispatch(fetchAutomations());
      void dispatch(fetchApprovedTemplates());
    }
  }, [status, dispatch]);

  const handleCreateAutomation = useCallback(
    async (input: CreateAutomationInput): Promise<Automation> => {
      const result = await dispatch(createAutomationThunk(input));
      if (createAutomationThunk.rejected.match(result)) {
        throw new Error((result.payload as string | undefined) ?? 'Failed to create automation');
      }
      // Refetch to get all automations
      await dispatch(fetchAutomations());
      return result.payload as Automation;
    },
    [dispatch],
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
    ): Promise<AutomationLog[]> => {
      const result = await dispatch(fetchAutomationLogs({ automationId, page: logsPage }));
      if (fetchAutomationLogs.rejected.match(result)) {
        throw new Error((result.payload as string | undefined) ?? 'Failed to load logs');
      }
      const logs = result.payload as { items: AutomationLog[] };
      return logs.items;
    },
    [dispatch],
  );

  const refetch = useCallback(() => {
    void dispatch(fetchAutomations());
  }, [dispatch]);

  return {
    categories,
    automations,
    approvedTemplates,
    loading: status === 'loading',
    error,
    createAutomation: handleCreateAutomation,
    updateAutomation: handleUpdateAutomation,
    removeAutomation: handleRemoveAutomation,
    toggleAutomation: handleToggleAutomation,
    fetchLogs: handleFetchLogs,
    refetch,
  };
}
