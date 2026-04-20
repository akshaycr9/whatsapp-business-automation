import { useState } from 'react';
import { Eye, MoreVertical, Filter, Clock, MessageCircle, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Rule {
  id: string;
  on: boolean;
  name: string;
  desc: string;
  trigger: { label: string; icon: string };
  delay: string;
  filter: string | null;
  template: string;
}

interface Flow {
  id: string;
  label: string;
  rules: Rule[];
}

const FLOWS: Flow[] = [
  {
    id: 'order',
    label: 'Order Flow',
    rules: [
      {
        id: 'order-confirmed',
        on: true,
        name: 'Order Confirmed',
        desc: 'Send an order receipt and summary immediately when a prepaid order is placed.',
        trigger: { label: 'Order placed', icon: 'package' },
        delay: 'Immediate',
        filter: null,
        template: 'order_confirm_apparel',
      },
      {
        id: 'order-cancelled',
        on: true,
        name: 'Order Cancelled',
        desc: 'Notify the customer when their order has been cancelled.',
        trigger: { label: 'Order cancelled', icon: 'package' },
        delay: 'Immediate',
        filter: null,
        template: 'order_cancelled',
      },
      {
        id: 'order-fulfilled',
        on: true,
        name: 'Order Fulfilled',
        desc: 'Send AWB number and tracking link when Shopify marks the order as shipped.',
        trigger: { label: 'Order shipped', icon: 'truck' },
        delay: 'Immediate',
        filter: null,
        template: 'shipment_tracking',
      },
    ],
  },
  {
    id: 'cod',
    label: 'COD Flow',
    rules: [
      {
        id: 'cod-confirmation',
        on: true,
        name: 'COD Order Confirmation',
        desc: 'Ask the customer to confirm their COD order to reduce RTO rates.',
        trigger: { label: 'COD order placed', icon: 'cash' },
        delay: '5 minutes',
        filter: null,
        template: 'cod_verification',
      },
      {
        id: 'cod-confirmed',
        on: true,
        name: 'COD Order Confirmed',
        desc: 'Send a confirmation message when the customer confirms their COD order.',
        trigger: { label: 'COD confirmed', icon: 'cash' },
        delay: 'Immediate',
        filter: null,
        template: 'cod_order_confirmed',
      },
      {
        id: 'cod-cancelled',
        on: false,
        name: 'COD Order Cancelled',
        desc: 'Notify the customer when their COD order has been cancelled.',
        trigger: { label: 'COD cancelled', icon: 'cash' },
        delay: 'Immediate',
        filter: null,
        template: 'cod_order_cancelled',
      },
      {
        id: 'cod-followup',
        on: false,
        name: 'COD Order Follow Up',
        desc: 'Follow up with customers who haven\'t responded to the COD confirmation request.',
        trigger: { label: 'COD unconfirmed', icon: 'cash' },
        delay: '24 hours',
        filter: 'No response yet',
        template: 'cod_followup',
      },
    ],
  },
  {
    id: 'cart',
    label: 'Abandoned Cart',
    rules: [
      {
        id: 'cart-1',
        on: true,
        name: 'Abandoned Cart 1',
        desc: 'First nudge — send a cart reminder to customers who left items behind.',
        trigger: { label: 'Abandoned cart', icon: 'cart' },
        delay: '1 hour',
        filter: '> ₹500',
        template: 'cart_recovery_v1',
      },
      {
        id: 'cart-2',
        on: true,
        name: 'Abandoned Cart 2',
        desc: 'Second nudge with a gentle reminder if the customer still hasn\'t checked out.',
        trigger: { label: 'Abandoned cart', icon: 'cart' },
        delay: '6 hours',
        filter: 'No purchase yet',
        template: 'cart_recovery_v2',
      },
      {
        id: 'cart-3',
        on: false,
        name: 'Abandoned Cart 3',
        desc: 'Final nudge after 24 hours with a 15% discount code to close the sale.',
        trigger: { label: 'Abandoned cart', icon: 'cart' },
        delay: '24 hours',
        filter: 'No purchase yet',
        template: 'cart_recovery_offer15',
      },
    ],
  },
];

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
  cart: <CartIcon />,
  package: <PackageIcon />,
  truck: <TruckIcon />,
  cash: <CashIcon />,
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AutomationsPage() {
  const [selectedFlowId, setSelectedFlowId] = useState('order');

  // Flat map of rule id → active state across all flows
  const [activeMap, setActiveMap] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(FLOWS.flatMap((f) => f.rules.map((r) => [r.id, r.on]))),
  );

  const toggle = (id: string) => setActiveMap((m) => ({ ...m, [id]: !m[id] }));

  const selectedFlow = FLOWS.find((f) => f.id === selectedFlowId)!;
  const activeCount = selectedFlow.rules.filter((r) => activeMap[r.id]).length;
  const pausedCount = selectedFlow.rules.filter((r) => !activeMap[r.id]).length;

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
        <button className="inline-flex items-center gap-1.5 px-3 py-[7px] rounded-md bg-brand-700 text-white border border-brand-800 text-[13px] font-semibold hover:bg-brand-800 transition-colors">
          <Plus size={13} strokeWidth={2.5} />
          New automation
        </button>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Secondary nav ── */}
        <div className="w-[188px] flex-shrink-0 border-r border-border bg-card flex flex-col py-3 px-3 overflow-y-auto">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-400 px-2.5 pt-1 pb-2">
            Flows
          </p>
          <div className="flex flex-col gap-0.5">
            {FLOWS.map((flow) => {
              const flowActive = flow.rules.filter((r) => activeMap[r.id]).length;
              const isSelected = selectedFlowId === flow.id;
              return (
                <button
                  key={flow.id}
                  onClick={() => setSelectedFlowId(flow.id)}
                  className={cn(
                    'flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13.5px] font-medium transition-colors text-left w-full',
                    isSelected
                      ? 'bg-brand-100 text-brand-800'
                      : 'text-ink-700 hover:bg-surface-sunken',
                  )}
                >
                  <span className="flex-1 text-left">{flow.label}</span>
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

          {/* Status chip + filter */}
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex items-center gap-[5px] text-[11.5px] font-semibold px-2 py-0.5 rounded-full bg-brand-100 text-brand-800 leading-[1.6]">
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {activeCount} active · {pausedCount} paused
            </span>
            <div className="flex-1" />
            <button className="inline-flex items-center gap-1.5 px-3 py-[7px] rounded-md bg-card border border-border text-ink-900 text-[13px] font-semibold hover:bg-surface-sunken hover:border-ink-300 transition-all">
              <Filter size={13} strokeWidth={2} />
              Filter
            </button>
          </div>

          {/* Cards */}
          <div className="flex flex-col gap-3">
            {selectedFlow.rules.map((r) => {
              const isActive = activeMap[r.id];
              return (
                <div
                  key={r.id}
                  className="bg-card border border-border rounded-lg shadow-sm grid gap-4 items-center"
                  style={{ padding: '16px 18px', gridTemplateColumns: 'auto 1fr auto' }}
                >
                  {/* Toggle */}
                  <button
                    onClick={() => toggle(r.id)}
                    className={cn(
                      'relative inline-block w-9 h-5 rounded-full transition-colors duration-150 border-0 p-0 cursor-pointer shrink-0',
                      isActive ? 'bg-brand-600' : 'bg-[#c9cec4]',
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-[left] duration-150 block',
                        isActive ? 'left-[18px]' : 'left-0.5',
                      )}
                    />
                  </button>

                  {/* Body */}
                  <div>
                    <div className="text-[14px] font-[650] mb-1.5 tracking-[-0.005em] text-ink-900">
                      {r.name}
                    </div>
                    <div className="text-[12.5px] text-ink-500 mb-2.5">{r.desc}</div>

                    {/* IF → WAIT → SEND */}
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {/* IF */}
                      <div className="inline-flex items-center gap-[7px] pl-1.5 pr-2.5 py-1.5 bg-surface-2 border border-border rounded-[9px] text-[12.5px] font-medium text-ink-700">
                        <span className="w-[22px] h-[22px] rounded-sm grid place-items-center text-[10.5px] font-bold tracking-[0.02em] uppercase shrink-0 bg-accent-violet-bg text-accent-violet">
                          IF
                        </span>
                        <span className="inline-flex items-center gap-[5px]">
                          {TRIGGER_ICONS[r.trigger.icon]}
                          {r.trigger.label}
                        </span>
                        {r.filter && (
                          <span className="text-ink-500 text-[11.5px] ml-0.5">· {r.filter}</span>
                        )}
                      </div>

                      <span className="text-ink-300 text-sm">→</span>

                      {/* WAIT */}
                      <div className="inline-flex items-center gap-[7px] pl-1.5 pr-2.5 py-1.5 bg-surface-2 border border-border rounded-[9px] text-[12.5px] font-medium text-ink-700">
                        <span className="w-[22px] h-[22px] rounded-sm grid place-items-center text-[10.5px] font-bold tracking-[0.02em] uppercase shrink-0 bg-accent-amber-bg text-accent-amber">
                          WAIT
                        </span>
                        <span className="inline-flex items-center gap-[5px]">
                          <Clock size={13} />
                          {r.delay}
                        </span>
                      </div>

                      <span className="text-ink-300 text-sm">→</span>

                      {/* SEND */}
                      <div className="inline-flex items-center gap-[7px] pl-1.5 pr-2.5 py-1.5 bg-surface-2 border border-border rounded-[9px] text-[12.5px] font-medium text-ink-700">
                        <span className="w-[22px] h-[22px] rounded-sm grid place-items-center text-[10.5px] font-bold tracking-[0.02em] uppercase shrink-0 bg-brand-100 text-brand-800">
                          SEND
                        </span>
                        <span className="inline-flex items-center gap-[5px] font-mono text-[11.5px]">
                          <MessageCircle size={13} />
                          {r.template}
                        </span>
                      </div>
                    </div>

                    {/* Paused badge */}
                    {!isActive && (
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
                    <button className="inline-flex items-center justify-center gap-1.5 px-3 py-[7px] rounded-md bg-card border border-border text-ink-900 text-[13px] font-semibold hover:bg-surface-sunken hover:border-ink-300 transition-all">
                      <Eye size={13} />
                      View
                    </button>
                    <button className="inline-flex items-center justify-center px-3 py-[7px] rounded-md bg-card border border-border text-ink-900 text-[13px] font-semibold hover:bg-surface-sunken hover:border-ink-300 transition-all">
                      <MoreVertical size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
