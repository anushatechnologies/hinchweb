import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useAuthModalStore } from '../../store/useAuthModalStore';
import { useToastStore } from '../../store/useToastStore';
import {
  isFirebaseConfigured,
  signInWithGoogle,
  createRecaptchaVerifier,
  sendFirebasePhoneOtp,
  confirmFirebasePhoneOtp,
} from '../../services/firebase';
import type { ConfirmationResult } from 'firebase/auth';
import {
  X,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Building2,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  UserCheck,
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isOpen, closeAuthModal } = useAuthModalStore();
  const {
    loginWithFirebaseToken,
    completeProfile,
    loginWithPassword,
    sendOtp,
    verifyOtp,
  } = useAuthStore();
  const { showToast } = useToastStore();

  const [authMode, setAuthMode] = useState<'otp' | 'password'>('otp');
  const [identifier, setIdentifier] = useState('');
  const [otpStep, setOtpStep] = useState<'send' | 'verify' | 'complete-profile'>('send');
  const [otpCode, setOtpCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Profile completion state (Step 6 & 7)
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileCompany, setProfileCompany] = useState('');
  const [profileGstin, setProfileGstin] = useState('');

  if (!isOpen) return null;

  const resetModalState = () => {
    setAuthMode('otp');
    setOtpStep('send');
    setIdentifier('');
    setOtpCode('');
    setPassword('');
    setConfirmationResult(null);
    setErrorMessage(null);
    setProfileName('');
    setProfileEmail('');
    setProfilePhone('');
    setProfileCompany('');
    setProfileGstin('');
  };

  const handleClose = () => {
    resetModalState();
    closeAuthModal();
  };

  /**
   * Step 1 & 2: User enters Phone / Email and requests OTP
   */
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanInput = identifier.trim();
    if (!cleanInput) {
      showToast('error', 'Please enter your registered Email or Mobile Number', 'Required Field');
      return;
    }

    setIsSubmitting(true);
    try {
      const numericPhone = cleanInput.replace(/\D/g, '');
      const isPhone = numericPhone.length >= 10 && !cleanInput.includes('@');
      const formattedPhone = cleanInput.startsWith('+') ? cleanInput : `+91${numericPhone}`;

      // If Firebase is configured and user inputted a phone number, use genuine Firebase Phone OTP
      if (isFirebaseConfigured && isPhone) {
        try {
          const verifier = createRecaptchaVerifier('recaptcha-container', { size: 'invisible' });
          if (verifier) {
            const confirmation = await sendFirebasePhoneOtp(formattedPhone, verifier);
            setConfirmationResult(confirmation);
            setProfilePhone(formattedPhone);
            setOtpStep('verify');
            showToast('success', `Verification code sent via SMS to ${formattedPhone}`, 'Firebase OTP Sent');
            return;
          }
        } catch (fbErr: any) {
          console.warn('[Firebase] Phone OTP dispatch failed, falling back:', fbErr);
          // Fall through to fallback test mode
        }
      }

      // Backend / fallback OTP dispatch
      const res = await sendOtp(cleanInput);
      setProfilePhone(formattedPhone);
      setOtpStep('verify');
      if (res.otpCode) {
        setOtpCode(res.otpCode);
      }
      showToast('success', res.message || `OTP dispatched to ${cleanInput}`, 'OTP Sent');
    } catch (err: any) {
      const msg = err.message || 'Failed to send verification OTP. Please try again.';
      setErrorMessage(msg);
      showToast('error', msg, 'OTP Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Step 2, 3, 4, 5, 6: Verify OTP, extract token, sync user with MySQL, and check profile status
   */
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!otpCode.trim()) {
      showToast('error', 'Please enter the 6-digit verification code', 'Code Required');
      return;
    }

    setIsSubmitting(true);
    try {
      let token = '';

      if (confirmationResult) {
        // Step 2 & 3: Confirm with Firebase and extract Firebase ID Token (JWT)
        const cred = await confirmFirebasePhoneOtp(confirmationResult, otpCode.trim());
        token = await cred.user.getIdToken();
      } else {
        // Test / demo mode token
        await verifyOtp(identifier.trim(), otpCode.trim());
        token = localStorage.getItem('hinchmart_auth_token') || 'jwt_session_' + Date.now();
      }

      // Step 4 & 5: Frontend calls POST /api/auth/sync with Authorization: Bearer <firebase_id_token>
      const syncedUser = await loginWithFirebaseToken(token, {});

      // Step 6: Frontend inspects the response
      const hasRealName = Boolean(syncedUser.name && syncedUser.name.trim());
      const hasRealEmail = Boolean(syncedUser.email && syncedUser.email.trim());

      if (!hasRealName || !hasRealEmail || !syncedUser.isProfileComplete) {
        // Show Profile Completion screen
        setProfilePhone(syncedUser.phone || identifier);
        setProfileName(syncedUser.name || '');
        setProfileEmail(syncedUser.email || '');
        setOtpStep('complete-profile');
        showToast('info', 'Phone verified! Please complete your name and business email.', 'Profile Incomplete');
      } else {
        // User profile already complete
        showToast('success', `Welcome back, ${syncedUser.name}!`, 'Authentication Successful');
        handleClose();
      }
    } catch (err: any) {
      if (err.statusCode === 409 || err.message?.includes('already in use')) {
        const conflictMsg = err.message || 'Phone number is already in use by another account.';
        setErrorMessage(conflictMsg);
        showToast('error', conflictMsg, 'Account Conflict (409)');
      } else {
        const msg = err.message || 'Invalid or expired verification code.';
        setErrorMessage(msg);
        showToast('error', msg, 'Verification Failed');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Google OAuth Sign-in (Case B: Registration / Login with Full Real Values)
   */
  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const cred = await signInWithGoogle();
      const token = await cred.user.getIdToken();

      const initialPayload = {
        name: cred.user.displayName || null,
        email: cred.user.email || null,
        phone: cred.user.phoneNumber || null,
        role: 'BUYER',
      };

      // Step 4: POST /api/auth/sync with known Google profile details
      const syncedUser = await loginWithFirebaseToken(token, initialPayload);

      // Step 6: Check profile completion
      const hasRealName = Boolean(syncedUser.name && syncedUser.name.trim());
      const hasRealEmail = Boolean(syncedUser.email && syncedUser.email.trim());

      if (!hasRealName || !hasRealEmail || !syncedUser.isProfileComplete) {
        setProfileName(syncedUser.name || cred.user.displayName || '');
        setProfileEmail(syncedUser.email || cred.user.email || '');
        setProfilePhone(syncedUser.phone || cred.user.phoneNumber || '');
        setOtpStep('complete-profile');
        showToast('info', 'Please complete your business details to finalize your account.', 'Profile Completion');
      } else {
        showToast('success', `Welcome, ${syncedUser.name}!`, 'Google Sign-In Successful');
        handleClose();
      }
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        const msg = err.message || 'Google sign-in failed. Please try again.';
        setErrorMessage(msg);
        showToast('error', msg, 'Authentication Error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Step 7: User completes profile (PUT /api/user/profile)
   */
  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!profileName.trim() || !profileEmail.trim()) {
      showToast('error', 'Full Name and Business Email are required.', 'Required Fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedUser = await completeProfile({
        name: profileName.trim(),
        email: profileEmail.trim(),
        phone: profilePhone.trim() || identifier.trim(),
        companyName: profileCompany.trim(),
        gstin: profileGstin.trim().toUpperCase(),
      });

      showToast('success', `Welcome to HinchMart, ${updatedUser.name}! Profile verified.`, 'Profile Complete');
      handleClose();
    } catch (err: any) {
      if (err.statusCode === 409 || err.message?.includes('already in use')) {
        const conflictMsg = err.message || 'Phone number or email is already registered to another account.';
        setErrorMessage(conflictMsg);
        showToast('error', conflictMsg, 'Duplicate Field (409)');
      } else {
        const msg = err.message || 'Failed to update user profile. Please try again.';
        setErrorMessage(msg);
        showToast('error', msg, 'Profile Update Error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Login with password
   */
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!identifier.trim() || !password.trim()) {
      showToast('error', 'Please enter your credentials', 'Incomplete Form');
      return;
    }

    setIsSubmitting(true);
    try {
      const loggedUser = await loginWithPassword(identifier.trim(), password.trim());
      showToast('success', `Authenticated as ${loggedUser.name || loggedUser.companyName}`, 'Login Successful');
      handleClose();
    } catch (err: any) {
      const msg = err.message || 'Invalid credentials.';
      setErrorMessage(msg);
      showToast('error', msg, 'Login Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-industrial-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-industrial-200 relative animate-in zoom-in-95">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full text-industrial-400 hover:text-industrial-700 hover:bg-industrial-100 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="bg-gradient-to-r from-industrial-950 via-slate-900 to-industrial-950 p-6 text-white text-center relative overflow-hidden">
          <div className="flex justify-center mb-3">
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15 shadow-inner">
              {otpStep === 'complete-profile' ? (
                <UserCheck className="w-8 h-8 text-emerald-400" />
              ) : (
                <Building2 className="w-8 h-8 text-brand-400" />
              )}
            </div>
          </div>

          <h3 className="text-xl font-black tracking-tight text-white">
            {otpStep === 'complete-profile' ? 'Complete Buyer Profile' : 'HinchMart B2B Enterprise Access'}
          </h3>
          <p className="text-xs text-industrial-300 mt-1">
            {otpStep === 'complete-profile'
              ? 'Enter real name and work email to finalize procurement activation'
              : 'Real-time GST-verified buyer & contractor procurement portal'}
          </p>

          {/* Mode Switcher (only shown when not on profile completion) */}
          {otpStep !== 'complete-profile' && (
            <div className="flex justify-center gap-2 mt-4 bg-white/10 p-1 rounded-xl max-w-xs mx-auto text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('otp');
                  setOtpStep('send');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  authMode === 'otp' ? 'bg-brand-600 text-white shadow-sm' : 'text-industrial-300 hover:text-white'
                }`}
              >
                Instant OTP Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('password');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  authMode === 'password' ? 'bg-brand-600 text-white shadow-sm' : 'text-industrial-300 hover:text-white'
                }`}
              >
                Password
              </button>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Error / 409 Conflict Banner */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* STEP 6 & 7: Profile Completion Form */}
          {otpStep === 'complete-profile' ? (
            <form onSubmit={handleCompleteProfile} className="space-y-3.5 text-xs">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Authentication Verified!</div>
                  <div className="text-[11px] text-emerald-700 mt-0.5">
                    Please provide your name & business email to create your verified customer profile.
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-industrial-800 flex items-center justify-between">
                  <span>Full Legal Name *</span>
                  <span className="text-[10px] text-red-500 font-semibold">Required</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Sharma"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-industrial-50 border border-industrial-300 rounded-xl text-xs text-industrial-900 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-industrial-800 flex items-center justify-between">
                  <span>Business Work Email *</span>
                  <span className="text-[10px] text-red-500 font-semibold">Required</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. rajesh@apexinfra.com"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-industrial-50 border border-industrial-300 rounded-xl text-xs text-industrial-900 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="font-bold text-industrial-800">Phone Number</label>
                  <input
                    type="text"
                    disabled
                    value={profilePhone}
                    className="w-full px-3.5 py-2.5 bg-industrial-100 border border-industrial-200 rounded-xl text-xs text-industrial-600 font-mono font-medium cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-industrial-800">Role</label>
                  <input
                    type="text"
                    disabled
                    value="BUYER"
                    className="w-full px-3.5 py-2.5 bg-industrial-100 border border-industrial-200 rounded-xl text-xs text-industrial-600 font-bold font-mono cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-industrial-800">Company Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Apex Infra Projects Pvt Ltd"
                  value={profileCompany}
                  onChange={(e) => setProfileCompany(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-industrial-50 border border-industrial-300 rounded-xl text-xs text-industrial-900 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-industrial-800">Company GSTIN (Optional)</label>
                <input
                  type="text"
                  maxLength={15}
                  placeholder="e.g. 36AAACA1234A1Z5"
                  value={profileGstin}
                  onChange={(e) => setProfileGstin(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 bg-industrial-50 border border-industrial-300 rounded-xl text-xs font-mono text-industrial-900 font-medium uppercase focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-black text-xs shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer mt-2"
              >
                <span>{isSubmitting ? 'Saving Profile...' : 'Save Profile & Enter Portal'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : authMode === 'otp' ? (
            otpStep === 'send' ? (
              /* STEP 1: Phone / Email Input */
              <form onSubmit={handleSendOtp} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-industrial-800 flex items-center justify-between">
                    <span>Email or 10-Digit Mobile</span>
                    <span className="text-[10px] text-industrial-400 font-normal">SMS / Firebase OTP</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. 9876543210 or user@company.com"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full pl-9 pr-4 py-3 bg-industrial-50 border border-industrial-300 rounded-xl text-xs text-industrial-900 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                    />
                    <Mail className="w-4 h-4 text-industrial-400 absolute left-3 top-3.5" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-black text-xs shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <span>{isSubmitting ? 'Dispatching OTP...' : 'Send 6-Digit OTP'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              /* STEP 2 & 3: 6-Digit Verification Code */
              <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div>OTP dispatched to <strong className="font-mono">{profilePhone || identifier}</strong></div>
                    <div className="text-[11px] text-emerald-700 mt-0.5">
                      Enter the 6-digit SMS code to synchronize your session with MySQL backend.
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-industrial-800 flex items-center justify-between">
                    <span>Enter 6-Digit Verification Code</span>
                    <button
                      type="button"
                      onClick={() => setOtpStep('send')}
                      className="text-brand-600 hover:underline text-[11px]"
                    >
                      Change Number
                    </button>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="e.g. 123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-9 pr-4 py-3 bg-industrial-50 border border-industrial-300 rounded-xl text-sm font-mono font-bold tracking-widest text-industrial-950 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                    />
                    <KeyRound className="w-4 h-4 text-industrial-400 absolute left-3 top-3.5" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isSubmitting ? 'Verifying & Synchronizing...' : 'Verify OTP & Authorize Session'}</span>
                </button>
              </form>
            )
          ) : (
            /* Password Authentication Tab */
            <form onSubmit={handlePasswordLogin} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-industrial-800">Email or Mobile</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 bg-industrial-50 border border-industrial-300 rounded-xl text-xs text-industrial-900 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <Mail className="w-4 h-4 text-industrial-400 absolute left-3 top-3.5" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-industrial-800">Password</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 bg-industrial-50 border border-industrial-300 rounded-xl text-xs text-industrial-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <Lock className="w-4 h-4 text-industrial-400 absolute left-3 top-3.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-black text-xs shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                <span>{isSubmitting ? 'Signing in...' : 'Sign In to Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Google Sign-in / Firebase OAuth (Only on send step) */}
          {otpStep === 'send' && (
            <div className="space-y-3 pt-1">
              <div className="relative flex items-center justify-center">
                <div className="border-t border-industrial-200 w-full" />
                <span className="bg-white px-2 text-[10px] uppercase font-bold text-industrial-400 absolute">
                  Or continue with
                </span>
              </div>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 border border-industrial-300 hover:bg-industrial-50 text-industrial-800 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.66-5.17 3.66-9.12z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.13C3.27 21.39 7.35 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.57H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.43l4.02-3.14z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.61 1.26 6.57l4.02 3.14c.95-2.83 3.6-4.96 6.72-4.96z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>
          )}

          {/* Invisible Recaptcha Container for Firebase Phone Verification */}
          <div id="recaptcha-container"></div>

          {/* Footer Security Badges */}
          <div className="pt-3 border-t border-industrial-100 flex items-center justify-between text-[10px] text-industrial-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              256-Bit SSL Encrypted
            </span>
            <span>GSTR-1 & ITC Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};
