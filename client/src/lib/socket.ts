import { io, type Socket } from 'socket.io-client';

// Empty string makes Socket.io connect to the current page origin.
// Vite proxies /socket.io/* to localhost:3000 (with ws:true for WebSocket upgrades),
// so this works on any device — desktop at localhost:5173 or mobile at 192.168.x.x:5173.
// Set VITE_WS_URL to an absolute URL only for production deployments.
const WS_URL = import.meta.env.VITE_WS_URL ?? '';

const TOKEN_KEY = 'qwertees_auth_token';

export const socket: Socket = io(WS_URL, {
  autoConnect: false,
  reconnection: true,
  // No cap on reconnection attempts — a server restart in dev would exhaust a
  // small limit and permanently silence all real-time updates.
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10_000,
});

// Re-read the JWT from localStorage before every reconnect attempt so that a
// token rotation never causes the server to permanently reject the socket.
socket.on('reconnect_attempt', () => {
  const token = localStorage.getItem(TOKEN_KEY);
  socket.auth = token ? { token } : {};
});

// Handle token expiration on socket connection error
socket.on('connect_error', (err) => {
  // Check if the error is due to expired or invalid token
  if (err.message === 'Invalid or expired token') {
    // Dispatch custom event that the app can listen to
    window.dispatchEvent(new CustomEvent('session-expired'));
  }
});

export const connectSocket = () => {
  if (!socket.connected) {
    // Pass the JWT token so the server can verify the connection at handshake
    const token = localStorage.getItem(TOKEN_KEY);
    socket.auth = token ? { token } : {};
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export const logoutUser = () => {
  // Clear token from localStorage
  localStorage.removeItem(TOKEN_KEY);
  // Disconnect socket
  disconnectSocket();
  // Redirect to login page
  window.location.href = '/login';
};
