import { useEffect, useRef } from 'react';
import { socket } from '@/lib/socket';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  conversationUpdated,
  newMessageInConversation,
  setCategory,
  selectActiveCategory,
} from '@/features/conversations/conversationsSlice';
import {
  messageReceived,
  messageStatusUpdated,
  messageReactionUpdated,
  checkWindow,
  windowUpdated,
} from '@/features/messages/messagesSlice';
import { fetchDashboardStats } from '@/features/dashboard/dashboardSlice';
import type {
  NewMessageEvent,
  MessageStatusUpdateEvent,
  ConversationUpdatedEvent,
  MessageReactionEvent,
} from '@/types';

/**
 * Mount once at the authenticated app root (AppShellLayout).
 *
 * All Socket.io events are funnelled through this single hook, which dispatches
 * to the Redux store. This is the authoritative single place for real-time state
 * updates — no slice or component subscribes to socket events independently.
 */
export function useSocketEvents(): void {
  const dispatch = useAppDispatch();
  const activeCategory = useAppSelector(selectActiveCategory);
  const activeCategoryRef = useRef(activeCategory);

  // Keep the ref in sync with Redux state, but don't re-run socket handlers effect
  useEffect(() => {
    activeCategoryRef.current = activeCategory;
  }, [activeCategory]);

  useEffect(() => {
    const handleNewMessage = (event: NewMessageEvent) => {
      // Update conversation list (move to top, update lastMessage)
      dispatch(newMessageInConversation(event));
      // Append message if its conversation is open in the messages slice
      dispatch(messageReceived(event));
      // Re-check the 24h window for the active conversation
      void dispatch(checkWindow(event.conversationId));
      // Refresh dashboard stats counter
      void dispatch(fetchDashboardStats());
    };

    const handleMessageStatusUpdate = (event: MessageStatusUpdateEvent) => {
      dispatch(messageStatusUpdated(event));
    };

    const handleConversationUpdated = (event: ConversationUpdatedEvent) => {
      dispatch(conversationUpdated(event));
      // Sync editor open/closed state with the new category in real time.
      // 'chats' = window closed (template-only); 'requesting'/'intervened' = window open.
      dispatch(windowUpdated({
        conversationId: event.conversation.id,
        isOpen: event.category !== 'chats',
      }));
      // If conversation moved to a different category, auto-switch to show it immediately.
      // Otherwise it would disappear from the current view and confuse the user.
      const targetCategory = event.category === 'chats' ? null : event.category;
      if (targetCategory !== activeCategoryRef.current) {
        dispatch(setCategory(targetCategory));
      }
    };

    const handleMessageReaction = (event: MessageReactionEvent) => {
      dispatch(messageReactionUpdated(event));
    };

    const handleAutomationTriggered = () => {
      void dispatch(fetchDashboardStats());
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_status_update', handleMessageStatusUpdate);
    socket.on('conversation_updated', handleConversationUpdated);
    socket.on('message_reaction', handleMessageReaction);
    socket.on('automation_triggered', handleAutomationTriggered);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_status_update', handleMessageStatusUpdate);
      socket.off('conversation_updated', handleConversationUpdated);
      socket.off('message_reaction', handleMessageReaction);
      socket.off('automation_triggered', handleAutomationTriggered);
    };
  }, [dispatch]);
}
