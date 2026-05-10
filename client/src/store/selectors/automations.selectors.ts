import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';
import type { Automation, AutomationCategoryGroup, Template } from '@/types';
import type { LoadStatus } from '@/store/slices/automations.slice';

export const selectAutomationCategories = (state: RootState): AutomationCategoryGroup[] =>
  state.automations.categories;

export const selectApprovedTemplates = (state: RootState): Template[] =>
  state.automations.approvedTemplates;

export const selectAutomationsStatus = (state: RootState): LoadStatus =>
  state.automations.status;

export const selectAutomationsError = (state: RootState): string | null =>
  state.automations.error;

export const selectAutomations = createSelector(
  [selectAutomationCategories],
  (categories): Automation[] =>
    categories.flatMap((c) => c.automations),
);
