import { io, type Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL ?? 'http://localhost:3000';

export const socket: Socket = io(WS_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export const connectSocket = () => {
  if (!socket.connected) socket.connect();
};

export const disconnectSocket = () => {
  if (socket.connected) socket.disconnect();
};
