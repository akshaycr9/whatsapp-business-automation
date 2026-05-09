import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { useEffect } from 'react';
import {
  fetchAutomations,
  fetchApprovedTemplates,
  toggleAutomation,
} from '@/store/actions/automations.actions';
import {
  selectAutomationCategories,
  selectAutomationsStatus,
  selectAutomationsError,
} from '@/store/selectors/automations.selectors';
import type { AutomationCategoryGroup } from '@/types';

export interface UseAutomationsPageReturn {
  categories: AutomationCategoryGroup[];
  selectedCategoryId: string | null;
  selectedCategory: AutomationCategoryGroup | undefined;
  activeCount: number;
  pausedCount: number;
  loading: boolean;
  error: string | null;
  handleCategorySelect: (categoryId: string) => void;
  handleToggle: (id: string) => void;
  handleEdit: (id: string) => void;
}

export function useAutomationsPage(): UseAutomationsPageReturn {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const categories = useAppSelector(selectAutomationCategories);
  const status = useAppSelector(selectAutomationsStatus);
  const error = useAppSelector(selectAutomationsError);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'idle') {
      void dispatch(fetchAutomations());
      void dispatch(fetchApprovedTemplates());
    }
  }, [status, dispatch]);

  const selectedCategory = useMemo(() => {
    if (selectedCategoryId === null && categories.length > 0) return categories[0];
    return categories.find((c) => c.categoryId === selectedCategoryId) ?? categories[0];
  }, [categories, selectedCategoryId]);

  const activeCount = useMemo(
    () => selectedCategory?.automations.filter((a) => a.isActive).length ?? 0,
    [selectedCategory],
  );

  const pausedCount = useMemo(
    () => selectedCategory?.automations.filter((a) => !a.isActive).length ?? 0,
    [selectedCategory],
  );

  const handleCategorySelect = useCallback((categoryId: string) => {
    setSelectedCategoryId(categoryId);
  }, []);

  const handleToggle = useCallback(
    (id: string) => {
      void dispatch(toggleAutomation(id));
    },
    [dispatch],
  );

  const handleEdit = useCallback(
    (id: string) => {
      navigate(`/automations/${id}/edit`);
    },
    [navigate],
  );

  return {
    categories,
    selectedCategoryId,
    selectedCategory,
    activeCount,
    pausedCount,
    loading: status === 'loading',
    error,
    handleCategorySelect,
    handleToggle,
    handleEdit,
  };
}
