import { z } from 'zod';
import {
  TemplateCategory,
  TemplateButtonType,
  TemplateButtonGroupType,
} from '@/types';

export const templateFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Template name is required')
    .regex(/^[a-z0-9_]+$/, 'Only lowercase letters, numbers, and underscores allowed'),
  language: z.enum(['en', 'en_US', 'hi']),
  category: z.enum(Object.values(TemplateCategory) as [string, ...string[]]),

  // Header
  headerEnabled: z.boolean().default(false),
  headerText: z
    .string()
    .max(60, 'Header text must be at most 60 characters')
    .optional()
    .default(''),

  // Body
  bodyText: z
    .string()
    .min(1, 'Body text is required')
    .max(1024, 'Body text must be at most 1024 characters'),
  bodySamples: z.array(z.string()).default([]),

  // Footer
  footerEnabled: z.boolean().default(false),
  footerText: z
    .string()
    .max(60, 'Footer text must be at most 60 characters')
    .optional()
    .default(''),

  // Buttons
  buttonsEnabled: z.boolean().default(false),
  buttonGroup: z.enum(Object.values(TemplateButtonGroupType) as [string, ...string[]]).default(TemplateButtonGroupType.QUICK_REPLY),
  buttons: z
    .array(
      z.object({
        type: z.enum(Object.values(TemplateButtonType) as [string, ...string[]]),
        text: z.string().min(1, 'Button text is required').max(25, 'Button text must be at most 25 characters'),
        url: z.string().optional().default(''),
        phone_number: z.string().optional().default(''),
        example: z.string().optional().default(''),
      }),
    )
    .default([]),
});

export type TemplateFormData = z.infer<typeof templateFormSchema>;
