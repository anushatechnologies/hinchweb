import type { User } from '../types';

const TOKEN_KEY = 'hinchmart_auth_token';
const USER_KEY = 'hinchmart_user';

let inMemoryToken: string | null = null;
let inMemoryUser: User | null = null;

export const tokenStorage = {
  getAccessToken(): string | null {
    if (inMemoryToken) {
      return inMemoryToken;
    }
    try {
      const stored = localStorage.getItem(TOKEN_KEY);
      if (stored) {
        inMemoryToken = stored;
        return stored;
      }
    } catch {
      // In private browsing or storage disabled
    }
    return null;
  },

  setAccessToken(token: string | null): void {
    inMemoryToken = token;
    try {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch {
      // Ignore storage errors
    }
  },

  clearAccessToken(): void {
    inMemoryToken = null;
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Ignore storage errors
    }
  },

  getUser(): User | null {
    if (inMemoryUser) {
      return inMemoryUser;
    }
    try {
      const stored = localStorage.getItem(USER_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        inMemoryUser = parsed;
        return parsed;
      }
    } catch {
      // Ignore parse errors
    }
    return null;
  },

  setUser(user: User | null): void {
    inMemoryUser = user;
    try {
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(USER_KEY);
      }
    } catch {
      // Ignore storage errors
    }
  },

  clearUser(): void {
    inMemoryUser = null;
    try {
      localStorage.removeItem(USER_KEY);
    } catch {
      // Ignore storage errors
    }
  },

  clearSession(): void {
    this.clearAccessToken();
    this.clearUser();
  },

  hasToken(): boolean {
    return Boolean(this.getAccessToken());
  },
};
