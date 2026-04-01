import jwt from 'jsonwebtoken';
import { type Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { logger } from '../lib/logger.js';
import { env } from '../config/env.js';

let io: SocketServer;

export const initSocket = (httpServer: HttpServer): SocketServer => {
  const allowedOrigins = [process.env.CLIENT_URL ?? 'http://localhost:5173'];
  // Allow the backend's own PUBLIC_URL so the iPhone (via ngrok) can connect
  if (process.env.PUBLIC_URL) allowedOrigins.push(process.env.PUBLIC_URL);

  io = new SocketServer(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
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
    logger.info(`Socket connected: ${socket.id}`);

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
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

export const emitConversationUpdated = (conversation: unknown): void => {
  getIO().emit('conversation_updated', { conversation });
};

export const emitMessageReaction = (messageId: string, reactions: unknown[]): void => {
  getIO().emit('message_reaction', { messageId, reactions });
};
