import React, { useState, useCallback } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { requestNotificationPermission } from '@/lib/notifications';

export const NotificationBell = React.memo(function NotificationBell() {
  const [permission, setPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied',
  );

  const handleClick = useCallback(async () => {
    if (permission === 'denied') return;
    const result = await requestNotificationPermission();
    setPermission(result);
  }, [permission]);

  if (!('Notification' in window)) return null;

  const tooltipText =
    permission === 'granted'
      ? 'Notifications enabled'
      : permission === 'denied'
        ? 'Notifications blocked — enable in browser site settings, then refresh'
        : 'Click to enable message notifications';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-8 w-8 flex-shrink-0',
            permission === 'granted' && 'text-emerald-500 hover:text-emerald-600',
            permission === 'denied' && 'text-muted-foreground/50 cursor-not-allowed',
            permission === 'default' && 'text-amber-500 hover:text-amber-600',
          )}
          onClick={() => void handleClick()}
          disabled={permission === 'denied'}
          aria-label={tooltipText}
        >
          {permission === 'denied' ? (
            <BellOff className="h-4 w-4" />
          ) : (
            <Bell className="h-4 w-4" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p className="max-w-48">{tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  );
});
