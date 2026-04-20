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
  stats: { triggered: number; sent: number; read: number; clicked: number };
}

const RULES: Rule[] = [
  {
    id: '1',
    on: true,
    name: 'Cart Recovery · 1h delay',
    desc: 'Send a reminder with a 15% off code to customers who leave items in their cart.',
    trigger: { label: 'Abandoned cart', icon: 'cart' },
    delay: '1 hour',
    filter: '> ₹500',
    template: 'cart_recovery_v2',
    stats: { triggered: 147, sent: 145, read: 118, clicked: 42 },
  },
  {
    id: '2',
    on: true,
    name: 'Order Confirmation',
    desc: 'Immediate receipt & order summary when a new order is placed on Shopify.',
    trigger: { label: 'Order placed', icon: 'package' },
    delay: 'Immediate',
    filter: null,
    template: 'order_confirm_apparel',
    stats: { triggered: 98, sent: 98, read: 96, clicked: 34 },
  },
  {
    id: '3',
    on: true,
    name: 'Shipment Tracking Update',
    desc: 'Send AWB + tracking link when Shopify marks the order as shipped.',
    trigger: { label: 'Order shipped', icon: 'truck' },
    delay: 'Immediate',
    filter: null,
    template: 'shipment_tracking',
    stats: { triggered: 76, sent: 75, read: 72, clicked: 41 },
  },
  {
    id: '4',
    on: true,
    name: 'COD Order Verification',
    desc: 'Ask customer to confirm COD orders to reduce RTO rates.',
    trigger: { label: 'COD confirmation', icon: 'cash' },
    delay: '5 minutes',
    filter: null,
    template: 'cod_verification',
    stats: { triggered: 42, sent: 42, read: 40, clicked: 38 },
  },
  {
    id: '5',
    on: false,
    name: 'Cart Recovery · Day 2 follow-up',
    desc: "Second nudge after 24 hours if customer still hasn't completed checkout.",
    trigger: { label: 'Abandoned cart', icon: 'cart' },
    delay: '24 hours',
    filter: 'No purchase yet',
    template: 'cart_recovery_offer15',
    stats: { triggered: 0, sent: 0, read: 0, clicked: 0 },
  },
  {
    id: '6',
    on: false,
    name: 'Back-in-stock (Navy Tee)',
    desc: 'Draft — pending template approval before this can go live.',
    trigger: { label: 'Product restock', icon: 'shirt' },
    delay: 'Immediate',
    filter: 'Navy T-Shirt only',
    template: 'restock_tshirt_navy',
    stats: { triggered: 0, sent: 0, read: 0, clicked: 0 },
  },
];

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
function ShirtIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 3l4 2v5l-3 1v10H7V11l-3-1V5l4-2 2 2h4z" />
    </svg>
  );
}

const TRIGGER_ICONS: Record<string, React.ReactNode> = {
  cart: <CartIcon />,
  package: <PackageIcon />,
  truck: <TruckIcon />,
  cash: <CashIcon />,
  shirt: <ShirtIcon />,
};

export default function AutomationsPage() {
  const [active, setActive] = useState(RULES.map((r) => r.on));
  const toggle = (i: number) => setActive((a) => a.map((v, idx) => (idx === i ? !v : v)));

  const activeCount = active.filter(Boolean).length;
  const pausedCount = active.filter((a) => !a).length;
  const totalTriggered = RULES.reduce(
    (sum, r, i) => (active[i] && r.stats.triggered > 0 ? sum + r.stats.triggered : sum),
    0,
  );

  return (
    <div className="flex flex-col h-full">
      {/* Topbar */}
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

      {/* Content */}
      <div className="flex-1 overflow-auto px-7 pt-6 pb-10">
        {/* Status chips + filter */}
        <div className="flex items-center gap-3 mb-4">
          <span className="inline-flex items-center gap-[5px] text-[11.5px] font-semibold px-2 py-0.5 rounded-full bg-brand-100 text-brand-800 leading-[1.6]">
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {activeCount} active · {pausedCount} paused
          </span>
          <span className="inline-flex items-center gap-[5px] text-[11.5px] font-semibold px-2 py-0.5 rounded-full bg-surface-sunken text-ink-500 leading-[1.6]">
            {totalTriggered} triggers this week
          </span>
          <div className="flex-1" />
          <button className="inline-flex items-center gap-1.5 px-3 py-[7px] rounded-md bg-card border border-border text-ink-900 text-[13px] font-semibold hover:bg-surface-sunken hover:border-ink-300 transition-all">
            <Filter size={13} strokeWidth={2} />
            Filter
          </button>
        </div>

        {/* Rule cards */}
        <div className="flex flex-col gap-3">
          {RULES.map((r, i) => (
            <div
              key={r.id}
              className="bg-card border border-border rounded-lg shadow-sm grid gap-4 items-center"
              style={{ padding: '16px 18px', gridTemplateColumns: 'auto 1fr auto' }}
            >
              {/* Toggle switch */}
              <button
                onClick={() => toggle(i)}
                className={cn(
                  'relative inline-block w-9 h-5 rounded-full transition-colors duration-150 border-0 p-0 cursor-pointer shrink-0',
                  active[i] ? 'bg-brand-600' : 'bg-[#c9cec4]',
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-[left] duration-150 block',
                    active[i] ? 'left-[18px]' : 'left-0.5',
                  )}
                />
              </button>

              {/* Card body */}
              <div>
                <div className="text-[14px] font-[650] mb-1.5 tracking-[-0.005em] text-ink-900">
                  {r.name}
                </div>
                <div className="text-[12.5px] text-ink-500 mb-2.5">{r.desc}</div>

                {/* IF → WAIT → SEND flow */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* IF node */}
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

                  {/* WAIT node */}
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

                  {/* SEND node */}
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

                {/* Stats row (active + has data) */}
                {active[i] && r.stats.triggered > 0 && (
                  <div className="flex gap-5 text-[11.5px] text-ink-500 items-center mt-3">
                    <span>
                      Triggered{' '}
                      <span className="text-ink-900 font-[650] tabular-nums">{r.stats.triggered}</span>
                    </span>
                    <span>
                      Delivered{' '}
                      <span className="text-ink-900 font-[650] tabular-nums">{r.stats.sent}</span>
                    </span>
                    <span>
                      Read{' '}
                      <span className="text-ink-900 font-[650] tabular-nums">{r.stats.read}</span>{' '}
                      <span className="text-brand-700">
                        ({Math.round((r.stats.read / r.stats.sent) * 100)}%)
                      </span>
                    </span>
                    <span>
                      Clicked{' '}
                      <span className="text-ink-900 font-[650] tabular-nums">{r.stats.clicked}</span>
                    </span>
                  </div>
                )}

                {/* Paused badge */}
                {!active[i] && (
                  <div className="mt-3">
                    <span className="inline-flex items-center gap-[5px] text-[11.5px] font-semibold px-2 py-0.5 rounded-full bg-surface-sunken text-ink-500 leading-[1.6]">
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      Paused
                    </span>
                  </div>
                )}
              </div>

              {/* Action buttons */}
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
          ))}
        </div>
      </div>
    </div>
  );
}
