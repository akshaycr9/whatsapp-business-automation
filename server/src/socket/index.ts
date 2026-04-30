import jwt from 'jsonwebtoken';
import { type Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { logger } from '../lib/logger.js';
import { env } from '../config/env.js';
import type { ConversationWithCustomerOnly } from '../services/conversation.service.js';
import { categorizeConversation } from '../services/conversation.service.js';

let io: SocketServer;

export const initSocket = (httpServer: HttpServer): SocketServer => {
  // In development: allow all origins so that localhost:5173, localhost:4173,
  // and any ngrok / tunnel URL work without needing to configure CLIENT_URL.
  // In production: restrict to the explicit CLIENT_URL.
  const corsOrigin: string | boolean =
    env.NODE_ENV === 'production'
      ? (process.env.CLIENT_URL ?? false)
      : true; // reflect any request origin — safe for single-user dev tool

  io = new SocketServer(httpServer, {
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // ── JWT handshake verification ────────────────────────────────────────────
  // Reject socket connections that don't carry a valid token.
  // The client passes { auth: { token } } when calling socket.connect().
  io.use((socket, next) => {
    const token = socket.handshake.auth['token'] as string | undefined;
    if (!token) {
      next(new Error('Authentication required'));
      return;
    }
    try {
      jwt.verify(token, env.JWT_SECRET);
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id} (origin: ${socket.handshake.headers.origin ?? 'unknown'})`);

    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id} — reason: ${reason}`);
    });
  });

  return io;
};

export const getIO = (): SocketServer => {
  if (!io) throw new Error('Socket.io not initialised. Call initSocket() first.');
  return io;
};

// Typed event emitters
export const emitNewMessage = (conversationId: string, message: unknown): void => {
  getIO().emit('new_message', { conversationId, message });
};

export const emitMessageStatusUpdate = (
  messageId: string,
  status: string,
  timestamps?: Record<string, string>,
): void => {
  getIO().emit('message_status_update', { messageId, status, timestamps });
};

export const emitAutomationTriggered = (automationId: string, log: unknown): void => {
  getIO().emit('automation_triggered', { automationId, log });
};

export const emitConversationUpdated = (conversation: ConversationWithCustomerOnly): void => {
  const category = categorizeConversation(conversation);
  getIO().emit('conversation_updated', { conversation, category });
};

export const emitMessageReaction = (messageId: string, reactions: unknown[]): void => {
  getIO().emit('message_reaction', { messageId, reactions });
};
