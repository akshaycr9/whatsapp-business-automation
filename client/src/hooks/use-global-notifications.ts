import { useEffect, useRef } from 'react';
import { socket } from '@/lib/socket';
import { playNotificationSound, requestNotificationPermission, showBrowserNotification } from '@/lib/notifications';
import { formatPhoneDisplay } from '@/lib/utils';
import type { ConversationUpdatedEvent } from '@/types';

/**
 * Global hook — call once from App.tsx.
 *
 * Requests browser notification permission on mount, then listens for
 * conversation_updated socket events. When a conversation's unreadCount
 * increases it means a new inbound message arrived → plays a sound and
 * shows a browser notification with the customer name and message preview.
 *
 * Strategy for baseline detection: the first conversation_updated event
 * for each conversation establishes the baseline count. Only subsequent
 * increases above that baseline trigger notifications. This prevents
 * spurious alerts for existing unread messages when the app first loads.
 */
export function useGlobalNotifications(): void {
  // Map<conversationId, lastSeenUnreadCount>
  const unreadRef = useRef<Map<string, number>>(new Map());
  const permissionRequestedRef = useRef(false);

  // Request notification permission once after mount
  useEffect(() => {
    if (permissionRequestedRef.current) return;
    permissionRequestedRef.current = true;
    void requestNotificationPermission();
  }, []);

  useEffect(() => {
    const handleConversationUpdated = (event: ConversationUpdatedEvent) => {
      const { conversation } = event;
      const { id, unreadCount, customer, lastMessageText } = conversation;

      const prev = unreadRef.current.get(id);

      if (prev === undefined) {
        // First time we've seen this conversation — establish baseline, no alert
        unreadRef.current.set(id, unreadCount);
        return;
      }

      if (unreadCount > prev) {
        // New inbound message arrived
        unreadRef.current.set(id, unreadCount);

        playNotificationSound();

        const title = customer.name ?? formatPhoneDisplay(customer.phone);
        const body = lastMessageText ?? 'New message';
        showBrowserNotification(title, body);
      } else {
        // Count stayed same or decreased (e.g., marked as read) — update baseline
        unreadRef.current.set(id, unreadCount);
      }
    };

    socket.on('conversation_updated', handleConversationUpdated);
    return () => {
      socket.off('conversation_updated', handleConversationUpdated);
    };
  }, []);
}
