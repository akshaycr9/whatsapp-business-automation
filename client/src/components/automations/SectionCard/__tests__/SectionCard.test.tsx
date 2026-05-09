import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SectionCard } from '@/components/automations/SectionCard';

describe('SectionCard', () => {
  it('renders the section label', () => {
    render(<SectionCard label="Timing"><p>content</p></SectionCard>);
    expect(screen.getByText('Timing')).toBeInTheDocument();
  });

  it('renders its children', () => {
    render(<SectionCard label="Template (optional)"><p>Select a template</p></SectionCard>);
    expect(screen.getByText('Select a template')).toBeInTheDocument();
  });

  it('renders multiple children', () => {
    render(
      <SectionCard label="Mapping">
        <p>Row 1</p>
        <p>Row 2</p>
      </SectionCard>,
    );
    expect(screen.getByText('Row 1')).toBeInTheDocument();
    expect(screen.getByText('Row 2')).toBeInTheDocument();
  });
});
