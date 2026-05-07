import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TemplateTableSkeleton } from '../TemplateCardSkeleton';

describe('TemplateTableSkeleton', () => {
  describe('Structure', () => {
    it('renders table skeleton', () => {
      const { container } = render(<TemplateTableSkeleton />);
      expect(container.querySelector('table')).toBeInTheDocument();
    });

    it('renders table header', () => {
      const { container } = render(<TemplateTableSkeleton />);
      expect(container.querySelector('thead')).toBeInTheDocument();
    });

    it('renders table body with skeleton rows', () => {
      const { container } = render(<TemplateTableSkeleton />);
      const rows = container.querySelectorAll('tbody tr');
      expect(rows.length).toBe(8);
    });

    it('renders skeleton components in cells', () => {
      const { container } = render(<TemplateTableSkeleton />);
      const skeletons = container.querySelectorAll('[class*="h-"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Table Layout', () => {
    it('has overflow-x-auto wrapper', () => {
      const { container } = render(<TemplateTableSkeleton />);
      const wrapper = container.querySelector('.overflow-x-auto');
      expect(wrapper).toBeInTheDocument();
    });

    it('sets minimum table width', () => {
      const { container } = render(<TemplateTableSkeleton />);
      const table = container.querySelector('table');
      expect(table?.style.minWidth).toBe('780px');
    });
  });

  describe('Skeleton Rows', () => {
    it('renders 8 skeleton rows', () => {
      const { container } = render(<TemplateTableSkeleton />);
      const tbody = container.querySelector('tbody');
      const rows = tbody?.querySelectorAll('tr');
      expect(rows?.length).toBe(8);
    });

    it('has border between rows', () => {
      const { container } = render(<TemplateTableSkeleton />);
      const rows = container.querySelectorAll('tbody tr');
      rows.forEach((row) => {
        expect(row).toHaveClass('border-b');
      });
    });
  });

  describe('Column Headers', () => {
    it('renders header cells', () => {
      const { container } = render(<TemplateTableSkeleton />);
      const headers = container.querySelectorAll('thead th');
      expect(headers.length).toBeGreaterThan(0);
    });

    it('applies header styling', () => {
      const { container } = render(<TemplateTableSkeleton />);
      const headers = container.querySelectorAll('thead th');
      headers.forEach((header) => {
        expect(header).toHaveClass('bg-card');
        expect(header).toHaveClass('border-b');
      });
    });
  });

  describe('Accessibility', () => {
    it('maintains semantic table structure', () => {
      const { container } = render(<TemplateTableSkeleton />);
      expect(container.querySelector('table')).toBeInTheDocument();
      expect(container.querySelector('thead')).toBeInTheDocument();
      expect(container.querySelector('tbody')).toBeInTheDocument();
    });
  });
});
