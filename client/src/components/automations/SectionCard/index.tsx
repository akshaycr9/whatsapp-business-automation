import React from 'react';

interface SectionCardProps {
  label: string;
  children: React.ReactNode;
}

export function SectionCard({ label, children }: SectionCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-5 py-3 border-b border-border bg-surface-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-400">
          {label}
        </span>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}
