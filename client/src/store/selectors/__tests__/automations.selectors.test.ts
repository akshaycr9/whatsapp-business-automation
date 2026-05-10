import { describe, it, expect } from 'vitest';
import {
  selectAutomationCategories,
  selectApprovedTemplates,
  selectAutomationsStatus,
  selectAutomationsError,
  selectAutomations,
} from '@/store/selectors/automations.selectors';
import { makeAutomation, makeAutomationCategory } from '@/test/factories/automation.factory';
import { templateFactory } from '@/test/factories/template.factory';
import type { RootState } from '@/app/store';

// Build a minimal mock RootState — only the automations slice is needed here
const buildState = (
  overrides: Partial<RootState['automations']> = {},
): RootState =>
  ({
    automations: {
      categories: [],
      approvedTemplates: [],
      status: 'idle',
      approvedTemplatesStatus: 'idle',
      error: null,
      ...overrides,
    },
  } as unknown as RootState);

describe('selectAutomationCategories', () => {
  it('returns empty array for initial state', () => {
    expect(selectAutomationCategories(buildState())).toEqual([]);
  });

  it('returns the categories array', () => {
    const categories = [makeAutomationCategory()];
    expect(selectAutomationCategories(buildState({ categories }))).toEqual(categories);
  });
});

describe('selectApprovedTemplates', () => {
  it('returns empty array for initial state', () => {
    expect(selectApprovedTemplates(buildState())).toEqual([]);
  });

  it('returns the approved templates array', () => {
    const approvedTemplates = [templateFactory.createApproved()];
    expect(selectApprovedTemplates(buildState({ approvedTemplates }))).toEqual(approvedTemplates);
  });
});

describe('selectAutomationsStatus', () => {
  it('returns "idle" for initial state', () => {
    expect(selectAutomationsStatus(buildState())).toBe('idle');
  });

  it('returns "loading" when fetching', () => {
    expect(selectAutomationsStatus(buildState({ status: 'loading' }))).toBe('loading');
  });

  it('returns "succeeded" after a successful fetch', () => {
    expect(selectAutomationsStatus(buildState({ status: 'succeeded' }))).toBe('succeeded');
  });
});

describe('selectAutomationsError', () => {
  it('returns null when no error', () => {
    expect(selectAutomationsError(buildState())).toBeNull();
  });

  it('returns the error message when present', () => {
    expect(selectAutomationsError(buildState({ error: 'Failed to load' }))).toBe('Failed to load');
  });
});

describe('selectAutomations (memoized)', () => {
  it('returns empty array when categories are empty', () => {
    expect(selectAutomations(buildState())).toEqual([]);
  });

  it('flattens automations from all categories', () => {
    const auto1 = makeAutomation({ id: 'auto-001', categoryId: 'order-flow' });
    const auto2 = makeAutomation({ id: 'auto-002', categoryId: 'cod-flow' });
    const categories = [
      makeAutomationCategory({ categoryId: 'order-flow', automations: [auto1] }),
      makeAutomationCategory({ categoryId: 'cod-flow', automations: [auto2] }),
    ];
    const result = selectAutomations(buildState({ categories }));
    expect(result).toHaveLength(2);
    expect(result.map((a) => a.id)).toEqual(['auto-001', 'auto-002']);
  });

  it('returns same reference when state has not changed (memoization)', () => {
    const state = buildState({
      categories: [makeAutomationCategory()],
    });
    const first = selectAutomations(state);
    const second = selectAutomations(state);
    expect(first).toBe(second);
  });
});
