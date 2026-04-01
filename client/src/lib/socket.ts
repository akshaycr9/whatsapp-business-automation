import { io, type Socket } from 'socket.io-client';

// Empty string makes Socket.io connect to the current page origin.
// Vite proxies /socket.io/* to localhost:3000 (with ws:true for WebSocket upgrades),
// so this works on any device — desktop at localhost:5173 or mobile at 192.168.x.x:5173.
// Set VITE_WS_URL to an absolute URL only for production deployments.
const WS_URL = import.meta.env.VITE_WS_URL ?? '';

export const socket: Socket = io(WS_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export const connectSocket = () => {
  if (!socket.connected) {
    // Pass the JWT token so the server can verify the connection at handshake
    const token = localStorage.getItem('qwertees_auth_token');
    if (token) socket.auth = { token };
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) socket.disconnect();
};
