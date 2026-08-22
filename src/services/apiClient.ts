import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

export interface ApiErrorResponse {
  message: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
}

const rawBase = import.meta.env.VITE_API_BASE_URL || 'https://api.hinchmart.com/api';
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
      if (parsed.id) return Number(parsed.id);
    }
  } catch (e) {
    // fallback
  }
  return 4; // Default demo buyer Rajesh Sharma
};

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

// Response interceptor: Normalize errors & handle 401
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
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
