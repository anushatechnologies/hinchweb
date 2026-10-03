import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  onIdTokenChanged,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
  type User as FirebaseUser,
  type ConfirmationResult,
  type UserCredential,
} from 'firebase/auth';

// Standard Firebase config read from Vite environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);

    // Keep token refreshed automatically in localStorage so requests never fail with 401
    onIdTokenChanged(auth, async (user: FirebaseUser | null) => {
      if (user) {
        try {
          const freshToken = await user.getIdToken();
          localStorage.setItem('hinchmart_auth_token', freshToken);
        } catch (tokenErr) {
          console.warn('[Firebase] Error refreshing ID token:', tokenErr);
        }
      } else {
        // If user logged out of Firebase and the existing token was a Firebase JWT, clear it
        const currentToken = localStorage.getItem('hinchmart_auth_token');
        if (currentToken && !currentToken.startsWith('jwt_demo_')) {
          localStorage.removeItem('hinchmart_auth_token');
        }
      }
    });
  } catch (err) {
    console.error('[Firebase] Initialization error:', err);
  }
} else {
  console.info(
    '[Firebase] VITE_FIREBASE_API_KEY / VITE_FIREBASE_PROJECT_ID not set. Running in demo mode or waiting for Firebase configuration.'
  );
}

export { app as firebaseApp, auth as firebaseAuth };

/**
 * Get current authenticated Firebase user
 */
export function getCurrentFirebaseUser(): FirebaseUser | null {
  return auth?.currentUser || null;
}

/**
 * Retrieve a fresh Firebase ID Token.
 * If forceRefresh is true, forces token renewal with Firebase Auth servers.
 */
export async function getFreshFirebaseToken(forceRefresh = false): Promise<string | null> {
  if (!auth?.currentUser) {
    return localStorage.getItem('hinchmart_auth_token');
  }
  try {
    const token = await auth.currentUser.getIdToken(forceRefresh);
    localStorage.setItem('hinchmart_auth_token', token);
    return token;
  } catch (err) {
    console.warn('[Firebase] getIdToken error:', err);
    return localStorage.getItem('hinchmart_auth_token');
  }
}

/**
 * Setup invisible or visible RecaptchaVerifier for Phone OTP verification
 */
export function createRecaptchaVerifier(
  containerId: string | HTMLElement,
  options?: {
    size?: 'invisible' | 'normal' | 'compact';
    callback?: (response: any) => void;
    'expired-callback'?: () => void;
  }
): RecaptchaVerifier | null {
  if (!auth) return null;
  return new RecaptchaVerifier(auth, containerId, {
    size: options?.size || 'invisible',
    callback: options?.callback,
    'expired-callback': options?.['expired-callback'],
  });
}

/**
 * Send Phone OTP via Firebase
 */
export async function sendFirebasePhoneOtp(
  phoneNumber: string,
  verifier: RecaptchaVerifier
): Promise<ConfirmationResult> {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized. Please configure Firebase in .env');
  }
  // Ensure international +91 format if not present
  let formattedPhone = phoneNumber.trim();
  if (!formattedPhone.startsWith('+')) {
    formattedPhone = `+91${formattedPhone.replace(/\D/g, '')}`;
  }
  return signInWithPhoneNumber(auth, formattedPhone, verifier);
}

/**
 * Confirm Phone OTP via Firebase
 */
export async function confirmFirebasePhoneOtp(
  confirmationResult: ConfirmationResult,
  otp: string
): Promise<UserCredential> {
  const credential = await confirmationResult.confirm(otp);
  const token = await credential.user.getIdToken();
  localStorage.setItem('hinchmart_auth_token', token);
  return credential;
}

/**
 * Google Sign-in with Firebase
 */
export async function signInWithGoogle(): Promise<UserCredential> {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized. Please configure Firebase in .env');
  }
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(auth, provider);
  const token = await credential.user.getIdToken();
  localStorage.setItem('hinchmart_auth_token', token);
  return credential;
}

/**
 * Email & Password Sign-in with Firebase
 */
export async function signInWithEmail(email: string, password: string): Promise<UserCredential> {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized. Please configure Firebase in .env');
  }
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const token = await credential.user.getIdToken();
  localStorage.setItem('hinchmart_auth_token', token);
  return credential;
}

/**
 * Sign out from Firebase
 */
export async function signOutFirebase(): Promise<void> {
  if (auth) {
    await signOut(auth);
  }
  localStorage.removeItem('hinchmart_auth_token');
}
