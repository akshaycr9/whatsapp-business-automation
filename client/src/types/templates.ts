/**
 * Template Status Enum
 * Represents the lifecycle status of a WhatsApp message template
 */
export enum TemplateStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

/**
 * Template Status Configuration
 * Maps each status to its display properties
 */
export interface StatusConfig {
  bgClass: string;
  textClass: string;
  label: string;
}

/**
 * Template Table Column Configuration
 * Defines the structure and metadata for table columns
 */
export interface TemplateTableColumn {
  id: string;
  label: string;
  isRightAligned?: boolean;
}

/**
 * Template Table Columns
 * Centralized configuration for all template table columns
 */
export const TEMPLATE_TABLE_COLUMNS: TemplateTableColumn[] = [
  { id: 'name', label: 'Template Name' },
  { id: 'category', label: 'Category' },
  { id: 'language', label: 'Language' },
  { id: 'status', label: 'Status' },
  { id: 'sync', label: 'Sync' },
  { id: 'created', label: 'Created' },
  { id: 'updated', label: 'Updated' },
  { id: 'actions', label: 'Actions', isRightAligned: true },
];
