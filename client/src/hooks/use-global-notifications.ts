import { useEffect, useRef } from 'react';
import { socket } from '@/lib/socket';
import {
  playNotificationSound,
  requestNotificationPermission,
  showBrowserNotification,
} from '@/lib/notifications';
import { registerPushSubscription } from '@/lib/push-subscription';
import { formatPhoneDisplay } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { ConversationUpdatedEvent, NewMessageEvent } from '@/types';

/**
 * Global hook — mounted once in App.tsx.
 *
 * Notification permission
 * ───────────────────────
 * • On mount: if permission is 'default' (never asked), show a toast
 *   pointing the user to the bell icon so they can enable notifications.
 * • If permission is 'denied', show a toast with browser-settings guidance.
 * • The first-click handler requests permission on the first user gesture,
 *   which reliably shows the browser's modal dialog.
 *
 * Inbound message handling
 * ────────────────────────
 * • Plays a sound (Web Audio API — always works once user has interacted).
 * • Shows a native browser notification when permission is granted.
 * • Always shows an in-app toast as a fallback — this guarantees the user
 *   sees something even if browser/OS notifications are blocked.
 *
 * Customer name lookup
 * ────────────────────
 * conversation_updated is emitted by the server BEFORE new_message, so
 * the name Map is populated before the notification handler fires.
 */
export function useGlobalNotifications(): void {
  const { toast } = useToast();
  // Map<conversationId, display name>
  const customerNamesRef = useRef<Map<string, string>>(new Map());
  const permissionToastShownRef = useRef(false);

  // On mount: guide the user if notifications are not yet enabled
  useEffect(() => {
    if (permissionToastShownRef.current) return;
    permissionToastShownRef.current = true;

    if (!('Notification' in window)) return;

    if (Notification.permission === 'default') {
      toast({
        title: '🔔 Enable notifications',
        description: 'Click the bell icon in the sidebar to receive alerts for new messages.',
        duration: 8000,
      });
    } else if (Notification.permission === 'denied') {
      toast({
        title: 'Notifications are blocked',
        description:
          'Go to your browser site settings and allow notifications for this site, then refresh.',
        variant: 'destructive',
        duration: 10000,
      });
    }
  }, [toast]);

  // Request permission on the first user click (a real user gesture so the
  // browser shows the modal dialog, not the quiet address-bar bell).
  // After permission is granted, also register for Web Push so iOS PWA and
  // background browsers receive notifications even when the app is closed.
  useEffect(() => {
    const handleFirstClick = async () => {
      const permission = await requestNotificationPermission();
      if (permission === 'granted') {
        void registerPushSubscription();
      }
    };
    document.addEventListener('click', handleFirstClick, { once: true });
    return () => document.removeEventListener('click', handleFirstClick);
  }, []);

  useEffect(() => {
    // Keep name map current (server emits this BEFORE new_message)
    const handleConversationUpdated = (event: ConversationUpdatedEvent) => {
      const { conversation } = event;
      const displayName =
        conversation.customer.name ?? formatPhoneDisplay(conversation.customer.phone);
      customerNamesRef.current.set(conversation.id, displayName);
    };

    const handleNewMessage = (event: NewMessageEvent) => {
      if (event.message.direction !== 'INBOUND') return;

      playNotificationSound();

      const name = customerNamesRef.current.get(event.conversationId) ?? 'New message';
      const body = event.message.body ?? 'Sent a media message';

      // Try native browser notification
      showBrowserNotification(name, body);

      // Always show an in-app toast as well — this ensures the user sees
      // something even when browser/OS notifications are blocked.
      toast({
        title: name,
        description: body.length > 80 ? `${body.slice(0, 80)}…` : body,
        duration: 5000,
      });
    };

    socket.on('conversation_updated', handleConversationUpdated);
    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('conversation_updated', handleConversationUpdated);
      socket.off('new_message', handleNewMessage);
    };
  }, [toast]);
}
