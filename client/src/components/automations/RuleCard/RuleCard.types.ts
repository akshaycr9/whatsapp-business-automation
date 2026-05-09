import type { Automation } from '@/types';

export interface RuleCardProps {
  automation: Automation;
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
}
