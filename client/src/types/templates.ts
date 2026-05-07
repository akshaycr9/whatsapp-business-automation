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

/**
 * Template Button Type Enum
 * Represents the different types of buttons available in template messages
 */
export enum TemplateButtonType {
  QUICK_REPLY = 'QUICK_REPLY',
  URL = 'URL',
  PHONE_NUMBER = 'PHONE_NUMBER',
  COPY_CODE = 'COPY_CODE',
}

/**
 * Template Component Type Enum
 * Represents the different sections of a template message
 */
export enum TemplateComponentType {
  HEADER = 'HEADER',
  BODY = 'BODY',
  FOOTER = 'FOOTER',
  BUTTONS = 'BUTTONS',
}

/**
 * Template Component Format Enum
 * Represents the media format for template components
 */
export enum TemplateComponentFormat {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
}

/**
 * Template Button Group Type Enum
 * Represents the different grouping strategies for buttons in forms
 */
export enum TemplateButtonGroupType {
  QUICK_REPLY = 'QUICK_REPLY',
  CTA = 'CTA',
}

/**
 * Template Category Enum
 * Represents the category classification for templates (converted from union type)
 */
export enum TemplateCategory {
  MARKETING = 'MARKETING',
  UTILITY = 'UTILITY',
  AUTHENTICATION = 'AUTHENTICATION',
}

/**
 * Status Filter Type
 * Used for filtering templates by status or showing all templates
 */
export type StatusFilter = 'all' | TemplateStatus;

/**
 * Load Status Type
 * Represents the async loading state of Redux operations
 */
export type LoadStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

/**
 * Template Button Input Interface
 * Represents the data structure for a button in a template message
 */
export interface TemplateButtonInput {
  type: TemplateButtonType;
  text: string;
  url?: string;
  phone_number?: string;
  example?: string;
}

/**
 * Template Component Input Interface
 * Represents the data structure for a component section in a template
 */
export interface TemplateComponentInput {
  type: TemplateComponentType;
  format?: TemplateComponentFormat;
  text?: string;
  example?: string[];
  buttons?: TemplateButtonInput[];
}

/**
 * Create Template Input Interface
 * Represents the data structure for creating a new template
 */
export interface CreateTemplateInput {
  name: string;
  language: string;
  category: TemplateCategory;
  components: TemplateComponentInput[];
}

/**
 * Update Template Input Interface
 * Represents the data structure for updating an existing template
 */
export interface UpdateTemplateInput {
  id: string;
  components: TemplateComponentInput[];
}

/**
 * Template Meta Interface
 * Represents pagination metadata for template list responses
 */
export interface TemplateMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Status Counts Interface
 * Represents the count of templates for each status
 */
export interface StatusCounts {
  all: number;
  [TemplateStatus.APPROVED]: number;
  [TemplateStatus.PENDING]: number;
  [TemplateStatus.REJECTED]: number;
}

/**
 * Templates State Interface
 * Represents the Redux slice state for template management
 */
export interface TemplatesState {
  list: any[]; // Template[] type imported from types/index.ts to avoid circular dependency
  meta: TemplateMeta;
  status: LoadStatus;
  error: string | null;
  search: string;
  statusFilter: StatusFilter;
  page: number;
  statusCounts: StatusCounts;
  statusCountsLoaded: boolean;
}

/**
 * Fetch Templates Argument Interface
 * Represents the arguments for the fetchTemplates thunk
 */
export interface FetchTemplatesArg {
  search: string;
  page: number;
  statusFilter: StatusFilter;
}
