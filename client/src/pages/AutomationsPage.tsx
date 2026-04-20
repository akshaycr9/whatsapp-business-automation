import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Clock, MessageCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useV2Automations } from '@/v2/hooks/use-v2-automations';
import type { V2Flow } from '@/v2/types';
import type { ShopifyEvent } from '@/types';

// ── Trigger display config ────────────────────────────────────────────────────

interface TriggerInfo {
  label: string;
  icon: string;
}

const SHOPIFY_EVENT_TRIGGER: Record<ShopifyEvent, TriggerInfo> = {
  PREPAID_ORDER_CONFIRMED: { label: 'Order placed',      icon: 'package' },
  ORDER_CANCELLED:         { label: 'Order cancelled',   icon: 'package' },
  ORDER_FULFILLED:         { label: 'Order shipped',     icon: 'truck'   },
  COD_ORDER_CONFIRMED:     { label: 'COD order placed',  icon: 'cash'    },
  COD_ORDER_FOLLOW_UP:     { label: 'COD unconfirmed',   icon: 'cash'    },
  ABANDONED_CART_1:        { label: 'Abandoned cart',    icon: 'cart'    },
  ABANDONED_CART_2:        { label: 'Abandoned cart',    icon: 'cart'    },
  ABANDONED_CART_3:        { label: 'Abandoned cart',    icon: 'cart'    },
};

const FLOW_DESCRIPTIONS: Record<string, string> = {
  'Order Confirmed':        'Send an order receipt and summary immediately when a prepaid order is placed.',
  'Order Cancelled':        'Notify the customer when their order has been cancelled.',
  'Order Fulfilled':        'Send AWB number and tracking link when Shopify marks the order as shipped.',
  'COD Order Confirmation': 'Ask the customer to confirm their COD order to reduce RTO rates.',
  'COD Order Follow Up':    "Follow up with customers who haven't responded to the COD confirmation request.",
  'COD Order Confirm':      'Send a confirmation message when the customer confirms their COD order.',
  'COD Order Cancel':       'Notify the customer when their COD order has been cancelled.',
  'Abandoned Cart 1':       'First nudge — send a cart reminder to customers who left items behind.',
  'Abandoned Cart 2':       "Second nudge with a gentle reminder if the customer still hasn't checked out.",
  'Abandoned Cart 3':       'Final nudge after 24 hours with a discount code to close the sale.',
};

function getTriggerInfo(flow: V2Flow): TriggerInfo {
  if (flow.shopifyEvent) {
    return SHOPIFY_EVENT_TRIGGER[flow.shopifyEvent] ?? { label: flow.name, icon: 'package' };
  }
  return { label: 'Button reply', icon: 'cash' };
}

// ── Icons ─────────────────────────────────────────────────────────────────────

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

const TRIGGER_ICONS: Record<string, React.ReactNode> = {
  cart:    <CartIcon />,
  package: <PackageIcon />,
  truck:   <TruckIcon />,
  cash:    <CashIcon />,
};

// ── Skeleton ──────────────────────────────────────────────────────────────────

