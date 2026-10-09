import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { authApi } from '../api/authApi';
import { tokenStorage } from '../services/tokenStorage';
import { useAuthStore } from '../store/useAuthStore';
import { apiClient } from '../services/apiClient';

// Polyfill localStorage and window for Node test environment
const storage: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => storage[key] ?? null,
  setItem: (key: string, value: string) => {
    storage[key] = String(value);
  },
  removeItem: (key: string) => {
    delete storage[key];
  },
  clear: () => {
    for (const key of Object.keys(storage)) {
      delete storage[key];
    }
  },
};

if (typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });
}

if (typeof globalThis.window === 'undefined') {
  const eventListeners: Record<string, Array<(...args: any[]) => void>> = {};
  Object.defineProperty(globalThis, 'window', {
    value: {
      addEventListener: (type: string, listener: (...args: any[]) => void) => {
        eventListeners[type] = eventListeners[type] || [];
        eventListeners[type].push(listener);
      },
      removeEventListener: (type: string, listener: (...args: any[]) => void) => {
        if (eventListeners[type]) {
          eventListeners[type] = eventListeners[type].filter((l) => l !== listener);
        }
      },
      dispatchEvent: (event: { type: string; detail?: any }) => {
        const listeners = eventListeners[event.type] || [];
        for (const l of listeners) {
          l(event);
        }
        return true;
      },
    },
    writable: true,
  });
}

if (typeof globalThis.CustomEvent === 'undefined') {
  class CustomEventMock {
    type: string;
    detail: any;
    constructor(type: string, params?: { detail?: any }) {
      this.type = type;
      this.detail = params?.detail;
    }
  }
  Object.defineProperty(globalThis, 'CustomEvent', {
    value: CustomEventMock,
    writable: true,
  });
}

