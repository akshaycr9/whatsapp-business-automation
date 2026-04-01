import axios from 'axios';

const TOKEN_KEY = 'qwertees_auth_token';

export const api = axios.create({
  // Use a relative base URL so requests flow through Vite's proxy.
  // This works on any device on the same network — the browser hits the Vite
  // dev server (which is reachable via its LAN IP) and Vite forwards /api/*
  // to localhost:3000 server-side. Set VITE_API_URL for production deployments.
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach JWT Bearer token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      // Token expired or invalid mid-session — clear and redirect to login.
      // Skip this for the login endpoint itself: a 401 there means wrong
      // credentials, not an expired session, so we let the error propagate
      // to the caller (LoginPage) to display the error message instead of
      // causing an infinite redirect loop.
      const isLoginRequest = error.config?.url === 'auth/login';
      if (error.response?.status === 401 && !isLoginRequest) {
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = '/login';
        return Promise.reject(new Error('Session expired. Please log in again.'));
      }
      const message =
        (error.response?.data as { error?: { message?: string } })?.error?.message ??
        error.message;
      return Promise.reject(new Error(message));
    }
    return Promise.reject(error);
  },
);
