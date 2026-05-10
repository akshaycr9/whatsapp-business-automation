import { AlertCircle } from 'lucide-react';
import type { Automation } from '@/types';
import { RuleCard } from '@/components/automations/RuleCard';
import { RuleCardSkeleton } from '@/components/automations/RuleCardSkeleton';

interface AutomationsContentProps {
  loading: boolean;
  error: string | null;
  automations: Automation[];
  activeCount: number;
  pausedCount: number;
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
}

export function AutomationsContent({
  loading,
  error,
  automations,
  activeCount,
  pausedCount,
  onToggle,
  onEdit,
}: AutomationsContentProps) {
  return (
    <div className="flex-1 overflow-auto px-7 pt-6 pb-10">
      {/* Error banner */}
      {error && (
        <div className="mb-4 flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Failed to load automations</p>
            <p className="text-red-600 text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Status chip */}
      <div className="flex items-center mb-4">
        <span className="inline-flex items-center gap-[5px] text-[11.5px] font-semibold px-2 py-0.5 rounded-full bg-brand-100 text-brand-800 leading-[1.6]">
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {activeCount} active · {pausedCount} paused
        </span>
      </div>

      {/* Card list */}
      <div className="flex flex-col gap-3">
        {loading ? (
          <>
            <RuleCardSkeleton />
            <RuleCardSkeleton />
            <RuleCardSkeleton />
          </>
        ) : automations.length === 0 ? (
          <div className="text-center py-16 text-ink-400 text-sm">
            No automations configured in this category yet.
          </div>
        ) : (
          automations.map((automation) => (
            <RuleCard
              key={automation.id}
              automation={automation}
              onToggle={onToggle}
              onEdit={onEdit}
            />
          ))
        )}
      </div>
    </div>
  );
}
