import axios from 'axios';

export const api = axios.create({
  // Use a relative base URL so requests flow through Vite's proxy.
  // This works on any device on the same network — the browser hits the Vite
  // dev server (which is reachable via its LAN IP) and Vite forwards /api/*
  // to localhost:3000 server-side. Set VITE_API_URL for production deployments.
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const message =
        (error.response?.data as { error?: { message?: string } })?.error?.message ??
        error.message;
      return Promise.reject(new Error(message));
    }
    return Promise.reject(error);
  },
);
