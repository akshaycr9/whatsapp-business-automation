import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
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