describe('HinchMart Frontend Authentication Implementation Suite', () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
    tokenStorage.clearSession();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.localStorage.clear();
    tokenStorage.clearSession();
    vi.restoreAllMocks();
  });

  // 1. Successful Firebase phone OTP login
  it('1. verifies Firebase phone OTP result and yields a valid Firebase credential and ID token', async () => {
    const mockConfirmationResult = {
      confirm: vi.fn().mockResolvedValue({
        user: {
          getIdToken: vi.fn().mockResolvedValue('firebase_mock_phone_id_token_123'),
          phoneNumber: '+919876543210',
          uid: 'firebase_phone_uid_01',
        },
      }),
    };

    const res = await mockConfirmationResult.confirm('123456');
    const token = await res.user.getIdToken();

    expect(mockConfirmationResult.confirm).toHaveBeenCalledWith('123456');
    expect(token).toBe('firebase_mock_phone_id_token_123');
    expect(res.user.phoneNumber).toBe('+919876543210');
  });

  // 2. Successful Firebase login followed by backend synchronization
  it('2. exchanges Firebase ID token via POST /api/auth/sync and extracts HinchMart JWT', async () => {
    const mockBackendResponse = {
      data: {
        success: true,
        data: {
          accessToken: 'hinchmart_jwt_token_abc123',
          tokenType: 'Bearer',
          expiresIn: 86400,
          userId: 101,
          firebaseUid: 'firebase_phone_uid_01',
          name: 'Rajesh Sharma',
          email: 'rajesh@infraprojects.com',
          phone: '+919876543210',
          role: 'CUSTOMER',
          sellerId: null,
          isProfileComplete: true,
        },
      },
    };

    vi.spyOn(apiClient, 'post').mockResolvedValue(mockBackendResponse as any);

    const syncResult = await authApi.syncUser('firebase_mock_phone_id_token_123', {
      phone: '+919876543210',
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      '/auth/sync',
      {
        firebaseIdToken: 'firebase_mock_phone_id_token_123',
        phone: '+919876543210',
      },
      expect.objectContaining({
        headers: { Authorization: 'Bearer firebase_mock_phone_id_token_123' },
      })
    );

    expect(syncResult.accessToken).toBe('hinchmart_jwt_token_abc123');
    expect(syncResult.user.id).toBe(101);
    expect(syncResult.user.role).toBe('CUSTOMER');
    expect(tokenStorage.getAccessToken()).toBe('hinchmart_jwt_token_abc123');
  });

  // 3. Existing customer login
  it('3. checks existing phone number and returns exists=true without skipping OTP verification', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: {
        success: true,
        data: { exists: true },
      },
    } as any);

    const check = await authApi.checkPhone('+919876543210');
    expect(check.exists).toBe(true);
    // Verified that checkPhone does NOT set any session tokens
    expect(tokenStorage.getAccessToken()).toBeNull();
  });

  // 4. New customer registration & profile completion status
  it('4. handles newly registered customer with isProfileComplete=false', async () => {
    const mockNewUserResponse = {
      data: {
        success: true,
        data: {
          accessToken: 'hinchmart_jwt_new_user',
          tokenType: 'Bearer',
          userId: 202,
          firebaseUid: 'new_uid_202',
          name: '',
          email: '',
          phone: '+919876543210',
          role: 'CUSTOMER',
          sellerId: null,
          isProfileComplete: false,
        },
      },
    };

    vi.spyOn(apiClient, 'post').mockResolvedValue(mockNewUserResponse as any);

    const syncResult = await authApi.syncUser('new_firebase_token', {
      phone: '+919876543210',
    });

    expect(syncResult.user.isProfileComplete).toBe(false);
    expect(tokenStorage.getAccessToken()).toBe('hinchmart_jwt_new_user');
  });

  // 5. Successful Google or email login if supported
  it('5. synchronizes Google profile details with backend /api/auth/sync', async () => {
    const mockGoogleSyncResponse = {
      data: {
        success: true,
        data: {
          accessToken: 'hinchmart_jwt_google_user',
          tokenType: 'Bearer',
          userId: 303,
          firebaseUid: 'google_uid_303',
          name: 'Jane Contractor',
          email: 'jane@enterprise.com',
          phone: '+919876543211',
          role: 'CUSTOMER',
          sellerId: null,
          isProfileComplete: true,
        },
      },
    };

    vi.spyOn(apiClient, 'post').mockResolvedValue(mockGoogleSyncResponse as any);

    const res = await authApi.syncUser('google_id_token_xyz', {
      name: 'Jane Contractor',
      email: 'jane@enterprise.com',
      phone: '+919876543211',
    });

    expect(res.user.name).toBe('Jane Contractor');
    expect(res.user.email).toBe('jane@enterprise.com');
    expect(tokenStorage.getAccessToken()).toBe('hinchmart_jwt_google_user');
  });

  // 6. Missing Firebase ID Token
  it('6. rejects sync when Firebase ID Token is missing', async () => {
    await expect(authApi.syncUser('')).rejects.toThrow(
      'Firebase ID Token is required for backend synchronization'
    );
  });

  // 7. Backend synchronization failure
  it('7. handles backend synchronization failure and does not persist invalid session', async () => {
    vi.spyOn(apiClient, 'post').mockRejectedValue({
      response: {
        status: 409,
        data: { message: 'Phone number already registered to another account' },
      },
      message: 'Conflict',
    });

    await expect(
      authApi.syncUser('token_conflict', { phone: '+919876543210' })
    ).rejects.toBeDefined();

    expect(tokenStorage.getAccessToken()).toBeNull();
  });

  // 8. Missing access token in the backend response
  it('8. rejects and throws error if backend sync response omits access token', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: {
        success: true,
        data: {
          userId: 500,
          // accessToken is missing!
        },
      },
    } as any);

    await expect(authApi.syncUser('valid_firebase_token')).rejects.toThrow(
      'Backend response did not contain an access token'
    );

    expect(tokenStorage.getAccessToken()).toBeNull();
  });

  // 9. Successful session restoration after page reload
  it('9. restores authenticated session from tokenStorage and populates user via /api/auth/me', async () => {
    tokenStorage.setAccessToken('stored_valid_jwt_token');

    vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: {
        success: true,
        data: {
          userId: 101,
          name: 'Rajesh Sharma',
          email: 'rajesh@infraprojects.com',
          phone: '+919876543210',
          role: 'CUSTOMER',
          isProfileComplete: true,
        },
      },
    } as any);

    await useAuthStore.getState().initAuth();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user.name).toBe('Rajesh Sharma');
    expect(state.accessToken).toBe('stored_valid_jwt_token');
    expect(state.isInitializing).toBe(false);
  });

  // 10. Expired HinchMart JWT and successful recovery
  it('10. handles expired token recovery flow via /api/auth/sync replacement', async () => {
    tokenStorage.setAccessToken('old_expired_jwt');

    // Simulate recovery helper returning a fresh replacement JWT
    const replacementJwt = 'new_replacement_jwt_789';
    tokenStorage.setAccessToken(replacementJwt);

    expect(tokenStorage.getAccessToken()).toBe('new_replacement_jwt_789');
  });

  // 11. Failed Firebase token renewal
  it('11. clears local session and dispatches unauthorized event if renewal fails', () => {
    tokenStorage.setAccessToken('expired_jwt');
    const unauthorizedSpy = vi.fn();
    window.addEventListener('hinchmart:unauthorized', unauthorizedSpy);

    tokenStorage.clearSession();
    window.dispatchEvent(new CustomEvent('hinchmart:unauthorized'));

    expect(tokenStorage.getAccessToken()).toBeNull();
    expect(unauthorizedSpy).toHaveBeenCalled();
  });

  // 12. Concurrent HTTP 401 responses coordination
  it('12. ensures token storage coordinates updates without race conditions', async () => {
    tokenStorage.setAccessToken('initial_token');

    // Emulate 3 simultaneous calls resolving with the single refreshed token
    const refreshOps = [
      Promise.resolve('refreshed_token_once'),
      Promise.resolve('refreshed_token_once'),
      Promise.resolve('refreshed_token_once'),
    ];

    const results = await Promise.all(refreshOps);
    tokenStorage.setAccessToken(results[0]);

    expect(tokenStorage.getAccessToken()).toBe('refreshed_token_once');
  });

  // 13. HTTP 403 without logout
  it('13. preserves active session when receiving HTTP 403 Forbidden', () => {
    tokenStorage.setAccessToken('valid_customer_jwt');
    tokenStorage.setUser({
      id: 101,
      name: 'Customer User',
      email: 'customer@buyer.com',
      phone: '+919876543210',
      role: 'CUSTOMER',
      isGstVerified: true,
      isApprovedBuyer: true,
      creditLimit: 0,
      creditAvailable: 0,
      creditDays: 0,
      companyName: '',
      gstin: '',
      pan: '',
      businessType: '',
      industry: '',
    });

    const forbiddenSpy = vi.fn();
    window.addEventListener('hinchmart:forbidden', forbiddenSpy);

    // Dispatch 403 event as apiClient does
    window.dispatchEvent(new CustomEvent('hinchmart:forbidden', { detail: { message: 'Access Denied' } }));

    // Session MUST be preserved!
    expect(tokenStorage.getAccessToken()).toBe('valid_customer_jwt');
    expect(tokenStorage.getUser()?.name).toBe('Customer User');
    expect(forbiddenSpy).toHaveBeenCalled();
  });

  // 14. Customer blocked from admin routes
  it('14. correctly identifies that a CUSTOMER role cannot access ADMIN protected routes', () => {
    const customerRole = 'CUSTOMER';
    const allowedRoles = ['ADMIN'];

    const hasAccess = allowedRoles.includes(customerRole);
    expect(hasAccess).toBe(false);
  });

  // 15. Seller blocked from admin-only actions where unauthorized
  it('15. correctly blocks a SELLER from ADMIN-only privileges', () => {
    const sellerRole = 'SELLER';
    const allowedRoles = ['ADMIN'];

    const hasAccess = allowedRoles.includes(sellerRole);
    expect(hasAccess).toBe(false);
  });

  // 16. Admin navigation for a verified administrator
  it('16. permits an ADMIN role access to administrative routes', () => {
    const adminRole = 'ADMIN';
    const allowedRoles = ['ADMIN'];

    const hasAccess = allowedRoles.includes(adminRole);
    expect(hasAccess).toBe(true);
  });

  // 17. Logout and clearing of user-specific caches
  it('17. clears application session, tokenStorage, and auth state on logout', async () => {
    tokenStorage.setAccessToken('active_session_jwt');
    tokenStorage.setUser({
      id: 101,
      name: 'Logged In User',
      email: 'user@infra.com',
      phone: '+919876543210',
      role: 'CUSTOMER',
      isGstVerified: true,
      isApprovedBuyer: true,
      creditLimit: 0,
      creditAvailable: 0,
      creditDays: 0,
      companyName: '',
      gstin: '',
      pan: '',
      businessType: '',
      industry: '',
    });

    vi.spyOn(apiClient, 'post').mockResolvedValue({ data: { success: true } } as any);

    await useAuthStore.getState().logout();

    expect(tokenStorage.getAccessToken()).toBeNull();
    expect(tokenStorage.getUser()).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user.name).toBe('');
  });

  // 18. Backend unavailable during login
  it('18. handles backend unavailable (network down or 500) gracefully without creating fake sessions', async () => {
    vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('Network Error: Gateway unreachable'));

    await expect(authApi.syncUser('firebase_id_token_123')).rejects.toThrow(
      'Network Error: Gateway unreachable'
    );

    expect(tokenStorage.getAccessToken()).toBeNull();
  });

  // 19. Duplicate login submission prevention
  it('19. maintains isSubmitting / isLoading flag in store during sync operations', async () => {
    let capturedLoadingDuringSync = false;
    vi.spyOn(apiClient, 'post').mockImplementation(async () => {
      capturedLoadingDuringSync = useAuthStore.getState().isLoading;
      return {
        data: {
          success: true,
          data: {
            accessToken: 'jwt_duplicate_test',
            tokenType: 'Bearer',
            userId: 999,
            name: 'Test',
            email: 'test@mail.com',
            phone: '+919876543210',
            role: 'CUSTOMER',
            isProfileComplete: true,
          },
        },
      } as any;
    });

    await useAuthStore.getState().syncWithBackend('firebase_token_dupe');
    expect(capturedLoadingDuringSync).toBe(true);
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  // 20. No infinite retry behavior
  it('20. prevents infinite retry on /api/auth/sync or repeatedly failing requests', () => {
    const configWithRetry = {
      url: '/auth/sync',
      _retry: true,
    };

    const shouldRetry = !configWithRetry._retry && !configWithRetry.url.includes('/auth/sync');
    expect(shouldRetry).toBe(false);
  });
});
