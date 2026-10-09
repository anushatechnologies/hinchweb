import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { tokenStorage } from './tokenStorage';
import { getFreshFirebaseToken } from './firebase';

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
export const baseURL = rawBase.replace(/\/+$/, '');

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
    const user = tokenStorage.getUser();
    if (user?.userId || user?.id) {
      return Number(user.userId || user.id);
    }
  } catch {
    // fallback
  }
  return 0;
};

// Request interceptor: Attach HinchMart JWT Bearer token if present
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.getAccessToken();
    // Only attach bearer token if not already explicitly set (e.g. specialized auth calls)
    if (token && config.headers && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const uid = getCurrentUserId();
    if (uid && config.headers && !config.headers['X-User-Id']) {
      config.headers['X-User-Id'] = String(uid);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Mutex promise to coordinate concurrent 401 recovery requests
let refreshPromise: Promise<string | null> | null = null;

// Response interceptor: Normalize errors & handle 401 with auto-refresh via Firebase ID Token + /api/auth/sync
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;

    // Do NOT attempt refresh on 403 Forbidden; preserve session for access-denied display
    if (status === 403) {
      window.dispatchEvent(
        new CustomEvent('hinchmart:forbidden', {
          detail: {
            url: originalRequest?.url,
            message: (error.response?.data as any)?.message || 'Access denied for this resource.',
          },
        })
      );
    }

    // Handle 401 Unauthorized token recovery
    const requestUrl = originalRequest?.url || '';
    const isAuthSync = requestUrl.includes('/auth/sync');
    const isLogout = requestUrl.includes('/auth/logout');
    const isCheckPhone = requestUrl.includes('/auth/check-phone');

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthSync &&
      !isLogout &&
      !isCheckPhone
    ) {
      originalRequest._retry = true;

      // Coordinate concurrent 401s so only ONE token-exchange runs at a time
      if (!refreshPromise) {
        refreshPromise = (async () => {
          try {
            // 1. Get fresh Firebase ID Token
            const freshFirebaseToken = await getFreshFirebaseToken(true);
            if (!freshFirebaseToken) {
              throw new Error('No active Firebase session available for renewal');
            }

            // 2. Exchange fresh Firebase ID Token via POST /api/auth/sync
            const syncUrl = `${baseURL}/auth/sync`;
            const syncRes = await axios.post(
              syncUrl,
              { firebaseIdToken: freshFirebaseToken },
              {
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${freshFirebaseToken}`,
                },
                timeout: 12000,
              }
            );

            const resData = syncRes.data?.data || syncRes.data;
            const newAccessToken = resData?.accessToken || resData?.token;
            if (!newAccessToken) {
              throw new Error('Backend did not return an access token during sync');
            }

            // 3. Save replacement HinchMart JWT
            tokenStorage.setAccessToken(newAccessToken);

            window.dispatchEvent(
              new CustomEvent('hinchmart:token-refreshed', {
                detail: { token: newAccessToken },
              })
            );

            return newAccessToken;
          } catch (recoveryErr) {
            // Recovery failed: clear invalid session
            tokenStorage.clearSession();
            window.dispatchEvent(
              new CustomEvent('hinchmart:unauthorized', {
                detail: { reason: 'session_expired' },
              })
            );
            return null;
          } finally {
            refreshPromise = null;
          }
        })();
      }

      const replacementToken = await refreshPromise;
      if (replacementToken && originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${replacementToken}`;
        // Retry the original request once
        return apiClient(originalRequest);
      }
    } else if (status === 401 && (originalRequest?._retry || isAuthSync)) {
      // Recovery has already failed or sync itself failed with 401: clear session
      tokenStorage.clearSession();
      window.dispatchEvent(
        new CustomEvent('hinchmart:unauthorized', {
          detail: { reason: 'auth_failed' },
        })
      );
    }

    const normalizedError: ApiErrorResponse = {
      message:
        (error.response?.data as any)?.message ||
        error.message ||
        'An unexpected network error occurred. Please try again.',
      statusCode: status,
      errors: (error.response?.data as any)?.errors,
    };

    return Promise.reject(normalizedError);
  }
);
