import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
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
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      auth.settings.appVerificationDisabledForTesting = true;
    }
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
 * Retrieve a fresh Firebase ID Token using the Firebase SDK.
 * Used exclusively for exchanging with backend /api/auth/sync.
 * If forceRefresh is true, forces renewal with Firebase Auth servers.
 */
export async function getFreshFirebaseToken(forceRefresh = false): Promise<string | null> {
  if (!auth?.currentUser) {
    return null;
  }
  try {
    const token = await auth.currentUser.getIdToken(forceRefresh);
    return token;
  } catch (err) {
    console.warn('[Firebase] getIdToken error:', err);
    return null;
  }
}

/**
 * Setup invisible or visible RecaptchaVerifier for Phone OTP verification
 */
let activeRecaptchaVerifier: RecaptchaVerifier | null = null;

export function clearRecaptchaVerifier(): void {
  if (activeRecaptchaVerifier) {
    try {
      activeRecaptchaVerifier.clear();
    } catch {
      // ignore
    }
    activeRecaptchaVerifier = null;
  }
}

/**
 * Setup invisible or visible RecaptchaVerifier for Phone OTP verification
 */
export function createRecaptchaVerifier(
  containerId: string | HTMLElement = 'recaptcha-container',
  options?: {
    size?: 'invisible' | 'normal' | 'compact';
    callback?: (response: unknown) => void;
    'expired-callback'?: () => void;
  }
): RecaptchaVerifier | null {
  if (!auth) return null;

  clearRecaptchaVerifier();

  let target: string | HTMLElement = containerId;
  if (typeof containerId === 'string') {
    let el = document.getElementById(containerId);
    if (!el) {
      el = document.createElement('div');
      el.id = containerId;
      document.body.appendChild(el);
    } else {
      el.innerHTML = '';
    }
    target = el;
  }

  activeRecaptchaVerifier = new RecaptchaVerifier(auth, target, {
    size: options?.size || 'invisible',
    callback: options?.callback,
    'expired-callback': () => {
      clearRecaptchaVerifier();
      options?.['expired-callback']?.();
    },
  });

  return activeRecaptchaVerifier;
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

  // Pre-render verifier to ensure reCAPTCHA widget is ready before dispatch
  try {
    await verifier.render();
  } catch (renderErr) {
    console.warn('[Firebase] verifier.render warning:', renderErr);
  }

  return signInWithPhoneNumber(auth, formattedPhone, verifier);
}

/**
 * Confirm Phone OTP via Firebase and return credential and ID token.
 * Note: The ID token is used for backend token exchange, NOT saved as the HinchMart JWT.
 */
export async function confirmFirebasePhoneOtp(
  confirmationResult: ConfirmationResult,
  otp: string
): Promise<{ credential: UserCredential; idToken: string }> {
  const credential = await confirmationResult.confirm(otp);
  const idToken = await credential.user.getIdToken();
  return { credential, idToken };
}

/**
 * Google Sign-in with Firebase
 */
export async function signInWithGoogle(): Promise<{ credential: UserCredential; idToken: string }> {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized. Please configure Firebase in .env');
  }
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(auth, provider);
  const idToken = await credential.user.getIdToken();
  return { credential, idToken };
}

/**
 * Email & Password Sign-in with Firebase
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ credential: UserCredential; idToken: string }> {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized. Please configure Firebase in .env');
  }
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const idToken = await credential.user.getIdToken();
  return { credential, idToken };
}

/**
 * Email & Password Registration with Firebase
 */
export async function registerWithEmail(
  email: string,
  password: string
): Promise<{ credential: UserCredential; idToken: string }> {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized. Please configure Firebase in .env');
  }
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const idToken = await credential.user.getIdToken();
  return { credential, idToken };
}

/**
 * Sign out from Firebase Auth
 */
export async function signOutFirebase(): Promise<void> {
  if (auth) {
    await signOut(auth);
  }
}

/**
 * Maps Firebase Auth error codes into friendly user messages
 */
export function getFriendlyFirebaseErrorMessage(err: unknown): string {
  if (!err || typeof err !== 'object') {
    return 'An unexpected authentication error occurred.';
  }
  const code = (err as { code?: string }).code || '';
  const message = (err as { message?: string }).message || '';

  switch (code) {
    case 'auth/invalid-verification-code':
      return 'The verification code you entered is invalid. Please double check and try again.';
    case 'auth/code-expired':
      return 'The verification code has expired. Please request a new code.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Access has been temporarily restricted for security. Please try again later.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact HinchMart support.';
    case 'auth/invalid-phone-number':
      return 'Please enter a valid 10-digit mobile phone number.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in window was closed before completing authentication.';
    case 'auth/user-not-found':
      return 'No account found matching these credentials.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/email-already-in-use':
      return 'This email address is already registered to another account.';
    case 'auth/weak-password':
      return 'Password is too weak. Please choose at least 6 characters.';
    case 'auth/network-request-failed':
      return 'Network connection error. Please verify your internet connection.';
    default:
      return message || 'Authentication failed. Please try again.';
  }
}
