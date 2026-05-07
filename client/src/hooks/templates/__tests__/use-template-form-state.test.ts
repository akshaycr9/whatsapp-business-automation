import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTemplateFormState } from '../use-template-form-state';
import { TemplateButtonGroupType, TemplateButtonType } from '@/types/templates';
import type { TemplateFormData } from '@/lib/template-form.schema';

describe('useTemplateFormState', () => {
  describe('Initial State', () => {
    it('returns form instance with default values', () => {
      const { result } = renderHook(() => useTemplateFormState());

      expect(result.current.form).toBeDefined();
      expect(result.current.form.getValues('name')).toBe('');
      expect(result.current.form.getValues('language')).toBe('en');
      expect(result.current.form.getValues('category')).toBe('MARKETING');
    });

    it('returns default watched values', () => {
      const { result } = renderHook(() => useTemplateFormState());

      expect(result.current.headerEnabled).toBe(false);
      expect(result.current.headerText).toBe('');
      expect(result.current.bodyText).toBe('');
      expect(result.current.bodySamples).toEqual([]);
      expect(result.current.footerEnabled).toBe(false);
      expect(result.current.footerText).toBe('');
      expect(result.current.buttonsEnabled).toBe(false);
      expect(result.current.buttonGroup).toBe(TemplateButtonGroupType.QUICK_REPLY);
      expect(result.current.buttons).toEqual([]);
      expect(result.current.category).toBe('MARKETING');
    });

    it('returns button field array operations', () => {
      const { result } = renderHook(() => useTemplateFormState());

      expect(result.current.buttonFields).toEqual([]);
      expect(typeof result.current.appendButton).toBe('function');
      expect(typeof result.current.removeButton).toBe('function');
    });
  });

  describe('Form Instance', () => {
    it('form has required methods', () => {
      const { result } = renderHook(() => useTemplateFormState());

      expect(result.current.form.register).toBeDefined();
      expect(result.current.form.handleSubmit).toBeDefined();
      expect(result.current.form.watch).toBeDefined();
      expect(result.current.form.setValue).toBeDefined();
      expect(result.current.form.getValues).toBeDefined();
      expect(result.current.form.reset).toBeDefined();
    });

    it('form.formState has errors and isSubmitting', () => {
      const { result } = renderHook(() => useTemplateFormState());

      expect(result.current.form.formState).toHaveProperty('errors');
      expect(result.current.form.formState).toHaveProperty('isSubmitting');
    });
  });

  describe('Watched Values', () => {
    it('watched values update when form values change', () => {
      const { result } = renderHook(() => useTemplateFormState());

      act(() => {
        result.current.form.setValue('headerText', 'New Header');
      });

      expect(result.current.headerText).toBe('New Header');
    });

    it('watched values update for all form fields', () => {
      const { result } = renderHook(() => useTemplateFormState());

      act(() => {
        result.current.form.setValue('name', 'Order Confirmed');
        result.current.form.setValue('headerEnabled', true);
        result.current.form.setValue('bodyText', 'Order {{1}} confirmed');
        result.current.form.setValue('footerEnabled', true);
        result.current.form.setValue('buttonsEnabled', true);
        result.current.form.setValue('buttonGroup', TemplateButtonGroupType.CTA);
      });

      expect(result.current.form.getValues('name')).toBe('Order Confirmed');
      expect(result.current.headerEnabled).toBe(true);
      expect(result.current.bodyText).toBe('Order {{1}} confirmed');
      expect(result.current.footerEnabled).toBe(true);
      expect(result.current.buttonsEnabled).toBe(true);
      expect(result.current.buttonGroup).toBe(TemplateButtonGroupType.CTA);
    });
  });

  describe('Button Field Array Operations', () => {
    it('appendButton adds a new button field', () => {
      const { result } = renderHook(() => useTemplateFormState());

      expect(result.current.buttonFields.length).toBe(0);

      act(() => {
        result.current.appendButton({
          type: TemplateButtonType.QUICK_REPLY,
          text: 'Yes',
          url: '',
          example: '',
          phone_number: '',
        });
      });

      expect(result.current.buttonFields.length).toBe(1);
    });

    it('appendButton can add multiple buttons', () => {
      const { result } = renderHook(() => useTemplateFormState());

      act(() => {
        result.current.appendButton({
          type: TemplateButtonType.QUICK_REPLY,
          text: 'Yes',
          url: '',
          example: '',
          phone_number: '',
        });
        result.current.appendButton({
          type: TemplateButtonType.QUICK_REPLY,
          text: 'No',
          url: '',
          example: '',
          phone_number: '',
        });
      });

      expect(result.current.buttonFields.length).toBe(2);
      expect(result.current.buttons[0]?.text).toBe('Yes');
      expect(result.current.buttons[1]?.text).toBe('No');
    });

    it('removeButton removes a button field', () => {
      const { result } = renderHook(() => useTemplateFormState());

      act(() => {
        result.current.appendButton({
          type: TemplateButtonType.QUICK_REPLY,
          text: 'Yes',
          url: '',
          example: '',
          phone_number: '',
        });
        result.current.appendButton({
          type: TemplateButtonType.QUICK_REPLY,
          text: 'No',
          url: '',
          example: '',
          phone_number: '',
        });
      });

      expect(result.current.buttonFields.length).toBe(2);

      act(() => {
        result.current.removeButton(0);
      });

      expect(result.current.buttonFields.length).toBe(1);
      expect(result.current.buttons[0]?.text).toBe('No');
    });

    it('removeButton handles multiple append and remove cycles', () => {
      const { result } = renderHook(() => useTemplateFormState());

      act(() => {
        result.current.appendButton({
          type: TemplateButtonType.QUICK_REPLY,
          text: 'Button 1',
          url: '',
          example: '',
          phone_number: '',
        });
      });

      expect(result.current.buttonFields.length).toBe(1);

      act(() => {
        result.current.removeButton(0);
      });

      expect(result.current.buttonFields.length).toBe(0);

      act(() => {
        result.current.appendButton({
          type: TemplateButtonType.QUICK_REPLY,
          text: 'Button 2',
          url: '',
          example: '',
          phone_number: '',
        });
      });

      expect(result.current.buttonFields.length).toBe(1);
      expect(result.current.buttons[0]?.text).toBe('Button 2');
    });
  });

  describe('Initial Values', () => {
    it('merges initialValues with defaults', () => {
      const initialValues: Partial<TemplateFormData> = {
        name: 'Order Confirmed',
        language: 'es',
        headerEnabled: true,
        headerText: 'Header',
      };

      const { result } = renderHook(() => useTemplateFormState({ initialValues }));

      expect(result.current.form.getValues('name')).toBe('Order Confirmed');
      expect(result.current.form.getValues('language')).toBe('es');
      expect(result.current.headerEnabled).toBe(true);
      expect(result.current.headerText).toBe('Header');
      // Other fields should be defaults
      expect(result.current.footerEnabled).toBe(false);
    });

    it('form.reset updates watched values', () => {
      const initialValues: Partial<TemplateFormData> = {
        name: 'New Template',
        bodyText: 'Body text',
      };

      const { result, rerender } = renderHook(
        ({ init }) => useTemplateFormState(init),
        {
          initialProps: { init: { initialValues } },
        },
      );

      expect(result.current.form.getValues('name')).toBe('New Template');
      expect(result.current.bodyText).toBe('Body text');

      const newInitialValues: Partial<TemplateFormData> = {
        name: 'Updated Template',
        bodyText: 'Updated body',
      };

      rerender({ init: { initialValues: newInitialValues } });

      expect(result.current.form.getValues('name')).toBe('Updated Template');
      expect(result.current.bodyText).toBe('Updated body');
    });
  });

  describe('Form Control', () => {
    it('form control is connected to watched values', () => {
      const { result } = renderHook(() => useTemplateFormState());

      act(() => {
        result.current.form.setValue('name', 'Test');
        result.current.form.setValue('bodyText', 'Test body');
      });

      const values = result.current.form.getValues();
      expect(values.name).toBe('Test');
      expect(values.bodyText).toBe('Test body');
    });

    it('form validation is available through form instance', () => {
      const { result } = renderHook(() => useTemplateFormState());

      expect(result.current.form.formState.errors).toBeDefined();
      expect(typeof result.current.form.formState.errors).toBe('object');
    });
  });

  describe('Button Fields Structure', () => {
    it('buttonFields have id property for key prop', () => {
      const { result } = renderHook(() => useTemplateFormState());

      act(() => {
        result.current.appendButton({
          type: TemplateButtonType.QUICK_REPLY,
          text: 'Button',
          url: '',
          example: '',
          phone_number: '',
        });
      });

      expect(result.current.buttonFields[0]).toHaveProperty('id');
      expect(typeof result.current.buttonFields[0]?.id).toBe('string');
    });

    it('buttonFields id property is unique for each field', () => {
      const { result } = renderHook(() => useTemplateFormState());

      act(() => {
        result.current.appendButton({
          type: TemplateButtonType.QUICK_REPLY,
          text: 'Button 1',
          url: '',
          example: '',
          phone_number: '',
        });
        result.current.appendButton({
          type: TemplateButtonType.QUICK_REPLY,
          text: 'Button 2',
          url: '',
          example: '',
          phone_number: '',
        });
      });

      const id1 = result.current.buttonFields[0]?.id;
      const id2 = result.current.buttonFields[1]?.id;

      expect(id1).not.toBe(id2);
    });
  });
});
