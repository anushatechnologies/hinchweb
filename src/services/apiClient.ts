import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

export interface ApiErrorResponse {
  message: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
}
// In development, route through Vite proxy (/api) to avoid browser CORS errors
const isDev = import.meta.env.DEV;
const rawBase = isDev
  ? '/api'
  : (import.meta.env.VITE_API_BASE_URL || 'https://api.hinchmart.com/api');
const baseURL = rawBase.replace(/\/+$/, '');

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 15000,
});

// Helper to get active user ID
export const getCurrentUserId = (): number => {
  try {
    const raw = localStorage.getItem('hinchmart_user');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.userId || parsed.id) return Number(parsed.userId || parsed.id);
    }
  } catch (e) {
    // fallback
  }
  return 0;
};

import { getFreshFirebaseToken, isFirebaseConfigured } from './firebase';

// Request interceptor: Attach JWT token if present
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('hinchmart_auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Normalize errors & handle 401 with auto-refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    // If 401 Unauthorized and Firebase is configured, try refreshing token once
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && isFirebaseConfigured) {
      originalRequest._retry = true;
      try {
        const freshToken = await getFreshFirebaseToken(true);
        if (freshToken && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${freshToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshErr) {
        console.warn('Firebase token auto-refresh failed:', refreshErr);
      }
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('hinchmart_auth_token');
      window.dispatchEvent(new CustomEvent('hinchmart:unauthorized'));
    }

    const normalizedError: ApiErrorResponse = {
      message:
        (error.response?.data as any)?.message ||
        error.message ||
        'An unexpected network error occurred. Please try again.',
      statusCode: error.response?.status,
      errors: error.response?.data?.errors,
    };

    return Promise.reject(normalizedError);
  }
);

