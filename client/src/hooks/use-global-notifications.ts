import { useEffect, useRef } from 'react';
import { socket } from '@/lib/socket';
import {
  playNotificationSound,
  requestNotificationPermission,
  showBrowserNotification,
} from '@/lib/notifications';
import { formatPhoneDisplay } from '@/lib/utils';
import type { ConversationUpdatedEvent, NewMessageEvent } from '@/types';

/**
 * Global hook — mounted once in App.tsx.
 *
 * Permission strategy
 * ───────────────────
 * Calling requestPermission() on mount (no user gesture) causes Chrome to
 * silently show a tiny bell in the address bar instead of the real dialog.
 * Instead we attach a one-shot click listener so the request fires on the
 * very first interaction the user makes, which counts as a user gesture and
 * reliably shows the modal permission dialog.
 *
 * Notification trigger strategy
 * ─────────────────────────────
 * We listen for new_message events and check direction === 'INBOUND'.
 * For the customer name we maintain a Map<conversationId, displayName>
 * populated by conversation_updated events.  The server now emits
 * conversation_updated BEFORE new_message (see processInboundMessage),
 * so the name is always in the Map when new_message fires.
 */
export function useGlobalNotifications(): void {
  // Map<conversationId, display name> — populated by conversation_updated
  const customerNamesRef = useRef<Map<string, string>>(new Map());

  // Request permission on the first user click (a real user gesture)
  useEffect(() => {
    const handleFirstClick = () => {
      void requestNotificationPermission();
    };
    document.addEventListener('click', handleFirstClick, { once: true });
    return () => document.removeEventListener('click', handleFirstClick);
  }, []);

  useEffect(() => {
    // Keep the name map up-to-date so notifications can show the customer name
    const handleConversationUpdated = (event: ConversationUpdatedEvent) => {
      const { conversation } = event;
      const displayName =
        conversation.customer.name ?? formatPhoneDisplay(conversation.customer.phone);
      customerNamesRef.current.set(conversation.id, displayName);
    };

    // Trigger on every new inbound message
    const handleNewMessage = (event: NewMessageEvent) => {
      if (event.message.direction !== 'INBOUND') return;

      playNotificationSound();

      const name = customerNamesRef.current.get(event.conversationId) ?? 'New message';
      const body = event.message.body ?? 'Sent a media message';
      showBrowserNotification(name, body);
    };

    socket.on('conversation_updated', handleConversationUpdated);
    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('conversation_updated', handleConversationUpdated);
      socket.off('new_message', handleNewMessage);
    };
  }, []);
}
