import React from 'react';
import {
  FilePlus,
  FileEdit,
  FileCheck,
  FileX,
  Trash2,
  Zap,
  Settings,
  ToggleRight,
  ToggleLeft,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ActivityType } from '@/types/dashboard';

interface ActivityIconConfig {
  icon: LucideIcon;
  bg: string;
  color: string;
}

const ACTIVITY_CONFIG: Record<ActivityType, ActivityIconConfig> = {
  template_created: { icon: FilePlus, bg: 'bg-blue-100 dark:bg-blue-950/40', color: 'text-blue-500' },
  template_updated: { icon: FileEdit, bg: 'bg-sky-100 dark:bg-sky-950/40', color: 'text-sky-500' },
  template_approved: { icon: FileCheck, bg: 'bg-emerald-100 dark:bg-emerald-950/40', color: 'text-emerald-500' },
  template_rejected: { icon: FileX, bg: 'bg-red-100 dark:bg-red-950/40', color: 'text-red-500' },
  template_deleted: { icon: Trash2, bg: 'bg-orange-100 dark:bg-orange-950/40', color: 'text-orange-500' },
  automation_created: { icon: Zap, bg: 'bg-violet-100 dark:bg-violet-950/40', color: 'text-violet-500' },
  automation_updated: { icon: Settings, bg: 'bg-purple-100 dark:bg-purple-950/40', color: 'text-purple-500' },
  automation_enabled: { icon: ToggleRight, bg: 'bg-emerald-100 dark:bg-emerald-950/40', color: 'text-emerald-500' },
  automation_disabled: { icon: ToggleLeft, bg: 'bg-amber-100 dark:bg-amber-950/40', color: 'text-amber-500' },
  automation_deleted: { icon: Trash2, bg: 'bg-red-100 dark:bg-red-950/40', color: 'text-red-500' },
};

interface ActivityIconProps {
  type: ActivityType;
}

export const ActivityIcon = React.memo(function ActivityIcon({ type }: ActivityIconProps) {
  const config = ACTIVITY_CONFIG[type];
  const Icon = config.icon;
  return (
    <div className={`h-8 w-8 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0`}>
      <Icon className={`h-3.5 w-3.5 ${config.color}`} />
    </div>
  );
});
