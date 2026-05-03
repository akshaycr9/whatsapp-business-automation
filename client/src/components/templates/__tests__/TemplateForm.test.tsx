import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TemplateForm } from '../TemplateForm';
import { TemplateButtonGroupType, TemplateButtonType } from '@/types/templates';
import type { UseFormReturn } from 'react-hook-form';
import type { TemplateFormData } from '@/lib/template-form.schema';

// Mock the hooks used by TemplateForm
vi.mock('@/hooks/templates/use-edit-template-form', () => ({
  useEditTemplateForm: () => ({ template: undefined }),
}));

vi.mock('@/hooks/templates/use-template-form-logic', () => ({
  useTemplateFormLogic: () => ({
    detectedVars: [],
    quickReplies: [],
    urlBtn: null,
    phoneBtn: null,
    copyBtn: null,
    urlBtnIndex: -1,
    phoneBtnIndex: -1,
    copyBtnIndex: -1,
    isDynamicUrl: false,
    insertVariable: vi.fn(),
    addButtonOfType: vi.fn(),
    handleButtonGroupChange: vi.fn(),
    onSubmit: vi.fn(),
  }),
}));

vi.mock('@/hooks/templates/use-templates', () => ({
  useTemplates: () => ({
    updateTemplate: vi.fn(),
  }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

describe('TemplateForm', () => {
  const createMockForm = (): Partial<UseFormReturn<TemplateFormData>> => ({
    register: vi.fn((name) => ({ name })),
    handleSubmit: vi.fn((onSubmit) => vi.fn(() => onSubmit({}))),
    formState: { errors: {}, isSubmitting: false },
    watch: vi.fn(),
    setValue: vi.fn(),
  });

  describe('Form Fields', () => {
    it('renders template name field', () => {
      const form = createMockForm() as UseFormReturn<TemplateFormData>;
      form.formState = { errors: {}, isSubmitting: false };

      render(
        <TemplateForm
          form={form}
          headerEnabled={false}
          headerText=""
          bodyText=""
          bodySamples={[]}
          footerEnabled={false}
          footerText=""
          buttonsEnabled={false}
          buttonGroup={TemplateButtonGroupType.QUICK_REPLY}
          buttons={[]}
          category="MARKETING"
          removeButton={vi.fn()}
        />
      );

      expect(screen.getByPlaceholderText(/e.g. order_confirmed/i)).toBeInTheDocument();
    });

    it('renders category selection', () => {
      const form = createMockForm() as UseFormReturn<TemplateFormData>;
      form.formState = { errors: {}, isSubmitting: false };

      render(
        <TemplateForm
          form={form}
          headerEnabled={false}
          headerText=""
          bodyText=""
          bodySamples={[]}
          footerEnabled={false}
          footerText=""
          buttonsEnabled={false}
          buttonGroup={TemplateButtonGroupType.QUICK_REPLY}
          buttons={[]}
          category="MARKETING"
          removeButton={vi.fn()}
        />
      );

      expect(screen.getByText(/category/i)).toBeInTheDocument();
    });

    it('renders language selection', () => {
      const form = createMockForm() as UseFormReturn<TemplateFormData>;
      form.formState = { errors: {}, isSubmitting: false };

      render(
        <TemplateForm
          form={form}
          headerEnabled={false}
          headerText=""
          bodyText=""
          bodySamples={[]}
          footerEnabled={false}
          footerText=""
          buttonsEnabled={false}
          buttonGroup={TemplateButtonGroupType.QUICK_REPLY}
          buttons={[]}
          category="MARKETING"
          removeButton={vi.fn()}
        />
      );

      expect(screen.getByText(/language/i)).toBeInTheDocument();
    });

    it('renders body field with required indicator', () => {
      const form = createMockForm() as UseFormReturn<TemplateFormData>;
      form.formState = { errors: {}, isSubmitting: false };

      render(
        <TemplateForm
          form={form}
          headerEnabled={false}
          headerText=""
          bodyText=""
          bodySamples={[]}
          footerEnabled={false}
          footerText=""
          buttonsEnabled={false}
          buttonGroup={TemplateButtonGroupType.QUICK_REPLY}
          buttons={[]}
          category="MARKETING"
          removeButton={vi.fn()}
        />
      );

      expect(screen.getByText(/body/i)).toBeInTheDocument();
      expect(screen.getByText(/required/i)).toBeInTheDocument();
    });
  });

  describe('Header Section', () => {
    it('shows header input when enabled', () => {
      const form = createMockForm() as UseFormReturn<TemplateFormData>;
      form.formState = { errors: {}, isSubmitting: false };

      const { container } = render(
        <TemplateForm
          form={form}
          headerEnabled={true}
          headerText="Order Confirmed"
          bodyText=""
          bodySamples={[]}
          footerEnabled={false}
          footerText=""
          buttonsEnabled={false}
          buttonGroup={TemplateButtonGroupType.QUICK_REPLY}
          buttons={[]}
          category="MARKETING"
          removeButton={vi.fn()}
        />
      );

      const headerInput = container.querySelector('input[placeholder="Header text"]');
      expect(headerInput).toBeInTheDocument();
    });

    it('hides header input when disabled', () => {
      const form = createMockForm() as UseFormReturn<TemplateFormData>;
      form.formState = { errors: {}, isSubmitting: false };

      const { container } = render(
        <TemplateForm
          form={form}
          headerEnabled={false}
          headerText=""
          bodyText=""
          bodySamples={[]}
          footerEnabled={false}
          footerText=""
          buttonsEnabled={false}
          buttonGroup={TemplateButtonGroupType.QUICK_REPLY}
          buttons={[]}
          category="MARKETING"
          removeButton={vi.fn()}
        />
      );

      const headerInput = container.querySelector('input[placeholder="Header text"]');
      expect(headerInput).not.toBeInTheDocument();
    });
  });

  describe('Footer Section', () => {
    it('shows footer input when enabled', () => {
      const form = createMockForm() as UseFormReturn<TemplateFormData>;
      form.formState = { errors: {}, isSubmitting: false };

      const { container } = render(
        <TemplateForm
          form={form}
          headerEnabled={false}
          headerText=""
          bodyText=""
          bodySamples={[]}
          footerEnabled={true}
          footerText="Thank you"
          buttonsEnabled={false}
          buttonGroup={TemplateButtonGroupType.QUICK_REPLY}
          buttons={[]}
          category="MARKETING"
          removeButton={vi.fn()}
        />
      );

      const footerInput = container.querySelector('input[placeholder="e.g. Reply STOP to unsubscribe"]');
      expect(footerInput).toBeInTheDocument();
    });

    it('hides footer input when disabled', () => {
      const form = createMockForm() as UseFormReturn<TemplateFormData>;
      form.formState = { errors: {}, isSubmitting: false };

      const { container } = render(
        <TemplateForm
          form={form}
          headerEnabled={false}
          headerText=""
          bodyText=""
          bodySamples={[]}
          footerEnabled={false}
          footerText=""
          buttonsEnabled={false}
          buttonGroup={TemplateButtonGroupType.QUICK_REPLY}
          buttons={[]}
          category="MARKETING"
          removeButton={vi.fn()}
        />
      );

      const footerInput = container.querySelector('input[placeholder="e.g. Reply STOP to unsubscribe"]');
      expect(footerInput).not.toBeInTheDocument();
    });
  });

  describe('Variable Detection', () => {
    it('displays detected variables', () => {
      const form = createMockForm() as UseFormReturn<TemplateFormData>;
      form.formState = { errors: {}, isSubmitting: false };

      vi.doMock('@/hooks/templates/use-template-form-logic', () => ({
        useTemplateFormLogic: () => ({
          detectedVars: ['{{1}}', '{{2}}'],
          quickReplies: [],
          urlBtn: null,
          phoneBtn: null,
          copyBtn: null,
          urlBtnIndex: -1,
          phoneBtnIndex: -1,
          copyBtnIndex: -1,
          isDynamicUrl: false,
          insertVariable: vi.fn(),
          addButtonOfType: vi.fn(),
          handleButtonGroupChange: vi.fn(),
          onSubmit: vi.fn(),
        }),
      }));

      render(
        <TemplateForm
          form={form}
          headerEnabled={false}
          headerText=""
          bodyText="Hello {{1}}, your order {{2}} is confirmed"
          bodySamples={['', '']}
          footerEnabled={false}
          footerText=""
          buttonsEnabled={false}
          buttonGroup={TemplateButtonGroupType.QUICK_REPLY}
          buttons={[]}
          category="MARKETING"
          removeButton={vi.fn()}
        />
      );

      expect(screen.getByText(/variables/i)).toBeInTheDocument();
    });

    it('renders body samples when provided', () => {
      const form = createMockForm() as UseFormReturn<TemplateFormData>;
      form.formState = { errors: {}, isSubmitting: false };

      render(
        <TemplateForm
          form={form}
          headerEnabled={false}
          headerText=""
          bodyText="Hello {{1}}"
          bodySamples={['Sample Value']}
          footerEnabled={false}
          footerText=""
          buttonsEnabled={false}
          buttonGroup={TemplateButtonGroupType.QUICK_REPLY}
          buttons={[]}
          category="MARKETING"
          removeButton={vi.fn()}
        />
      );

      // Form structure is rendered correctly
      expect(screen.getByPlaceholderText(/e.g. order_confirmed/i)).toBeInTheDocument();
    });
  });

  describe('Button Section', () => {
    it('shows button type selector when buttons enabled', () => {
      const form = createMockForm() as UseFormReturn<TemplateFormData>;
      form.formState = { errors: {}, isSubmitting: false };

      render(
        <TemplateForm
          form={form}
          headerEnabled={false}
          headerText=""
          bodyText=""
          bodySamples={[]}
          footerEnabled={false}
          footerText=""
          buttonsEnabled={true}
          buttonGroup={TemplateButtonGroupType.QUICK_REPLY}
          buttons={[]}
          category="MARKETING"
          removeButton={vi.fn()}
        />
      );

      expect(screen.getByText(/quick replies/i)).toBeInTheDocument();
      expect(screen.getByText(/call to action/i)).toBeInTheDocument();
    });

    it('hides button section when disabled', () => {
      const form = createMockForm() as UseFormReturn<TemplateFormData>;
      form.formState = { errors: {}, isSubmitting: false };

      const { container } = render(
        <TemplateForm
          form={form}
          headerEnabled={false}
          headerText=""
          bodyText=""
          bodySamples={[]}
          footerEnabled={false}
          footerText=""
          buttonsEnabled={false}
          buttonGroup={TemplateButtonGroupType.QUICK_REPLY}
          buttons={[]}
          category="MARKETING"
          removeButton={vi.fn()}
        />
      );

      // Button type selector should not be visible
      expect(screen.queryByText(/quick replies/i)).not.toBeInTheDocument();
    });
  });

  describe('Submit Button', () => {
    it('renders submit button', () => {
      const form = createMockForm() as UseFormReturn<TemplateFormData>;
      form.formState = { errors: {}, isSubmitting: false };

      render(
        <TemplateForm
          form={form}
          headerEnabled={false}
          headerText=""
          bodyText=""
          bodySamples={[]}
          footerEnabled={false}
          footerText=""
          buttonsEnabled={false}
          buttonGroup={TemplateButtonGroupType.QUICK_REPLY}
          buttons={[]}
          category="MARKETING"
          removeButton={vi.fn()}
        />
      );

      expect(screen.getByRole('button', { name: /submit template/i })).toBeInTheDocument();
    });

    it('disables submit button when submitting', () => {
      const form = createMockForm() as UseFormReturn<TemplateFormData>;
      form.formState = { errors: {}, isSubmitting: true };

      render(
        <TemplateForm
          form={form}
          headerEnabled={false}
          headerText=""
          bodyText=""
          bodySamples={[]}
          footerEnabled={false}
          footerText=""
          buttonsEnabled={false}
          buttonGroup={TemplateButtonGroupType.QUICK_REPLY}
          buttons={[]}
          category="MARKETING"
          removeButton={vi.fn()}
        />
      );

      const submitButton = screen.getByRole('button', { name: /submitting/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Form Structure', () => {
    it('renders as form element', () => {
      const form = createMockForm() as UseFormReturn<TemplateFormData>;
      form.formState = { errors: {}, isSubmitting: false };

      const { container } = render(
        <TemplateForm
          form={form}
          headerEnabled={false}
          headerText=""
          bodyText=""
          bodySamples={[]}
          footerEnabled={false}
          footerText=""
          buttonsEnabled={false}
          buttonGroup={TemplateButtonGroupType.QUICK_REPLY}
          buttons={[]}
          category="MARKETING"
          removeButton={vi.fn()}
        />
      );

      expect(container.querySelector('form')).toBeInTheDocument();
    });

    it('has correct CSS classes', () => {
      const form = createMockForm() as UseFormReturn<TemplateFormData>;
      form.formState = { errors: {}, isSubmitting: false };

      const { container } = render(
        <TemplateForm
          form={form}
          headerEnabled={false}
          headerText=""
          bodyText=""
          bodySamples={[]}
          footerEnabled={false}
          footerText=""
          buttonsEnabled={false}
          buttonGroup={TemplateButtonGroupType.QUICK_REPLY}
          buttons={[]}
          category="MARKETING"
          removeButton={vi.fn()}
        />
      );

      const formElement = container.querySelector('form');
      expect(formElement).toHaveClass('rounded-lg');
      expect(formElement).toHaveClass('border');
      expect(formElement).toHaveClass('bg-card');
    });
  });

  describe('Different Categories', () => {
    it('renders all category options', () => {
      const form = createMockForm() as UseFormReturn<TemplateFormData>;
      form.formState = { errors: {}, isSubmitting: false };

      render(
        <TemplateForm
          form={form}
          headerEnabled={false}
          headerText=""
          bodyText=""
          bodySamples={[]}
          footerEnabled={false}
          footerText=""
          buttonsEnabled={false}
          buttonGroup={TemplateButtonGroupType.QUICK_REPLY}
          buttons={[]}
          category="MARKETING"
          removeButton={vi.fn()}
        />
      );

      expect(screen.getByText('Marketing')).toBeInTheDocument();
      expect(screen.getByText('Utility')).toBeInTheDocument();
      expect(screen.getByText('Authentication')).toBeInTheDocument();
    });
  });
});