function RuleCardSkeleton() {
  return (
    <div
      className="bg-card border border-border rounded-lg shadow-sm animate-pulse grid gap-4 items-center"
      style={{ padding: '16px 18px', gridTemplateColumns: 'auto 1fr auto' }}
    >
      <div className="w-9 h-5 bg-surface-sunken rounded-full flex-shrink-0" />
      <div className="space-y-2.5">
        <div className="h-4 bg-surface-sunken rounded w-1/3" />
        <div className="h-3 bg-surface-sunken rounded w-2/3" />
        <div className="flex gap-2 mt-1">
          <div className="h-7 bg-surface-sunken rounded-[9px] w-28" />
          <div className="h-7 bg-surface-sunken rounded-[9px] w-20" />
          <div className="h-7 bg-surface-sunken rounded-[9px] w-36" />
        </div>
      </div>
      <div className="w-16 h-8 bg-surface-sunken rounded-md" />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AutomationsPage() {
  const navigate = useNavigate();
  const { flowCategories, loading, error, toggle } = useV2Automations();
  const [selectedCategoryId, setSelectedCategoryId] = useState('order-flow');

  const selectedCategory = useMemo(
    () => flowCategories.find((c) => c.id === selectedCategoryId) ?? flowCategories[0],
    [flowCategories, selectedCategoryId],
  );

  const activeCount = useMemo(
    () => selectedCategory?.flows.filter((f) => f.active).length ?? 0,
    [selectedCategory],
  );
  const pausedCount = useMemo(
    () => selectedCategory?.flows.filter((f) => !f.active).length ?? 0,
    [selectedCategory],
  );

  const handleToggle = useCallback((flowId: string) => { toggle(flowId); }, [toggle]);

  const handleEdit = useCallback(
    (flowId: string) => { navigate(`/automations/${flowId}/edit`); },
    [navigate],
  );

  return (
    <div className="flex flex-col h-full">
      {/* ── Topbar ── */}
      <div className="h-14 border-b border-border bg-card flex items-center px-5 gap-4 flex-shrink-0">
        <span className="text-[16px] font-[650] tracking-[-0.01em] text-ink-900">Automations</span>
        <span className="text-[12.5px] text-ink-500 pl-3 ml-1 border-l border-border">
          Shopify → WhatsApp rules
        </span>
        <div className="flex-1" />
        <button className="w-8 h-8 grid place-items-center rounded-md text-ink-700 hover:bg-surface-sunken transition-colors">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
        <button className="w-8 h-8 grid place-items-center rounded-md text-ink-700 hover:bg-surface-sunken transition-colors">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Secondary nav ── */}
        <div className="w-64 flex-shrink-0 border-r border-border bg-card flex flex-col py-3 px-3 overflow-y-auto">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-400 px-2.5 pt-1 pb-2">
            Flows
          </p>
          <div className="flex flex-col gap-0.5">
            {flowCategories.map((category) => {
              const flowActive = category.flows.filter((f) => f.active).length;
              const isSelected = selectedCategoryId === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategoryId(category.id)}
                  className={cn(
                    'flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13.5px] font-medium transition-colors text-left w-full',
                    isSelected
                      ? 'bg-brand-100 text-brand-800'
                      : 'text-ink-700 hover:bg-surface-sunken',
                  )}
                >
                  <span className="flex-1 text-left">{category.label}</span>
                  <span
                    className={cn(
                      'text-[11px] font-semibold px-[7px] py-0.5 rounded-full min-w-[18px] text-center',
                      isSelected
                        ? 'bg-brand-600 text-white'
                        : 'bg-surface-sunken text-ink-500',
                    )}
                  >
                    {flowActive}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Rule cards ── */}
        <div className="flex-1 overflow-auto px-7 pt-6 pb-10">

          {/* Error state */}
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

          {/* Cards */}
          <div className="flex flex-col gap-3">
            {loading ? (
              <>
                <RuleCardSkeleton />
                <RuleCardSkeleton />
                <RuleCardSkeleton />
              </>
            ) : selectedCategory?.flows.length === 0 ? (
              <div className="text-center py-16 text-ink-400 text-sm">
                No automations configured in this flow yet.
              </div>
            ) : (
              selectedCategory?.flows.map((flow) => {
                const triggerInfo = getTriggerInfo(flow);
                return (
                  <RuleCard
                    key={flow.id}
                    flow={flow}
                    triggerInfo={triggerInfo}
                    onToggle={handleToggle}
                    onEdit={handleEdit}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Rule Card ─────────────────────────────────────────────────────────────────

interface RuleCardProps {
  flow: V2Flow;
  triggerInfo: TriggerInfo;
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
}

const RuleCard = ({ flow, triggerInfo, onToggle, onEdit }: RuleCardProps) => (
  <div
    className="bg-card border border-border rounded-lg shadow-sm grid gap-4 items-center"
    style={{ padding: '16px 18px', gridTemplateColumns: 'auto 1fr auto' }}
  >
    {/* Toggle */}
    <button
      onClick={() => onToggle(flow.id)}
      className={cn(
        'relative inline-block w-9 h-5 rounded-full transition-colors duration-150 border-0 p-0 cursor-pointer shrink-0',
        flow.active ? 'bg-brand-600' : 'bg-[#c9cec4]',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-[left] duration-150 block',
          flow.active ? 'left-[18px]' : 'left-0.5',
        )}
      />
    </button>

    {/* Body */}
    <div>
      <div className="text-[14px] font-[650] mb-1.5 tracking-[-0.005em] text-ink-900">
        {flow.name}
      </div>
      <div className="text-[12.5px] text-ink-500 mb-2.5">
        {FLOW_DESCRIPTIONS[flow.name] ?? ''}
      </div>

      {/* IF → WAIT → SEND */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* IF */}
        <div className="inline-flex items-center gap-2 pl-1.5 pr-3 py-1.5 bg-surface-2 border border-border rounded-[9px] text-[12.5px] font-medium text-ink-700">
          <span className="px-[5px] h-[22px] rounded-sm inline-flex items-center text-[10.5px] font-bold tracking-[0.02em] uppercase shrink-0 bg-accent-violet-bg text-accent-violet">
            IF
          </span>
          <span className="inline-flex items-center gap-[5px]">
            {TRIGGER_ICONS[triggerInfo.icon]}
            {triggerInfo.label}
          </span>
        </div>

        <span className="text-ink-300 text-sm">→</span>

        {/* WAIT */}
        <div className="inline-flex items-center gap-2 pl-1.5 pr-3 py-1.5 bg-surface-2 border border-border rounded-[9px] text-[12.5px] font-medium text-ink-700">
          <span className="px-[5px] h-[22px] rounded-sm inline-flex items-center text-[10.5px] font-bold tracking-[0.02em] uppercase shrink-0 bg-accent-amber-bg text-accent-amber">
            WAIT
          </span>
          <span className="inline-flex items-center gap-[5px]">
            <Clock size={13} />
            {flow.timing}
          </span>
        </div>

        <span className="text-ink-300 text-sm">→</span>

        {/* SEND */}
        <div className="inline-flex items-center gap-2 pl-1.5 pr-3 py-1.5 bg-surface-2 border border-border rounded-[9px] text-[12.5px] font-medium text-ink-700">
          <span className="px-[5px] h-[22px] rounded-sm inline-flex items-center text-[10.5px] font-bold tracking-[0.02em] uppercase shrink-0 bg-brand-100 text-brand-800">
            SEND
          </span>
          <span className="inline-flex items-center gap-[5px] font-mono text-[11.5px]">
            <MessageCircle size={13} />
            {flow.templateName}
          </span>
        </div>
      </div>

      {/* Paused badge */}
      {!flow.active && (
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
        onClick={() => onEdit(flow.id)}
        className="inline-flex items-center justify-center gap-1.5 px-3 py-[7px] rounded-md bg-card border border-border text-ink-900 text-[13px] font-semibold hover:bg-surface-sunken hover:border-ink-300 transition-all"
      >
        <Pencil size={13} />
        Edit
      </button>
    </div>
  </div>
);
