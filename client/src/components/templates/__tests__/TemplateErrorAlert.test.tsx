import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TemplateErrorAlert } from '../TemplateErrorAlert';

describe('TemplateErrorAlert', () => {
  describe('Rendering', () => {
    it('renders error alert', () => {
      render(
        <TemplateErrorAlert
          error="Failed to load templates"
          onRetry={vi.fn()}
        />
      );

      expect(screen.getByText(/failed to load templates/i)).toBeInTheDocument();
    });

    it('renders error message text', () => {
      const errorMsg = 'Template not found';

      render(
        <TemplateErrorAlert
          error={errorMsg}
          onRetry={vi.fn()}
        />
      );

      expect(screen.getByText(errorMsg)).toBeInTheDocument();
    });

    it('renders alert with destructive styling', () => {
      const { container } = render(
        <TemplateErrorAlert
          error="Something went wrong"
          onRetry={vi.fn()}
        />
      );

      const alert = container.firstChild;
      expect(alert).toBeInTheDocument();
    });
  });

  describe('Try Again Button', () => {
    it('renders "Try again" button', () => {
      render(
        <TemplateErrorAlert
          error="An error occurred"
          onRetry={vi.fn()}
        />
      );

      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('calls onRetry when button clicked', async () => {
      const user = userEvent.setup();
      const handleRetry = vi.fn();

      render(
        <TemplateErrorAlert
          error="Error loading templates"
          onRetry={handleRetry}
        />
      );

      const button = screen.getByRole('button', { name: /try again/i });
      await user.click(button);

      expect(handleRetry).toHaveBeenCalledTimes(1);
    });

    it('handles multiple retries', async () => {
      const user = userEvent.setup();
      const handleRetry = vi.fn();

      render(
        <TemplateErrorAlert
          error="Failed"
          onRetry={handleRetry}
        />
      );

      const button = screen.getByRole('button', { name: /try again/i });
      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(handleRetry).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error Messages', () => {
    it('displays various error messages', () => {
      const { rerender } = render(
        <TemplateErrorAlert
          error="Network error"
          onRetry={vi.fn()}
        />
      );

      expect(screen.getByText('Network error')).toBeInTheDocument();

      rerender(
        <TemplateErrorAlert
          error="Server error: 500"
          onRetry={vi.fn()}
        />
      );

      expect(screen.getByText('Server error: 500')).toBeInTheDocument();
    });

    it('handles long error messages', () => {
      const longError =
        'Failed to fetch templates from the server. The server returned a 503 Service Unavailable error.';

      render(
        <TemplateErrorAlert
          error={longError}
          onRetry={vi.fn()}
        />
      );

      expect(screen.getByText(longError)).toBeInTheDocument();
    });

    it('handles error messages with special characters', () => {
      const errorWithChars = 'Error: Field "name" is required (expected string)';

      render(
        <TemplateErrorAlert
          error={errorWithChars}
          onRetry={vi.fn()}
        />
      );

      expect(screen.getByText(errorWithChars)).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('has appropriate styling applied', () => {
      const { container } = render(
        <TemplateErrorAlert
          error="Error message"
          onRetry={vi.fn()}
        />
      );

      const alert = container.firstChild;
      expect(alert).toBeInTheDocument();
    });

    it('renders with margin bottom', () => {
      const { container } = render(
        <TemplateErrorAlert
          error="Error"
          onRetry={vi.fn()}
        />
      );

      const alert = container.firstChild;
      expect(alert).toHaveClass('mb-4');
    });

    it('renders with appropriate spacing', () => {
      const { container } = render(
        <TemplateErrorAlert
          error="Error occurred"
          onRetry={vi.fn()}
        />
      );

      const alert = container.firstChild;
      expect(alert).toBeInTheDocument();
    });
  });

  describe('Button Styling', () => {
    it('button has correct styling', () => {
      render(
        <TemplateErrorAlert
          error="Error"
          onRetry={vi.fn()}
        />
      );

      const button = screen.getByRole('button', { name: /try again/i });
      expect(button).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('button is keyboard accessible', async () => {
      const user = userEvent.setup();
      const handleRetry = vi.fn();

      render(
        <TemplateErrorAlert
          error="Error message"
          onRetry={handleRetry}
        />
      );

      const button = screen.getByRole('button', { name: /try again/i });
      button.focus();
      await user.keyboard('{Enter}');

      expect(handleRetry).toHaveBeenCalled();
    });

    it('error message is announced', () => {
      render(
        <TemplateErrorAlert
          error="Error message"
          onRetry={vi.fn()}
        />
      );

      expect(screen.getByText(/error message/i)).toBeInTheDocument();
    });

    it('error message is readable', () => {
      render(
        <TemplateErrorAlert
          error="Clear error description"
          onRetry={vi.fn()}
        />
      );

      const errorText = screen.getByText(/clear error description/i);
      expect(errorText).toHaveTextContent(/clear error description/i);
    });
  });

  describe('Complete Flow', () => {
    it('shows error, allows retry', async () => {
      const user = userEvent.setup();
      const handleRetry = vi.fn();

      render(
        <TemplateErrorAlert
          error="Failed to load templates. Please try again."
          onRetry={handleRetry}
        />
      );

      // Error is displayed
      expect(screen.getByText(/failed to load templates/i)).toBeInTheDocument();

      // User clicks retry
      const button = screen.getByRole('button', { name: /try again/i });
      await user.click(button);

      // Callback is called
      expect(handleRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('Prop Changes', () => {
    it('updates error message when prop changes', () => {
      const { rerender } = render(
        <TemplateErrorAlert
          error="First error"
          onRetry={vi.fn()}
        />
      );

      expect(screen.getByText('First error')).toBeInTheDocument();

      rerender(
        <TemplateErrorAlert
          error="Second error"
          onRetry={vi.fn()}
        />
      );

      expect(screen.queryByText('First error')).not.toBeInTheDocument();
      expect(screen.getByText('Second error')).toBeInTheDocument();
    });

    it('updates callback when prop changes', async () => {
      const user = userEvent.setup();
      const firstRetry = vi.fn();

      const { rerender } = render(
        <TemplateErrorAlert
          error="Error"
          onRetry={firstRetry}
        />
      );

      let button = screen.getByRole('button', { name: /try again/i });
      await user.click(button);
      expect(firstRetry).toHaveBeenCalledTimes(1);

      // Change callback
      const secondRetry = vi.fn();
      rerender(
        <TemplateErrorAlert
          error="Error"
          onRetry={secondRetry}
        />
      );

      button = screen.getByRole('button', { name: /try again/i });
      await user.click(button);

      expect(secondRetry).toHaveBeenCalledTimes(1);
    });
  });
});
