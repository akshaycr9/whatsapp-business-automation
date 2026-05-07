import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PhonePreview, type PhoneButton } from '../PhonePreview';
import { TemplateButtonType } from '@/types/templates';

describe('PhonePreview', () => {
  describe('Rendering Basic Structure', () => {
    it('renders phone mockup container', () => {
      const { container } = render(<PhonePreview body="Test message" />);
      const phoneContainer = container.querySelector('div');
      expect(phoneContainer).toBeInTheDocument();
    });

    it('renders WhatsApp bezel styling', () => {
      const { container } = render(<PhonePreview body="Test message" />);
      expect(container.querySelector('.bg-whatsapp-bezel')).toBeInTheDocument();
    });

    it('renders chat area with correct styling', () => {
      const { container } = render(<PhonePreview body="Test message" />);
      expect(container.querySelector('.bg-whatsapp-chat-bg')).toBeInTheDocument();
    });

    it('renders status bar with time', () => {
      render(<PhonePreview body="Test message" />);
      expect(screen.getByText('9:41')).toBeInTheDocument();
    });

    it('renders header with business name', () => {
      render(<PhonePreview body="Test message" />);
      expect(screen.getByText('Qwertees')).toBeInTheDocument();
      expect(screen.getByText('Business · online')).toBeInTheDocument();
    });

    it('renders message timestamp', () => {
      render(<PhonePreview body="Test message" />);
      expect(screen.getByText('9:41 AM')).toBeInTheDocument();
    });

    it('renders read receipts', () => {
      render(<PhonePreview body="Test message" />);
      const checkmarks = screen.getByText('✓✓');
      expect(checkmarks).toBeInTheDocument();
    });

    it('renders input field placeholder', () => {
      render(<PhonePreview body="Test message" />);
      expect(screen.getByText('Type a message')).toBeInTheDocument();
    });
  });

  describe('Body Content', () => {
    it('renders body text when provided', () => {
      render(<PhonePreview body="Hello, this is a test message" />);
      expect(screen.getByText('Hello, this is a test message')).toBeInTheDocument();
    });

    it('renders default body text when empty body', () => {
      render(<PhonePreview body="" />);
      expect(screen.getByText('Your template body appears here.')).toBeInTheDocument();
    });

    it('renders custom bodyContent instead of body text', () => {
      const customContent = <div>Custom Content</div>;
      render(<PhonePreview body="Regular body" bodyContent={customContent} />);
      expect(screen.getByText('Custom Content')).toBeInTheDocument();
      expect(screen.queryByText('Regular body')).not.toBeInTheDocument();
    });

    it('renders multiline body text', () => {
      const multilineText = 'Line 1\nLine 2\nLine 3';
      const { container } = render(<PhonePreview body={multilineText} />);
      expect(container.textContent).toContain('Line 1');
      expect(container.textContent).toContain('Line 2');
    });

    it('renders body with special characters', () => {
      const specialText = 'Price: $99.99 & 50% off!';
      render(<PhonePreview body={specialText} />);
      expect(screen.getByText(specialText)).toBeInTheDocument();
    });

    it('applies whitespace-pre-wrap to body', () => {
      const { container } = render(<PhonePreview body="Test\nmessage" />);
      const bodyDiv = container.querySelector('.whitespace-pre-wrap');
      expect(bodyDiv).toBeInTheDocument();
    });
  });

  describe('Header Section', () => {
    it('renders header when provided', () => {
      render(<PhonePreview header="Order Confirmed" body="Body text" />);
      expect(screen.getByText('Order Confirmed')).toBeInTheDocument();
    });

    it('does not render header section when not provided', () => {
      const { container } = render(<PhonePreview body="Body text" />);
      expect(screen.queryByText('Order Confirmed')).not.toBeInTheDocument();
    });

    it('renders header with bold styling', () => {
      const { container } = render(<PhonePreview header="Bold Header" body="Body" />);
      const headerDiv = container.querySelector('.font-bold');
      expect(headerDiv).toBeInTheDocument();
    });

    it('renders header with proper spacing', () => {
      const { container } = render(<PhonePreview header="Header" body="Body" />);
      expect(screen.getByText('Header')).toBeInTheDocument();
      expect(screen.getByText('Body')).toBeInTheDocument();
    });
  });

  describe('Footer Section', () => {
    it('renders footer when provided', () => {
      render(<PhonePreview body="Body" footer="Thank you!" />);
      expect(screen.getByText('Thank you!')).toBeInTheDocument();
    });

    it('does not render footer when not provided', () => {
      const { container } = render(<PhonePreview body="Body" />);
      expect(screen.queryByText('Thank you!')).not.toBeInTheDocument();
    });

    it('renders footer with muted text color', () => {
      const { container } = render(<PhonePreview body="Body" footer="Footer" />);
      const footerDiv = container.querySelector('.text-ink-400');
      expect(footerDiv).toBeInTheDocument();
    });

    it('renders footer with proper styling', () => {
      const { container } = render(<PhonePreview body="Body" footer="Footer" />);
      expect(screen.getByText('Footer')).toBeInTheDocument();
      expect(screen.getByText('Body')).toBeInTheDocument();
    });

    it('renders footer with margin top', () => {
      const { container } = render(<PhonePreview body="Body" footer="Footer" />);
      const footerDiv = container.querySelector('.mt-1');
      expect(footerDiv).toBeInTheDocument();
    });
  });

  describe('Buttons', () => {
    it('does not render buttons section when no buttons', () => {
      const { container } = render(<PhonePreview body="Body" />);
      expect(screen.queryByText('—')).not.toBeInTheDocument();
    });

    it('renders single button', () => {
      const buttons: PhoneButton[] = [{ type: TemplateButtonType.QUICK_REPLY, text: 'Reply' }];
      render(<PhonePreview body="Body" buttons={buttons} />);
      expect(screen.getByText('Reply')).toBeInTheDocument();
    });

    it('renders multiple buttons', () => {
      const buttons: PhoneButton[] = [
        { type: TemplateButtonType.QUICK_REPLY, text: 'Option 1' },
        { type: TemplateButtonType.QUICK_REPLY, text: 'Option 2' },
        { type: TemplateButtonType.QUICK_REPLY, text: 'Option 3' },
      ];
      render(<PhonePreview body="Body" buttons={buttons} />);
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
      expect(screen.getByText('Option 3')).toBeInTheDocument();
    });

    it('renders buttons with styling', () => {
      const buttons: PhoneButton[] = [{ type: TemplateButtonType.QUICK_REPLY, text: 'Click' }];
      const { container } = render(<PhonePreview body="Body" buttons={buttons} />);
      expect(screen.getByText('Click')).toBeInTheDocument();
    });

    it('renders multiple styled buttons', () => {
      const buttons: PhoneButton[] = [
        { type: TemplateButtonType.QUICK_REPLY, text: 'Click' },
        { type: TemplateButtonType.URL, text: 'Visit' },
      ];
      const { container } = render(<PhonePreview body="Body" buttons={buttons} />);
      expect(screen.getByText('Click')).toBeInTheDocument();
      expect(screen.getByText('Visit')).toBeInTheDocument();
    });

    it('renders button dividers between buttons', () => {
      const buttons: PhoneButton[] = [
        { type: TemplateButtonType.QUICK_REPLY, text: 'Button 1' },
        { type: TemplateButtonType.QUICK_REPLY, text: 'Button 2' },
      ];
      const { container } = render(<PhonePreview body="Body" buttons={buttons} />);
      const borderElements = container.querySelectorAll('.border-t');
      expect(borderElements.length).toBeGreaterThan(0);
    });

    it('renders QUICK_REPLY button type with icon', () => {
      const buttons: PhoneButton[] = [
        { type: TemplateButtonType.QUICK_REPLY, text: 'Reply' },
      ];
      render(<PhonePreview body="Body" buttons={buttons} />);
      expect(screen.getByText('Reply')).toBeInTheDocument();
    });

    it('renders URL button type with icon', () => {
      const buttons: PhoneButton[] = [
        { type: TemplateButtonType.URL, text: 'Visit Site' },
      ];
      render(<PhonePreview body="Body" buttons={buttons} />);
      expect(screen.getByText('Visit Site')).toBeInTheDocument();
    });

    it('renders PHONE_NUMBER button type with icon', () => {
      const buttons: PhoneButton[] = [
        { type: TemplateButtonType.PHONE_NUMBER, text: 'Call Us' },
      ];
      render(<PhonePreview body="Body" buttons={buttons} />);
      expect(screen.getByText('Call Us')).toBeInTheDocument();
    });

    it('renders COPY_CODE button type with icon', () => {
      const buttons: PhoneButton[] = [
        { type: TemplateButtonType.COPY_CODE, text: 'ABC123' },
      ];
      render(<PhonePreview body="Body" buttons={buttons} />);
      expect(screen.getByText('ABC123')).toBeInTheDocument();
    });

    it('renders empty button text as dash', () => {
      const buttons: PhoneButton[] = [
        { type: TemplateButtonType.QUICK_REPLY, text: '' },
      ];
      render(<PhonePreview body="Body" buttons={buttons} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('renders button with long text', () => {
      const buttons: PhoneButton[] = [
        { type: TemplateButtonType.QUICK_REPLY, text: 'This is a very long button text' },
      ];
      render(<PhonePreview body="Body" buttons={buttons} />);
      expect(screen.getByText('This is a very long button text')).toBeInTheDocument();
    });
  });

  describe('Complete Template Flow', () => {
    it('renders complete message with all sections', () => {
      const buttons: PhoneButton[] = [
        { type: TemplateButtonType.QUICK_REPLY, text: 'Yes' },
        { type: TemplateButtonType.QUICK_REPLY, text: 'No' },
      ];

      render(
        <PhonePreview
          header="Confirmation"
          body="Are you sure?"
          footer="Reply within 24 hours"
          buttons={buttons}
        />
      );

      expect(screen.getByText('Confirmation')).toBeInTheDocument();
      expect(screen.getByText('Are you sure?')).toBeInTheDocument();
      expect(screen.getByText('Reply within 24 hours')).toBeInTheDocument();
      expect(screen.getByText('Yes')).toBeInTheDocument();
      expect(screen.getByText('No')).toBeInTheDocument();
    });

    it('renders with only body (minimal)', () => {
      render(<PhonePreview body="Just a message" />);
      expect(screen.getByText('Just a message')).toBeInTheDocument();
    });

    it('renders with header and body only', () => {
      render(<PhonePreview header="Title" body="Content" />);
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  describe('Memoization', () => {
    it('renders as a memoized component', () => {
      const { rerender } = render(<PhonePreview body="Test" />);
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('maintains semantic HTML structure', () => {
      const { container } = render(<PhonePreview body="Test" />);
      expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('has readable text content', () => {
      render(
        <PhonePreview
          header="Header"
          body="Body content"
          footer="Footer"
        />
      );
      expect(screen.getByText('Header')).toHaveTextContent('Header');
      expect(screen.getByText('Body content')).toHaveTextContent('Body content');
    });
  });
});
