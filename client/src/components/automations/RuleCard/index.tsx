import React from 'react';
import { Pencil, Clock, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTriggerInfo, getDelayDisplay, type TriggerIconKey } from '@/utils/automations.utils';
import { ConditionBadge } from '@/components/automations/ConditionBadge';
import type { RuleCardProps } from './RuleCard.types';

// ── Trigger icon SVGs (private to this component) ─────────────────────────────

function CartIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

function PackageIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

function CashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" />
    </svg>
  );
}

const TRIGGER_ICONS: Record<TriggerIconKey, React.ReactNode> = {
  cart:    <CartIcon />,
  package: <PackageIcon />,
  truck:   <TruckIcon />,
  cash:    <CashIcon />,
};

// ── Component ─────────────────────────────────────────────────────────────────

export const RuleCard = React.memo(function RuleCard({ automation, onToggle, onEdit }: RuleCardProps) {
  const triggerInfo = getTriggerInfo(automation);

  return (
    <div
      className="bg-card border border-border rounded-lg shadow-sm grid gap-4 items-center"
      style={{ padding: '16px 18px', gridTemplateColumns: 'auto 1fr auto' }}
    >
      {/* Toggle */}
      <button
        onClick={() => onToggle(automation.id)}
        className={cn(
          'relative inline-block w-9 h-5 rounded-full transition-colors duration-150 border-0 p-0 cursor-pointer shrink-0',
          automation.isActive ? 'bg-brand-600' : 'bg-[#c9cec4]',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-[left] duration-150 block',
            automation.isActive ? 'left-[18px]' : 'left-0.5',
          )}
        />
      </button>

      {/* Body */}
      <div>
        <div className="text-[14px] font-[650] mb-1.5 tracking-[-0.005em] text-ink-900">
          {automation.name}
        </div>

        {/* IF → WAIT → SEND */}
        <div className="flex items-center gap-3 flex-wrap">
          <ConditionBadge label="IF" labelClassName="bg-accent-violet-bg text-accent-violet">
            {TRIGGER_ICONS[triggerInfo.icon]}
            {triggerInfo.label}
          </ConditionBadge>

          <span className="text-ink-300 text-sm">→</span>

          <ConditionBadge label="WAIT" labelClassName="bg-accent-amber-bg text-accent-amber">
            <Clock size={13} />
            {getDelayDisplay(automation.delayMinutes)}
          </ConditionBadge>

          <span className="text-ink-300 text-sm">→</span>

          <ConditionBadge label="SEND" labelClassName="bg-brand-100 text-brand-800" contentClassName="font-mono text-[11.5px]">
            <MessageCircle size={13} />
            {automation.template?.name ?? '(No template)'}
          </ConditionBadge>
        </div>

        {/* Paused badge */}
        {!automation.isActive && (
          <div className="mt-3">
            <span className="inline-flex items-center gap-[5px] text-[11.5px] font-semibold px-2 py-0.5 rounded-full bg-surface-sunken text-ink-500 leading-[1.6]">
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              Paused
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1.5">
        <button
          onClick={() => onEdit(automation.id)}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-[7px] rounded-md bg-card border border-border text-ink-900 text-[13px] font-semibold hover:bg-surface-sunken hover:border-ink-300 transition-all"
        >
          <Pencil size={13} />
          Edit
        </button>
      </div>
    </div>
  );
});
