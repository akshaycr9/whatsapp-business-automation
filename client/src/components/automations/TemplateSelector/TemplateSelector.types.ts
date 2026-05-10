import type { Template } from '@/types';

export interface TemplateSelectorProps {
  value: string;
  templates: Template[];
  onChange: (id: string) => void;
}
