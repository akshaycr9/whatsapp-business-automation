import React from 'react';
import { cn } from '@/lib/utils';
import { EVENT_CONFIG, EVENT_ICON_BG } from '@/lib/automation-utils';
import type { ShopifyEvent, Automation } from '@/types';

const SHOPIFY_EVENTS = Object.keys(EVENT_CONFIG) as ShopifyEvent[];

interface EventCardsProps {
  automations: Automation[];
}

export const EventCards = React.memo(function EventCards({ automations }: EventCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {SHOPIFY_EVENTS.map((event) => {
        const cfg = EVENT_CONFIG[event];
        const activeCount = automations.filter(
          (a) => a.shopifyEvent === event && a.isActive,
        ).length;
        const hasActive = activeCount > 0;

        return (
          <div key={event} className="bg-card border border-border rounded-xl p-4">
            <div
              className={cn(
                'h-8 w-8 rounded-lg flex items-center justify-center mb-3',
                EVENT_ICON_BG[event],
              )}
            >
              {cfg.icon}
            </div>
            <p className="text-sm font-medium text-foreground">{cfg.label}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className={cn(
                  'inline-block h-2 w-2 rounded-full',
                  hasActive ? 'bg-green-500' : 'bg-muted-foreground/40',
                )}
              />
              <p className="text-xs text-muted-foreground">
                {activeCount === 0
                  ? 'No active automations'
                  : `${activeCount} active automation${activeCount > 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
});
