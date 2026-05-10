import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TemplateForm } from '../index';
import { TemplateButtonGroupType, TemplateButtonType } from '@/types/templates';
import type { UseFormReturn } from 'react-hook-form';
import type { TemplateFormData } from '@/lib/template-form.schema';

const createMockForm = (): UseFormReturn<TemplateFormData> =>
  ({
    register: vi.fn((name) => ({ name })),
    handleSubmit: vi.fn((onSubmit) => vi.fn(() => onSubmit({}))),
    formState: { errors: {}, isSubmitting: false } as any,
    watch: vi.fn(),
    setValue: vi.fn(),
    getValues: vi.fn(),
  }) as unknown as UseFormReturn<TemplateFormData>;

const defaultProps = {
  headerEnabled: false,
  headerText: '',
  bodyText: '',
  bodySamples: [],
  footerEnabled: false,
  footerText: '',
  buttonsEnabled: false,
  buttonGroup: TemplateButtonGroupType.QUICK_REPLY,
  buttons: [] as TemplateFormData['buttons'],
  category: 'MARKETING' as TemplateFormData['category'],
  detectedVars: [],
  quickReplies: [] as TemplateFormData['buttons'],
  urlBtn: undefined,
  phoneBtn: undefined,
  copyBtn: undefined,
  urlBtnIndex: -1,
  phoneBtnIndex: -1,
  copyBtnIndex: -1,
  isDynamicUrl: false,
  onSubmit: vi.fn(),
  removeButton: vi.fn(),
  insertVariable: vi.fn(),
  addButtonOfType: vi.fn(),
  handleButtonGroupChange: vi.fn(),
};

