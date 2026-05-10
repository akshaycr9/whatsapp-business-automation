import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { CategoryChip } from '../index';

describe('CategoryChip', () => {
  describe('Rendering', () => {
    it('renders MARKETING category with correct text', () => {
      const { container } = render(<CategoryChip category="MARKETING" />);
      expect(container.textContent).toBe('MARKETING');
    });

    it('renders UTILITY category with correct text', () => {
      const { container } = render(<CategoryChip category="UTILITY" />);
      expect(container.textContent).toBe('UTILITY');
    });

    it('renders AUTHENTICATION category with correct text', () => {
      const { container } = render(<CategoryChip category="AUTHENTICATION" />);
      expect(container.textContent).toBe('AUTHENTICATION');
    });
  });

  describe('Styling - MARKETING Category', () => {
    it('applies MARKETING background class', () => {
      const { container } = render(<CategoryChip category="MARKETING" />);
      const chip = container.querySelector('span');
      expect(chip).toHaveClass('bg-category-marketing-bg');
    });

    it('applies MARKETING text class', () => {
      const { container } = render(<CategoryChip category="MARKETING" />);
      const chip = container.querySelector('span');
      expect(chip).toHaveClass('text-category-marketing-text');
    });

    it('applies MARKETING border class', () => {
      const { container } = render(<CategoryChip category="MARKETING" />);
      const chip = container.querySelector('span');
      expect(chip).toHaveClass('border-category-marketing-border');
    });
  });

  describe('Styling - UTILITY Category', () => {
    it('applies UTILITY background class', () => {
      const { container } = render(<CategoryChip category="UTILITY" />);
      const chip = container.querySelector('span');
      expect(chip).toHaveClass('bg-category-utility-bg');
    });

    it('applies UTILITY text class', () => {
      const { container } = render(<CategoryChip category="UTILITY" />);
      const chip = container.querySelector('span');
      expect(chip).toHaveClass('text-category-utility-text');
    });

    it('applies UTILITY border class', () => {
      const { container } = render(<CategoryChip category="UTILITY" />);
      const chip = container.querySelector('span');
      expect(chip).toHaveClass('border-category-utility-border');
    });
  });

  describe('Styling - AUTHENTICATION Category', () => {
    it('applies AUTHENTICATION background class', () => {
      const { container } = render(<CategoryChip category="AUTHENTICATION" />);
      const chip = container.querySelector('span');
      expect(chip).toHaveClass('bg-category-auth-bg');
    });

    it('applies AUTHENTICATION text class', () => {
      const { container } = render(<CategoryChip category="AUTHENTICATION" />);
      const chip = container.querySelector('span');
      expect(chip).toHaveClass('text-category-auth-text');
    });

    it('applies AUTHENTICATION border class', () => {
      const { container } = render(<CategoryChip category="AUTHENTICATION" />);
      const chip = container.querySelector('span');
      expect(chip).toHaveClass('border-category-auth-border');
    });
  });

  describe('Base Classes', () => {
    it('applies base styling classes', () => {
      const { container } = render(<CategoryChip category="UTILITY" />);
      const chip = container.querySelector('span');
      expect(chip).toHaveClass('inline-flex');
      expect(chip).toHaveClass('items-center');
      expect(chip).toHaveClass('rounded-full');
      expect(chip).toHaveClass('px-2');
      expect(chip).toHaveClass('py-0.5');
      expect(chip).toHaveClass('text-[11px]');
      expect(chip).toHaveClass('font-semibold');
      expect(chip).toHaveClass('border');
    });
  });

  describe('Fallback Styling for Unknown Category', () => {
    it('applies fallback classes for unknown category', () => {
      const { container } = render(<CategoryChip category="UNKNOWN_CATEGORY" />);
      const chip = container.querySelector('span');
      expect(chip).toHaveClass('bg-card');
      expect(chip).toHaveClass('text-foreground');
      expect(chip).toHaveClass('border-border');
    });

    it('still renders text for unknown category', () => {
      const { container } = render(<CategoryChip category="UNKNOWN_CATEGORY" />);
      expect(container.textContent).toBe('UNKNOWN_CATEGORY');
    });
  });

  describe('Memoization', () => {
    it('renders as a memoized component', () => {
      const { rerender } = render(<CategoryChip category="MARKETING" />);
      expect(render(<CategoryChip category="MARKETING" />).container).toEqual(
        render(<CategoryChip category="MARKETING" />).container
      );
    });
  });
});
