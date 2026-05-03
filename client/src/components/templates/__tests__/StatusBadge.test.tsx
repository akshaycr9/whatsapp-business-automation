import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../StatusBadge';
import { TemplateStatus } from '@/types/templates';

describe('StatusBadge', () => {
  it('renders APPROVED status with correct label', () => {
    render(<StatusBadge status={TemplateStatus.APPROVED} />);
    expect(screen.getByText('APPROVED')).toBeInTheDocument();
  });

  it('renders PENDING status with correct label', () => {
    render(<StatusBadge status={TemplateStatus.PENDING} />);
    expect(screen.getByText('PENDING')).toBeInTheDocument();
  });

  it('renders REJECTED status with correct label', () => {
    render(<StatusBadge status={TemplateStatus.REJECTED} />);
    expect(screen.getByText('REJECTED')).toBeInTheDocument();
  });

  it('applies correct CSS classes for APPROVED status', () => {
    const { container } = render(<StatusBadge status={TemplateStatus.APPROVED} />);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-brand-100');
    expect(badge).toHaveClass('text-brand-800');
  });

  it('applies correct CSS classes for PENDING status', () => {
    const { container } = render(<StatusBadge status={TemplateStatus.PENDING} />);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-accent-amber-bg');
    expect(badge).toHaveClass('text-accent-amber');
  });

  it('applies correct CSS classes for REJECTED status', () => {
    const { container } = render(<StatusBadge status={TemplateStatus.REJECTED} />);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-accent-rose-bg');
    expect(badge).toHaveClass('text-accent-rose');
  });
});
