import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FieldGroup } from '../FieldGroup';

describe('FieldGroup', () => {
  describe('Rendering', () => {
    it('renders label text', () => {
      render(
        <FieldGroup label="Test Label">
          <input type="text" />
        </FieldGroup>
      );
      expect(screen.getByText('Test Label')).toBeInTheDocument();
    });

    it('renders children content', () => {
      render(
        <FieldGroup label="Test Label">
          <input type="text" placeholder="Test input" />
        </FieldGroup>
      );
      expect(screen.getByPlaceholderText('Test input')).toBeInTheDocument();
    });

    it('renders multiple children', () => {
      render(
        <FieldGroup label="Test Label">
          <input type="text" />
          <span>Additional content</span>
        </FieldGroup>
      );
      expect(screen.getByText('Additional content')).toBeInTheDocument();
    });
  });

  describe('Label Styling', () => {
    it('applies label styling classes', () => {
      const { container } = render(
        <FieldGroup label="Test Label">
          <input />
        </FieldGroup>
      );
      const label = screen.getByText('Test Label');
      expect(label.parentElement).toHaveClass('text-2xs');
      expect(label.parentElement).toHaveClass('font-[650]');
      expect(label.parentElement).toHaveClass('uppercase');
      expect(label.parentElement).toHaveClass('text-ink-700');
    });

    it('applies correct letter spacing to label', () => {
      const { container } = render(
        <FieldGroup label="Test Label">
          <input />
        </FieldGroup>
      );
      const label = screen.getByText('Test Label');
      expect(label.parentElement).toHaveClass('tracking-[0.05em]');
    });
  });

  describe('Hint Text', () => {
    it('renders hint text when provided', () => {
      render(
        <FieldGroup label="Test Label" hint="This is a hint">
          <input />
        </FieldGroup>
      );
      expect(screen.getByText('This is a hint')).toBeInTheDocument();
    });

    it('does not render hint when not provided', () => {
      const { container } = render(
        <FieldGroup label="Test Label">
          <input />
        </FieldGroup>
      );
      expect(screen.queryByText('This is a hint')).not.toBeInTheDocument();
    });

    it('applies hint styling classes', () => {
      render(
        <FieldGroup label="Test Label" hint="This is a hint">
          <input />
        </FieldGroup>
      );
      const hint = screen.getByText('This is a hint');
      expect(hint).toHaveClass('font-medium');
      expect(hint).toHaveClass('text-ink-500');
      expect(hint).toHaveClass('normal-case');
      expect(hint).toHaveClass('tracking-normal');
    });
  });

  describe('Label and Hint Layout', () => {
    it('displays label and hint in same row when both present', () => {
      const { container } = render(
        <FieldGroup label="Test Label" hint="Hint">
          <input />
        </FieldGroup>
      );
      const headerDiv = container.querySelector('.flex');
      expect(headerDiv).toHaveClass('justify-between');
      expect(headerDiv).toHaveClass('items-center');
    });

    it('applies margin bottom to field group', () => {
      const { container } = render(
        <FieldGroup label="Test Label">
          <input />
        </FieldGroup>
      );
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('mb-[18px]');
    });

    it('applies margin bottom to label area', () => {
      const { container } = render(
        <FieldGroup label="Test Label">
          <input />
        </FieldGroup>
      );
      const label = screen.getByText('Test Label');
      expect(label.parentElement).toHaveClass('mb-1.5');
    });
  });

  describe('Different Content Types', () => {
    it('renders input as children', () => {
      render(
        <FieldGroup label="Input Field">
          <input type="text" data-testid="test-input" />
        </FieldGroup>
      );
      expect(screen.getByTestId('test-input')).toBeInTheDocument();
    });

    it('renders textarea as children', () => {
      render(
        <FieldGroup label="Textarea Field">
          <textarea data-testid="test-textarea" />
        </FieldGroup>
      );
      expect(screen.getByTestId('test-textarea')).toBeInTheDocument();
    });

    it('renders select as children', () => {
      render(
        <FieldGroup label="Select Field">
          <select data-testid="test-select">
            <option>Option 1</option>
          </select>
        </FieldGroup>
      );
      expect(screen.getByTestId('test-select')).toBeInTheDocument();
    });

    it('renders custom components as children', () => {
      const CustomComponent = () => <div data-testid="custom">Custom</div>;
      render(
        <FieldGroup label="Custom Field">
          <CustomComponent />
        </FieldGroup>
      );
      expect(screen.getByTestId('custom')).toBeInTheDocument();
    });
  });

  describe('Label Text Variations', () => {
    it('renders long label text', () => {
      render(
        <FieldGroup label="This is a very long label text that should still display correctly">
          <input />
        </FieldGroup>
      );
      expect(
        screen.getByText('This is a very long label text that should still display correctly')
      ).toBeInTheDocument();
    });

    it('renders label with special characters', () => {
      render(
        <FieldGroup label="Label (with special chars) @#$">
          <input />
        </FieldGroup>
      );
      expect(screen.getByText('Label (with special chars) @#$')).toBeInTheDocument();
    });

    it('renders label with numbers', () => {
      render(
        <FieldGroup label="Field 123">
          <input />
        </FieldGroup>
      );
      expect(screen.getByText('Field 123')).toBeInTheDocument();
    });
  });
});
