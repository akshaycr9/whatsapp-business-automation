import React from "react";

interface CategoryChipConfig {
  bgClass: string;
  textClass: string;
  borderClass: string;
}

// Base classes shared by all category chips (defined once for DRY principle)
const baseClasses =
  "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold border";

// Category-specific design tokens from tailwind.config.ts
const CATEGORY_CONFIG: Record<string, CategoryChipConfig> = {
  MARKETING: {
    bgClass: "bg-category-marketing-bg",
    textClass: "text-category-marketing-text",
    borderClass: "border-category-marketing-border",
  },
  UTILITY: {
    bgClass: "bg-category-utility-bg",
    textClass: "text-category-utility-text",
    borderClass: "border-category-utility-border",
  },
  AUTHENTICATION: {
    bgClass: "bg-category-auth-bg",
    textClass: "text-category-auth-text",
    borderClass: "border-category-auth-border",
  },
};

interface CategoryChipProps {
  category: string;
}

export const CategoryChip = React.memo(function CategoryChip({
  category,
}: CategoryChipProps) {
  const config = CATEGORY_CONFIG[category];

  const className = config
    ? `${baseClasses} ${config.bgClass} ${config.textClass} ${config.borderClass}`
    : `${baseClasses} bg-card text-foreground border-border`;

  return <span className={className}>{category}</span>;
});
