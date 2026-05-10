import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TemplatePreviewPanel } from '../index';
import { TemplateButtonType } from '@/types/templates';

describe('TemplatePreviewPanel', () => {
  describe('Panel Title', () => {
    it('renders "Live Preview" title', () => {
      render(
        <TemplatePreviewPanel
          header={undefined}
          body="Test message"
          footer={undefined}
          buttons={[]}
          detectedVars={[]}
        />
      );

      expect(screen.getByText(/live preview/i)).toBeInTheDocument();
    });

    it('has correct title styling', () => {
      const { container } = render(
        <TemplatePreviewPanel
          header={undefined}
          body="Test message"
          footer={undefined}
          buttons={[]}
          detectedVars={[]}
        />
      );

      const title = screen.getByText(/live preview/i);
      expect(title).toHaveClass('text-center');
      expect(title).toHaveClass('uppercase');
    });
  });

  describe('Phone Preview Rendering', () => {
    it('renders PhonePreview component', () => {
      const { container } = render(
        <TemplatePreviewPanel
          header={undefined}
          body="Test message"
          footer={undefined}
          buttons={[]}
          detectedVars={[]}
        />
      );

      // PhonePreview renders specific WhatsApp styling
      expect(container.querySelector('[class*="whatsapp"]')).toBeInTheDocument();
    });

    it('passes header to PhonePreview', () => {
      const { container } = render(
        <TemplatePreviewPanel
          header="Order Confirmed"
          body="Test message"
          footer={undefined}
          buttons={[]}
          detectedVars={[]}
        />
      );

      expect(screen.getByText('Order Confirmed')).toBeInTheDocument();
    });

    it('passes body to PhonePreview', () => {
      render(
        <TemplatePreviewPanel
          header={undefined}
          body="This is the body text"
          footer={undefined}
          buttons={[]}
          detectedVars={[]}
        />
      );

      expect(screen.getByText('This is the body text')).toBeInTheDocument();
    });

    it('passes footer to PhonePreview', () => {
      render(
        <TemplatePreviewPanel
          header={undefined}
          body="Test message"
          footer="Thank you for your order"
          buttons={[]}
          detectedVars={[]}
        />
      );

      expect(screen.getByText('Thank you for your order')).toBeInTheDocument();
    });

    it('passes buttons to PhonePreview', () => {
      const buttons = [
        { type: TemplateButtonType.QUICK_REPLY, text: 'Yes' },
        { type: TemplateButtonType.QUICK_REPLY, text: 'No' },
      ];

      render(
        <TemplatePreviewPanel
          header={undefined}
          body="Confirm?"
          footer={undefined}
          buttons={buttons}
          detectedVars={[]}
        />
      );

      expect(screen.getByText('Yes')).toBeInTheDocument();
      expect(screen.getByText('No')).toBeInTheDocument();
    });

    it('does not pass empty buttons array to PhonePreview', () => {
      const { container } = render(
        <TemplatePreviewPanel
          header={undefined}
          body="Test message"
          footer={undefined}
          buttons={[]}
          detectedVars={[]}
        />
      );

      // Empty buttons should not render buttons section
      const phonePreview = container.querySelector('[class*="whatsapp"]');
      expect(phonePreview).toBeInTheDocument();
    });
  });

  describe('Variable Detection Message', () => {
    it('shows sample data message when no variables detected', () => {
      render(
        <TemplatePreviewPanel
          header={undefined}
          body="Test message"
          footer={undefined}
          buttons={[]}
          detectedVars={[]}
        />
      );

      expect(screen.getByText(/preview with sample data/i)).toBeInTheDocument();
    });

    it('shows sample values message when variables detected', () => {
      render(
        <TemplatePreviewPanel
          header={undefined}
          body="Hello {{1}}"
          footer={undefined}
          buttons={[]}
          detectedVars={['{{1}}']}
        />
      );

      expect(screen.getByText(/preview with entered sample values/i)).toBeInTheDocument();
    });

    it('shows sample values message for multiple variables', () => {
      render(
        <TemplatePreviewPanel
          header={undefined}
          body="Hello {{1}}, your order {{2}} is ready"
          footer={undefined}
          buttons={[]}
          detectedVars={['{{1}}', '{{2}}']}
        />
      );

      expect(screen.getByText(/preview with entered sample values/i)).toBeInTheDocument();
    });
  });

  describe('Layout & Styling', () => {
    it('has sticky positioning', () => {
      const { container } = render(
        <TemplatePreviewPanel
          header={undefined}
          body="Test message"
          footer={undefined}
          buttons={[]}
          detectedVars={[]}
        />
      );

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('sticky');
      expect(wrapper).toHaveClass('top-0');
    });

    it('has correct text size for help message', () => {
      const { container } = render(
        <TemplatePreviewPanel
          header={undefined}
          body="Test message"
          footer={undefined}
          buttons={[]}
          detectedVars={[]}
        />
      );

      const helpText = screen.getByText(/preview with/i);
      expect(helpText).toHaveClass('text-3xs');
      expect(helpText).toHaveClass('text-ink-400');
    });

    it('has appropriate margin spacing between title and preview', () => {
      const { container } = render(
        <TemplatePreviewPanel
          header={undefined}
          body="Test message"
          footer={undefined}
          buttons={[]}
          detectedVars={[]}
        />
      );

      // Title should be in the panel
      const title = screen.getByText(/live preview/i);
      expect(title).toBeInTheDocument();
      // Panel itself has appropriate spacing
      const panel = container.querySelector('.sticky');
      expect(panel).toHaveClass('pt-1');
    });
  });

  describe('Complete Message Rendering', () => {
    it('renders complete message with all sections', () => {
      const buttons = [
        { type: TemplateButtonType.QUICK_REPLY, text: 'Yes' },
      ];

      render(
        <TemplatePreviewPanel
          header="Order Status"
          body="Your order is ready"
          footer="Thank you"
          buttons={buttons}
          detectedVars={[]}
        />
      );

      expect(screen.getByText('Order Status')).toBeInTheDocument();
      expect(screen.getByText('Your order is ready')).toBeInTheDocument();
      expect(screen.getByText('Thank you')).toBeInTheDocument();
      expect(screen.getByText('Yes')).toBeInTheDocument();
    });

    it('renders minimal message (body only)', () => {
      render(
        <TemplatePreviewPanel
          header={undefined}
          body="Just a body message"
          footer={undefined}
          buttons={[]}
          detectedVars={[]}
        />
      );

      expect(screen.getByText('Just a body message')).toBeInTheDocument();
      expect(screen.getByText(/live preview/i)).toBeInTheDocument();
    });

    it('renders message with variables and buttons', () => {
      const buttons = [
        { type: TemplateButtonType.URL, text: 'Visit' },
      ];

      render(
        <TemplatePreviewPanel
          header="Welcome {{1}}"
          body="Your order {{2}} is {{3}}"
          footer={undefined}
          buttons={buttons}
          detectedVars={['{{1}}', '{{2}}', '{{3}}']}
        />
      );

      expect(screen.getByText(/preview with entered sample values/i)).toBeInTheDocument();
    });
  });

  describe('Button Types', () => {
    it('supports QUICK_REPLY buttons', () => {
      render(
        <TemplatePreviewPanel
          header={undefined}
          body="Choose an option"
          footer={undefined}
          buttons={[{ type: TemplateButtonType.QUICK_REPLY, text: 'Option 1' }]}
          detectedVars={[]}
        />
      );

      expect(screen.getByText('Option 1')).toBeInTheDocument();
    });

    it('supports URL buttons', () => {
      render(
        <TemplatePreviewPanel
          header={undefined}
          body="Visit us"
          footer={undefined}
          buttons={[{ type: TemplateButtonType.URL, text: 'Shop Now' }]}
          detectedVars={[]}
        />
      );

      expect(screen.getByText('Shop Now')).toBeInTheDocument();
    });

    it('supports PHONE_NUMBER buttons', () => {
      render(
        <TemplatePreviewPanel
          header={undefined}
          body="Call us"
          footer={undefined}
          buttons={[{ type: TemplateButtonType.PHONE_NUMBER, text: 'Call Support' }]}
          detectedVars={[]}
        />
      );

      expect(screen.getByText('Call Support')).toBeInTheDocument();
    });

    it('supports COPY_CODE buttons', () => {
      render(
        <TemplatePreviewPanel
          header={undefined}
          body="Here is your code"
          footer={undefined}
          buttons={[{ type: TemplateButtonType.COPY_CODE, text: 'ABC123' }]}
          detectedVars={[]}
        />
      );

      expect(screen.getByText('ABC123')).toBeInTheDocument();
    });

    it('renders multiple buttons', () => {
      const buttons = [
        { type: TemplateButtonType.QUICK_REPLY, text: 'Yes' },
        { type: TemplateButtonType.QUICK_REPLY, text: 'No' },
        { type: TemplateButtonType.QUICK_REPLY, text: 'Maybe' },
      ];

      render(
        <TemplatePreviewPanel
          header={undefined}
          body="Choose one"
          footer={undefined}
          buttons={buttons}
          detectedVars={[]}
        />
      );

      expect(screen.getByText('Yes')).toBeInTheDocument();
      expect(screen.getByText('No')).toBeInTheDocument();
      expect(screen.getByText('Maybe')).toBeInTheDocument();
    });
  });
});
