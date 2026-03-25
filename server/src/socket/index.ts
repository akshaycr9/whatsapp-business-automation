import { type Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { logger } from '../lib/logger.js';

let io: SocketServer;

export const initSocket = (httpServer: HttpServer): SocketServer => {
  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
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

export const emitMessageStatusUpdate = (messageId: string, status: string): void => {
  getIO().emit('message_status_update', { messageId, status });
};

export const emitAutomationTriggered = (automationId: string, log: unknown): void => {
  getIO().emit('automation_triggered', { automationId, log });
};

export const emitConversationUpdated = (conversation: unknown): void => {
  getIO().emit('conversation_updated', { conversation });
};