describe('TemplateForm', () => {
  describe('Form Fields', () => {
    it('renders template name field', () => {
      const form = createMockForm();
      render(<TemplateForm form={form} {...defaultProps} />);
      expect(screen.getByPlaceholderText(/e.g. order_confirmed/i)).toBeInTheDocument();
    });

    it('renders category selection', () => {
      const form = createMockForm();
      render(<TemplateForm form={form} {...defaultProps} />);
      expect(screen.getByText(/category/i)).toBeInTheDocument();
    });

    it('renders language selection', () => {
      const form = createMockForm();
      render(<TemplateForm form={form} {...defaultProps} />);
      expect(screen.getByText(/language/i)).toBeInTheDocument();
    });

    it('renders body field with required indicator', () => {
      const form = createMockForm();
      render(<TemplateForm form={form} {...defaultProps} />);
      expect(screen.getByText(/body/i)).toBeInTheDocument();
      expect(screen.getByText(/required/i)).toBeInTheDocument();
    });
  });

  describe('Header Section', () => {
    it('shows header input when enabled', () => {
      const form = createMockForm();
      const { container } = render(
        <TemplateForm form={form} {...defaultProps} headerEnabled={true} headerText="Order Confirmed" />,
      );
      expect(container.querySelector('input[placeholder="Header text"]')).toBeInTheDocument();
    });

    it('hides header input when disabled', () => {
      const form = createMockForm();
      const { container } = render(<TemplateForm form={form} {...defaultProps} />);
      expect(container.querySelector('input[placeholder="Header text"]')).not.toBeInTheDocument();
    });
  });

  describe('Footer Section', () => {
    it('shows footer input when enabled', () => {
      const form = createMockForm();
      const { container } = render(
        <TemplateForm form={form} {...defaultProps} footerEnabled={true} footerText="Thank you" />,
      );
      expect(
        container.querySelector('input[placeholder="e.g. Reply STOP to unsubscribe"]'),
      ).toBeInTheDocument();
    });

    it('hides footer input when disabled', () => {
      const form = createMockForm();
      const { container } = render(<TemplateForm form={form} {...defaultProps} />);
      expect(
        container.querySelector('input[placeholder="e.g. Reply STOP to unsubscribe"]'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Variable Detection', () => {
    it('displays detected variables section', () => {
      const form = createMockForm();
      render(
        <TemplateForm
          form={form}
          {...defaultProps}
          bodyText="Hello {{1}}, your order {{2}} is confirmed"
          bodySamples={['', '']}
          detectedVars={['{{1}}', '{{2}}']}
        />,
      );
      expect(screen.getByText(/variables/i)).toBeInTheDocument();
    });

    it('renders body samples section when detectedVars provided', () => {
      const form = createMockForm();
      render(
        <TemplateForm
          form={form}
          {...defaultProps}
          bodyText="Hello {{1}}"
          bodySamples={['Sample Value']}
          detectedVars={['{{1}}']}
        />,
      );
      expect(screen.getByText(/sample values/i)).toBeInTheDocument();
    });
  });

  describe('Button Section', () => {
    it('shows button type selector when buttons enabled', () => {
      const form = createMockForm();
      render(<TemplateForm form={form} {...defaultProps} buttonsEnabled={true} />);
      expect(screen.getByText(/quick replies/i)).toBeInTheDocument();
      expect(screen.getByText(/call to action/i)).toBeInTheDocument();
    });

    it('hides button section when disabled', () => {
      const form = createMockForm();
      render(<TemplateForm form={form} {...defaultProps} />);
      expect(screen.queryByText(/quick replies/i)).not.toBeInTheDocument();
    });
  });

  describe('Submit Button', () => {
    it('renders submit button', () => {
      const form = createMockForm();
      render(<TemplateForm form={form} {...defaultProps} />);
      expect(screen.getByRole('button', { name: /submit template/i })).toBeInTheDocument();
    });

    it('disables submit button when submitting', () => {
      const form = createMockForm();
      form.formState = { errors: {}, isSubmitting: true } as any;
      render(<TemplateForm form={form} {...defaultProps} />);
      expect(screen.getByRole('button', { name: /submitting/i })).toBeDisabled();
    });
  });

  describe('Form Structure', () => {
    it('renders as form element', () => {
      const form = createMockForm();
      const { container } = render(<TemplateForm form={form} {...defaultProps} />);
      expect(container.querySelector('form')).toBeInTheDocument();
    });

    it('has correct CSS classes', () => {
      const form = createMockForm();
      const { container } = render(<TemplateForm form={form} {...defaultProps} />);
      const formElement = container.querySelector('form');
      expect(formElement).toHaveClass('rounded-lg');
      expect(formElement).toHaveClass('border');
      expect(formElement).toHaveClass('bg-card');
    });
  });

  describe('Different Categories', () => {
    it('renders all category options', () => {
      const form = createMockForm();
      render(<TemplateForm form={form} {...defaultProps} />);
      expect(screen.getByText('Marketing')).toBeInTheDocument();
      expect(screen.getByText('Utility')).toBeInTheDocument();
      expect(screen.getByText('Authentication')).toBeInTheDocument();
    });

    it('shows copy code section only for AUTHENTICATION category', () => {
      const form = createMockForm();
      render(
        <TemplateForm
          form={form}
          {...defaultProps}
          buttonsEnabled={true}
          buttonGroup={TemplateButtonGroupType.CTA}
          category="AUTHENTICATION"
        />,
      );
      expect(screen.getByText(/copy code/i)).toBeInTheDocument();
    });

    it('hides copy code section for non-AUTHENTICATION categories', () => {
      const form = createMockForm();
      render(
        <TemplateForm
          form={form}
          {...defaultProps}
          buttonsEnabled={true}
          buttonGroup={TemplateButtonGroupType.CTA}
          category="MARKETING"
        />,
      );
      expect(screen.queryByText(/copy code/i)).not.toBeInTheDocument();
    });
  });

  describe('Quick Reply Buttons', () => {
    it('renders quick reply section when button group is QUICK_REPLY', () => {
      const form = createMockForm();
      render(
        <TemplateForm
          form={form}
          {...defaultProps}
          buttonsEnabled={true}
          buttonGroup={TemplateButtonGroupType.QUICK_REPLY}
        />,
      );
      expect(screen.getByText(/up to 3 quick reply buttons/i)).toBeInTheDocument();
      expect(screen.getByText(/add quick reply/i)).toBeInTheDocument();
    });

    it('does not render quick reply section when button group is CTA', () => {
      const form = createMockForm();
      render(
        <TemplateForm
          form={form}
          {...defaultProps}
          buttonsEnabled={true}
          buttonGroup={TemplateButtonGroupType.CTA}
        />,
      );
      expect(screen.queryByText(/up to 3 quick reply buttons/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/add quick reply/i)).not.toBeInTheDocument();
    });
  });

  describe('CTA Buttons', () => {
    it('renders CTA section when button group is CTA', () => {
      const form = createMockForm();
      render(
        <TemplateForm
          form={form}
          {...defaultProps}
          buttonsEnabled={true}
          buttonGroup={TemplateButtonGroupType.CTA}
        />,
      );
      expect(screen.getByText(/add url and\/or phone number buttons/i)).toBeInTheDocument();
    });

    it('renders Visit Website section in CTA mode', () => {
      const form = createMockForm();
      render(
        <TemplateForm
          form={form}
          {...defaultProps}
          buttonsEnabled={true}
          buttonGroup={TemplateButtonGroupType.CTA}
        />,
      );
      expect(screen.getByText(/visit website/i)).toBeInTheDocument();
    });

    it('renders Call Phone Number section in CTA mode', () => {
      const form = createMockForm();
      render(
        <TemplateForm
          form={form}
          {...defaultProps}
          buttonsEnabled={true}
          buttonGroup={TemplateButtonGroupType.CTA}
        />,
      );
      expect(screen.getByText(/call phone number/i)).toBeInTheDocument();
    });
  });

  describe('Button Group Toggle', () => {
    it('calls handleButtonGroupChange when switching button groups', async () => {
      const user = userEvent.setup();
      const form = createMockForm();
      const mockHandleButtonGroupChange = vi.fn();

      render(
        <TemplateForm
          form={form}
          {...defaultProps}
          buttonsEnabled={true}
          buttonGroup={TemplateButtonGroupType.QUICK_REPLY}
          handleButtonGroupChange={mockHandleButtonGroupChange}
        />,
      );

      const ctaButton = screen.getByText(/call to action/i);
      await user.click(ctaButton);
      expect(mockHandleButtonGroupChange).toHaveBeenCalledWith(TemplateButtonGroupType.CTA);
    });
  });

  describe('Dynamic URL', () => {
    it('renders URL button inputs when urlBtn is provided', () => {
      const form = createMockForm();
      const urlBtn = { type: TemplateButtonType.URL, text: 'Visit', url: 'https://example.com', phone_number: '', example: '' };
      render(
        <TemplateForm
          form={form}
          {...defaultProps}
          buttonsEnabled={true}
          buttonGroup={TemplateButtonGroupType.CTA}
          buttons={[urlBtn]}
          urlBtn={urlBtn}
          urlBtnIndex={0}
        />,
      );
      expect(screen.getByPlaceholderText(/button text \(max 25 chars\)/i)).toBeInTheDocument();
    });

    it('hides example URL input when isDynamicUrl is false', () => {
      const form = createMockForm();
      const urlBtn = { type: TemplateButtonType.URL, text: 'Visit', url: 'https://example.com', phone_number: '', example: '' };
      const { container } = render(
        <TemplateForm
          form={form}
          {...defaultProps}
          buttonsEnabled={true}
          buttonGroup={TemplateButtonGroupType.CTA}
          buttons={[urlBtn]}
          urlBtn={urlBtn}
          urlBtnIndex={0}
          isDynamicUrl={false}
        />,
      );
      expect(container.querySelectorAll('input[placeholder*="Example URL"]').length).toBe(0);
    });
  });

  describe('Sample Values', () => {
    it('renders form with bodySamples data', () => {
      const form = createMockForm();
      const { container } = render(
        <TemplateForm
          form={form}
          {...defaultProps}
          bodyText="Hello {{1}}, your order {{2}}"
          bodySamples={['John', 'ORD123']}
          detectedVars={['{{1}}', '{{2}}']}
        />,
      );
      expect(container.querySelector('form')).toBeInTheDocument();
    });

    it('renders form without bodySamples', () => {
      const form = createMockForm();
      const { container } = render(
        <TemplateForm form={form} {...defaultProps} bodyText="Hello, your order is confirmed" />,
      );
      expect(container.querySelector('form')).toBeInTheDocument();
    });
  });
});
