import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { useTemplateFormLogic } from '../use-template-form-logic';
import { useTemplateFormState } from '../use-template-form-state';
import { createTestStore } from '@/test/test-utils';
import { TemplateButtonGroupType } from '@/types/templates';

// Mock the router
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

// Mock useTemplates hook
vi.mock('@/hooks/templates/use-templates', () => ({
  useTemplates: () => ({
    createTemplate: vi.fn(async () => ({
      id: 'new-template-id',
      name: 'Test Template',
      status: 'PENDING',
    })),
  }),
}));

describe('useTemplateFormLogic', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
    vi.clearAllMocks();
  });

  describe('Hook Integration', () => {
    it('hook receives form instance from form state hook', () => {
      const { result: formResult } = renderHook(() => useTemplateFormState(), {
        wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
      });

      const { result: logicResult } = renderHook(
        () =>
          useTemplateFormLogic({
            form: formResult.current.form,
            headerEnabled: formResult.current.headerEnabled,
            headerText: formResult.current.headerText,
            bodyText: formResult.current.bodyText,
            bodySamples: formResult.current.bodySamples,
            footerEnabled: formResult.current.footerEnabled,
            footerText: formResult.current.footerText,
            buttonsEnabled: formResult.current.buttonsEnabled,
            buttonGroup: formResult.current.buttonGroup,
            buttons: formResult.current.buttons,
            category: formResult.current.category,
          }),
        {
          wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
        },
      );

      expect(logicResult.current).toBeDefined();
      expect(logicResult.current.previewBody).toBe('Your template body appears here.');
    });

    it('returns all expected properties', () => {
      const { result: formResult } = renderHook(() => useTemplateFormState(), {
        wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
      });

      const { result: logicResult } = renderHook(
        () =>
          useTemplateFormLogic({
            form: formResult.current.form,
            headerEnabled: formResult.current.headerEnabled,
            headerText: formResult.current.headerText,
            bodyText: formResult.current.bodyText,
            bodySamples: formResult.current.bodySamples,
            footerEnabled: formResult.current.footerEnabled,
            footerText: formResult.current.footerText,
            buttonsEnabled: formResult.current.buttonsEnabled,
            buttonGroup: formResult.current.buttonGroup,
            buttons: formResult.current.buttons,
            category: formResult.current.category,
          }),
        {
          wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
        },
      );

      expect(logicResult.current).toHaveProperty('detectedVars');
      expect(logicResult.current).toHaveProperty('quickReplies');
      expect(logicResult.current).toHaveProperty('urlBtn');
      expect(logicResult.current).toHaveProperty('phoneBtn');
      expect(logicResult.current).toHaveProperty('copyBtn');
      expect(logicResult.current).toHaveProperty('previewHeader');
      expect(logicResult.current).toHaveProperty('previewBody');
      expect(logicResult.current).toHaveProperty('previewButtons');
      expect(logicResult.current).toHaveProperty('insertVariable');
      expect(logicResult.current).toHaveProperty('addButtonOfType');
      expect(logicResult.current).toHaveProperty('handleButtonGroupChange');
      expect(logicResult.current).toHaveProperty('onSubmit');
    });
  });

  describe('Handler Functions', () => {
    it('insertVariable is a function', () => {
      const { result: formResult } = renderHook(() => useTemplateFormState(), {
        wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
      });

      const { result: logicResult } = renderHook(
        () =>
          useTemplateFormLogic({
            form: formResult.current.form,
            headerEnabled: formResult.current.headerEnabled,
            headerText: formResult.current.headerText,
            bodyText: formResult.current.bodyText,
            bodySamples: formResult.current.bodySamples,
            footerEnabled: formResult.current.footerEnabled,
            footerText: formResult.current.footerText,
            buttonsEnabled: formResult.current.buttonsEnabled,
            buttonGroup: formResult.current.buttonGroup,
            buttons: formResult.current.buttons,
            category: formResult.current.category,
          }),
        {
          wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
        },
      );

      expect(typeof logicResult.current.insertVariable).toBe('function');
    });

    it('addButtonOfType is a function', () => {
      const { result: formResult } = renderHook(() => useTemplateFormState(), {
        wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
      });

      const { result: logicResult } = renderHook(
        () =>
          useTemplateFormLogic({
            form: formResult.current.form,
            headerEnabled: formResult.current.headerEnabled,
            headerText: formResult.current.headerText,
            bodyText: formResult.current.bodyText,
            bodySamples: formResult.current.bodySamples,
            footerEnabled: formResult.current.footerEnabled,
            footerText: formResult.current.footerText,
            buttonsEnabled: formResult.current.buttonsEnabled,
            buttonGroup: formResult.current.buttonGroup,
            buttons: formResult.current.buttons,
            category: formResult.current.category,
          }),
        {
          wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
        },
      );

      expect(typeof logicResult.current.addButtonOfType).toBe('function');
    });

    it('handleButtonGroupChange is a function', () => {
      const { result: formResult } = renderHook(() => useTemplateFormState(), {
        wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
      });

      const { result: logicResult } = renderHook(
        () =>
          useTemplateFormLogic({
            form: formResult.current.form,
            headerEnabled: formResult.current.headerEnabled,
            headerText: formResult.current.headerText,
            bodyText: formResult.current.bodyText,
            bodySamples: formResult.current.bodySamples,
            footerEnabled: formResult.current.footerEnabled,
            footerText: formResult.current.footerText,
            buttonsEnabled: formResult.current.buttonsEnabled,
            buttonGroup: formResult.current.buttonGroup,
            buttons: formResult.current.buttons,
            category: formResult.current.category,
          }),
        {
          wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
        },
      );

      expect(typeof logicResult.current.handleButtonGroupChange).toBe('function');
    });

    it('onSubmit is a function', () => {
      const { result: formResult } = renderHook(() => useTemplateFormState(), {
        wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
      });

      const { result: logicResult } = renderHook(
        () =>
          useTemplateFormLogic({
            form: formResult.current.form,
            headerEnabled: formResult.current.headerEnabled,
            headerText: formResult.current.headerText,
            bodyText: formResult.current.bodyText,
            bodySamples: formResult.current.bodySamples,
            footerEnabled: formResult.current.footerEnabled,
            footerText: formResult.current.footerText,
            buttonsEnabled: formResult.current.buttonsEnabled,
            buttonGroup: formResult.current.buttonGroup,
            buttons: formResult.current.buttons,
            category: formResult.current.category,
          }),
        {
          wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
        },
      );

      expect(typeof logicResult.current.onSubmit).toBe('function');
    });
  });

  describe('Initial State', () => {
    it('detectedVars is array', () => {
      const { result: formResult } = renderHook(() => useTemplateFormState(), {
        wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
      });

      const { result: logicResult } = renderHook(
        () =>
          useTemplateFormLogic({
            form: formResult.current.form,
            headerEnabled: formResult.current.headerEnabled,
            headerText: formResult.current.headerText,
            bodyText: formResult.current.bodyText,
            bodySamples: formResult.current.bodySamples,
            footerEnabled: formResult.current.footerEnabled,
            footerText: formResult.current.footerText,
            buttonsEnabled: formResult.current.buttonsEnabled,
            buttonGroup: formResult.current.buttonGroup,
            buttons: formResult.current.buttons,
            category: formResult.current.category,
          }),
        {
          wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
        },
      );

      expect(Array.isArray(logicResult.current.detectedVars)).toBe(true);
    });

    it('quickReplies is array', () => {
      const { result: formResult } = renderHook(() => useTemplateFormState(), {
        wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
      });

      const { result: logicResult } = renderHook(
        () =>
          useTemplateFormLogic({
            form: formResult.current.form,
            headerEnabled: formResult.current.headerEnabled,
            headerText: formResult.current.headerText,
            bodyText: formResult.current.bodyText,
            bodySamples: formResult.current.bodySamples,
            footerEnabled: formResult.current.footerEnabled,
            footerText: formResult.current.footerText,
            buttonsEnabled: formResult.current.buttonsEnabled,
            buttonGroup: formResult.current.buttonGroup,
            buttons: formResult.current.buttons,
            category: formResult.current.category,
          }),
        {
          wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
        },
      );

      expect(Array.isArray(logicResult.current.quickReplies)).toBe(true);
    });

    it('previewButtons is array', () => {
      const { result: formResult } = renderHook(() => useTemplateFormState(), {
        wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
      });

      const { result: logicResult } = renderHook(
        () =>
          useTemplateFormLogic({
            form: formResult.current.form,
            headerEnabled: formResult.current.headerEnabled,
            headerText: formResult.current.headerText,
            bodyText: formResult.current.bodyText,
            bodySamples: formResult.current.bodySamples,
            footerEnabled: formResult.current.footerEnabled,
            footerText: formResult.current.footerText,
            buttonsEnabled: formResult.current.buttonsEnabled,
            buttonGroup: formResult.current.buttonGroup,
            buttons: formResult.current.buttons,
            category: formResult.current.category,
          }),
        {
          wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
        },
      );

      expect(Array.isArray(logicResult.current.previewButtons)).toBe(true);
    });

    it('isDynamicUrl is boolean', () => {
      const { result: formResult } = renderHook(() => useTemplateFormState(), {
        wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
      });

      const { result: logicResult } = renderHook(
        () =>
          useTemplateFormLogic({
            form: formResult.current.form,
            headerEnabled: formResult.current.headerEnabled,
            headerText: formResult.current.headerText,
            bodyText: formResult.current.bodyText,
            bodySamples: formResult.current.bodySamples,
            footerEnabled: formResult.current.footerEnabled,
            footerText: formResult.current.footerText,
            buttonsEnabled: formResult.current.buttonsEnabled,
            buttonGroup: formResult.current.buttonGroup,
            buttons: formResult.current.buttons,
            category: formResult.current.category,
          }),
        {
          wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
        },
      );

      expect(typeof logicResult.current.isDynamicUrl).toBe('boolean');
    });

    it('previewBody is string', () => {
      const { result: formResult } = renderHook(() => useTemplateFormState(), {
        wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
      });

      const { result: logicResult } = renderHook(
        () =>
          useTemplateFormLogic({
            form: formResult.current.form,
            headerEnabled: formResult.current.headerEnabled,
            headerText: formResult.current.headerText,
            bodyText: formResult.current.bodyText,
            bodySamples: formResult.current.bodySamples,
            footerEnabled: formResult.current.footerEnabled,
            footerText: formResult.current.footerText,
            buttonsEnabled: formResult.current.buttonsEnabled,
            buttonGroup: formResult.current.buttonGroup,
            buttons: formResult.current.buttons,
            category: formResult.current.category,
          }),
        {
          wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
        },
      );

      expect(typeof logicResult.current.previewBody).toBe('string');
    });
  });
});
