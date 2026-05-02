import React from 'react';

interface CategoryChipConfig {
  bgClass: string;
  textClass: string;
  borderClass: string;
}

// Category-specific branding colors (intentional brand design)
const CATEGORY_CONFIG: Record<string, CategoryChipConfig> = {
  MARKETING: {
    bgClass: 'bg-[#fdf0e6]',
    textClass: 'text-[#b35a1f]',
    borderClass: 'border-[#f5d5b5]',
  },
  UTILITY: {
    bgClass: 'bg-[#e8f0fe]',
    textClass: 'text-[#2a5db0]',
    borderClass: 'border-[#bdd0f5]',
  },
  AUTHENTICATION: {
    bgClass: 'bg-[#eff1ed]',
    textClass: 'text-ink-500',
    borderClass: 'border-[#c9cec4]',
  },
};

interface CategoryChipProps {
  category: string;
}

export const CategoryChip = React.memo(function CategoryChip({ category }: CategoryChipProps) {
  const config = CATEGORY_CONFIG[category];

  if (!config) {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold border bg-card text-foreground border-border">
        {category}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold border ${config.bgClass} ${config.textClass} ${config.borderClass}`}
    >
      {category}
    </span>
  );
});
