import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useAuthModalStore } from '../../store/useAuthModalStore';
import { useToastStore } from '../../store/useToastStore';
import { mapBackendUser } from '../../api/authApi';
import { tokenStorage } from '../../services/tokenStorage';
import {
  isFirebaseConfigured,
  createRecaptchaVerifier,
  clearRecaptchaVerifier,
  sendFirebasePhoneOtp,
  confirmFirebasePhoneOtp,
  getFriendlyFirebaseErrorMessage,
} from '../../services/firebase';
import type { ConfirmationResult } from 'firebase/auth';
import {
  X,
  ArrowRight,
  ShieldCheck,
  Building2,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Smartphone,
  UserPlus,
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isOpen, initialMode, initialPhone, closeAuthModal } = useAuthModalStore();
  const {
    syncWithBackend,
    completeProfile,
    checkPhone,
  } = useAuthStore();
  const { showToast } = useToastStore();

  const [identifier, setIdentifier] = useState('');
  const [otpStep, setOtpStep] = useState<'send' | 'verify' | 'register' | 'complete-profile'>('send');
  const [otpCode, setOtpCode] = useState('');
  const [phoneExistsHint, setPhoneExistsHint] = useState<boolean | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Profile & Registration Form State
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileCompany, setProfileCompany] = useState('');
  const [profileGstin, setProfileGstin] = useState('');

  // Sync initial mode & phone when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialMode === 'register') {
        setOtpStep('register');
        if (initialPhone) {
          setIdentifier(initialPhone);
          setProfilePhone(initialPhone);
        }
      } else {
        setOtpStep('send');
        if (initialPhone) {
          setIdentifier(initialPhone);
        }
      }
    }
  }, [isOpen, initialMode, initialPhone]);

  if (!isOpen) return null;

  const resetModalState = () => {
    setOtpStep('send');
    setIdentifier('');
    setOtpCode('');
    setPhoneExistsHint(null);
    setConfirmationResult(null);
    setErrorMessage(null);
    setProfileName('');
    setProfileEmail('');
    setProfilePhone('');
    setProfileCompany('');
    setProfileGstin('');
  };

  const handleClose = () => {
    clearRecaptchaVerifier();
    resetModalState();
    closeAuthModal();
  };

  /**
   * Navigate to Register page / step if account does not exist
   */
  const handleNavigateToSignUp = () => {
    const rawDigits = identifier.replace(/\D/g, '');
    const formatted = identifier.startsWith('+') ? identifier : rawDigits ? `+91${rawDigits}` : '';
    setProfilePhone(formatted || identifier);
    setOtpStep('register');
    setErrorMessage(null);
  };

  /**
   * Phone OTP Step 1: Send OTP via Firebase
   */
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMessage(null);

    const cleanInput = identifier.trim();
    if (!cleanInput) {
      showToast('error', 'Please enter your 10-digit mobile number', 'Required Field');
      return;
    }

    const numericPhone = cleanInput.replace(/\D/g, '');
    if (numericPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile phone number.');
      return;
    }

    const formattedPhone = cleanInput.startsWith('+') ? cleanInput : `+91${numericPhone}`;

    setIsSubmitting(true);
    try {
      // Step 4 in flow: Check if phone number exists in backend
      try {
        const phoneCheck = await checkPhone(formattedPhone);

        // If phone does not exist, directly navigate to the registration form
        if (phoneCheck.exists === false) {
          setProfilePhone(formattedPhone);
          setOtpStep('register');
          setIsSubmitting(false);
          showToast('info', `No registered account found for ${formattedPhone}. Directing to sign up...`, 'New User Registration');
          return;
        }
      } catch {
        // Continue if check-phone fails
      }

      if (!isFirebaseConfigured) {
        // Fallback for development/testing when Firebase environment variables are not supplied
        setProfilePhone(formattedPhone);
        setOtpStep('verify');
        setOtpCode('123456');
        showToast('info', `Dev Mode: OTP sent to ${formattedPhone}. Enter code 123456 to test.`, 'Dev Verification');
        return;
      }

      const verifier = createRecaptchaVerifier('recaptcha-container', { size: 'invisible' });
      if (!verifier) {
        throw new Error('Unable to initialize reCAPTCHA verifier for phone authentication.');
      }

      const confirmation = await sendFirebasePhoneOtp(formattedPhone, verifier);

      setConfirmationResult(confirmation);
      setProfilePhone(formattedPhone);
      setOtpStep('verify');
      setOtpCode('');
      showToast('success', `Verification code sent via SMS to ${formattedPhone}`, 'OTP Sent');
    } catch (err: any) {
      clearRecaptchaVerifier();
      const friendlyMsg = getFriendlyFirebaseErrorMessage(err);
      setErrorMessage(friendlyMsg);
      showToast('error', friendlyMsg, 'OTP Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Registration Step: Sends OTP with pre-filled profile details
   */
  const handleRegisterSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMessage(null);

    if (!profileName.trim() || !profileEmail.trim()) {
      showToast('error', 'Full Name and Work Email are required for registration.', 'Required Fields');
      return;
    }

    const rawDigits = (profilePhone || identifier).replace(/\D/g, '');
    if (rawDigits.length < 10) {
      setErrorMessage('Please provide a valid 10-digit mobile phone number.');
      return;
    }

    const formattedPhone = (profilePhone || identifier).startsWith('+')
      ? (profilePhone || identifier)
      : `+91${rawDigits}`;

    setIsSubmitting(true);
    try {
      if (!isFirebaseConfigured) {
        setProfilePhone(formattedPhone);
        setOtpStep('verify');
        setOtpCode('123456');
        showToast('info', `Dev Mode: OTP sent to ${formattedPhone}. Enter code 123456 to test.`, 'Dev Verification');
        return;
      }

      const verifier = createRecaptchaVerifier('recaptcha-container', { size: 'invisible' });
      if (!verifier) {
        throw new Error('Unable to initialize reCAPTCHA verifier for phone authentication.');
      }

      const confirmation = await sendFirebasePhoneOtp(formattedPhone, verifier);

      setConfirmationResult(confirmation);
      setProfilePhone(formattedPhone);
      setOtpStep('verify');
      setOtpCode('');
      showToast('success', `Verification code sent via SMS to ${formattedPhone}`, 'OTP Sent');
    } catch (err: any) {
      clearRecaptchaVerifier();
      const friendlyMsg = getFriendlyFirebaseErrorMessage(err);
      setErrorMessage(friendlyMsg);
      showToast('error', friendlyMsg, 'OTP Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Phone OTP Step 2: Verify OTP with Firebase and Synchronize with Backend
   */
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMessage(null);

    const code = otpCode.trim();
    if (!code || code.length !== 6) {
      showToast('error', 'Please enter the 6-digit verification code', 'Code Required');
      return;
    }

    if (!confirmationResult && isFirebaseConfigured) {
      setErrorMessage('Verification session expired. Please request a new verification code.');
      setOtpStep('send');
      return;
    }

    setIsSubmitting(true);
    try {
      // Step 5 & 6: Firebase verifies the OTP and issues a Firebase ID Token (or dev token if unconfigured)
      let idToken = '';
      if (confirmationResult) {
        const res = await confirmFirebasePhoneOtp(confirmationResult, code);
        idToken = res.idToken;
      } else {
        idToken = `dev_firebase_id_token_${Date.now()}`;
      }

      // Step 7 & 8: Call POST /api/auth/sync with the Firebase ID Token
      let syncedUser: any;
      try {
        syncedUser = await syncWithBackend(idToken, {
          phone: profilePhone || identifier,
          name: profileName || null,
          email: profileEmail || null,
        });
      } catch (syncErr: any) {
        if (!isFirebaseConfigured) {
          const devUser = mapBackendUser({
            id: 'dev_user_' + Date.now(),
            name: profileName || 'Dev User',
            email: profileEmail || 'dev@hinchmart.com',
            phone: profilePhone || identifier,
            role: 'BUYER',
            isProfileComplete: Boolean(profileName && profileEmail),
          });
          tokenStorage.setAccessToken('dev_access_token_' + Date.now());
          tokenStorage.setUser(devUser);
          useAuthStore.setState({
            user: devUser,
            accessToken: 'dev_access_token_' + Date.now(),
            isAuthenticated: true,
          });
          syncedUser = devUser;
        } else {
          throw syncErr;
        }
      }

      // Step 12: Navigate according to role and profile-completion status
      if (!syncedUser.isProfileComplete || !syncedUser.name || !syncedUser.email) {
        setProfilePhone(syncedUser.phone || identifier);
        setProfileName(syncedUser.name || profileName || '');
        setProfileEmail(syncedUser.email || profileEmail || '');
        setOtpStep('complete-profile');
        showToast('info', 'Phone verified! Please complete your name and business email.', 'Profile Incomplete');
      } else {
        showToast('success', `Welcome back, ${syncedUser.name}!`, 'Authentication Successful');
        handleClose();
      }
    } catch (err: any) {
      const msg = err.statusCode === 409
        ? 'This phone number is already associated with another account.'
        : getFriendlyFirebaseErrorMessage(err);
      setErrorMessage(msg);
      showToast('error', msg, 'Verification Failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**


  /**
   * Profile Completion Step: PUT /api/user/profile
   */
  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMessage(null);

    if (!profileName.trim() || !profileEmail.trim()) {
      showToast('error', 'Full Legal Name and Business Email are required.', 'Required Fields');
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
      const msg = err.message || 'Failed to update user profile. Please try again.';
      setErrorMessage(msg);
      showToast('error', msg, 'Profile Update Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-industrial-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-industrial-200 relative animate-in zoom-in-95 max-h-[95vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full text-industrial-400 hover:text-industrial-700 hover:bg-industrial-100 transition-colors z-10 cursor-pointer"
          aria-label="Close authentication modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="bg-gradient-to-r from-industrial-950 via-slate-900 to-industrial-950 p-6 text-white text-center relative overflow-hidden">
          <div className="flex justify-center mb-3">
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15 shadow-inner">
              {otpStep === 'register' ? (
                <UserPlus className="w-8 h-8 text-brand-400" />
              ) : otpStep === 'complete-profile' ? (
                <UserCheck className="w-8 h-8 text-emerald-400" />
              ) : (
                <Building2 className="w-8 h-8 text-brand-400" />
              )}
            </div>
          </div>

          <h3 className="text-xl font-black tracking-tight text-white">
            {otpStep === 'register'
              ? 'New Buyer Registration'
              : otpStep === 'complete-profile'
              ? 'Complete Buyer Profile'
              : 'HinchMart Enterprise Procurement'}
          </h3>
          <p className="text-xs text-industrial-300 mt-1">
            {otpStep === 'register'
              ? 'Create a verified procurement account for wholesale pricing'
              : otpStep === 'complete-profile'
              ? 'Enter legal name and work email to finalize account activation'
              : 'Secure B2B authentication with Firebase & HinchMart JWT tokens'}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* SIGN UP / REGISTRATION FORM */}
          {otpStep === 'register' ? (
            <form onSubmit={handleRegisterSendOtp} className="space-y-3.5 text-xs">
              <div className="p-3 bg-brand-50 rounded-xl border border-brand-200 text-brand-950 text-xs flex items-start gap-2">
                <UserPlus className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">New Account Registration</div>
                  <div className="text-[11px] text-brand-700 mt-0.5">
                    Enter your organization details to create your verified customer account.
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
                  placeholder="Enter your full name"
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
                  placeholder="name@company.com"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-industrial-50 border border-industrial-300 rounded-xl text-xs text-industrial-900 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-industrial-800 flex items-center justify-between">
                  <span>10-Digit Mobile Number *</span>
                  <span className="text-[10px] text-red-500 font-semibold">SMS OTP Verification</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit mobile number"
                  value={profilePhone || identifier}
                  onChange={(e) => {
                    setProfilePhone(e.target.value);
                    setIdentifier(e.target.value);
                  }}
                  className="w-full px-3.5 py-2.5 bg-industrial-50 border border-industrial-300 rounded-xl text-xs font-mono text-industrial-900 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-industrial-800">Company Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Infrastructure & Projects Pvt Ltd"
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
                  placeholder="15-digit GSTIN"
                  value={profileGstin}
                  onChange={(e) => setProfileGstin(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 bg-industrial-50 border border-industrial-300 rounded-xl text-xs font-mono text-industrial-900 font-medium uppercase focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                />
              </div>

              {/* reCAPTCHA Mount Container */}
              <div id="recaptcha-container" className="my-1 empty:hidden flex justify-center" />

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-black text-xs shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <span>{isSubmitting ? 'Sending OTP...' : 'Send OTP & Register'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOtpStep('send');
                    setErrorMessage(null);
                  }}
                  className="px-4 py-3 border border-industrial-300 hover:bg-industrial-100 text-industrial-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setOtpStep('send');
                    setPhoneExistsHint(null);
                  }}
                  className="text-brand-600 hover:underline text-[11px] font-semibold cursor-pointer"
                >
                  Already have an account? Sign In
                </button>
              </div>
            </form>
          ) : otpStep === 'complete-profile' ? (
            /* Complete Profile Form */
            <form onSubmit={handleCompleteProfile} className="space-y-3.5 text-xs">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Authentication Verified!</div>
                  <div className="text-[11px] text-emerald-700 mt-0.5">
                    Please provide your legal name & work email to complete your verified buyer account.
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
                  placeholder="Enter your full name"
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
                  placeholder="name@company.com"
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
                  <label className="font-bold text-industrial-800">Account Type</label>
                  <input
                    type="text"
                    disabled
                    value="CUSTOMER"
                    className="w-full px-3.5 py-2.5 bg-industrial-100 border border-industrial-200 rounded-xl text-xs text-industrial-600 font-bold font-mono cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-industrial-800">Company Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Infrastructure & Projects Pvt Ltd"
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
                  placeholder="15-digit GSTIN"
                  value={profileGstin}
                  onChange={(e) => setProfileGstin(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 bg-industrial-50 border border-industrial-300 rounded-xl text-xs font-mono text-industrial-900 font-medium uppercase focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-black text-xs shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <span>{isSubmitting ? 'Saving Profile...' : 'Save Profile & Enter Portal'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-3 border border-industrial-300 hover:bg-industrial-100 text-industrial-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : otpStep === 'send' ? (
            /* Phone Input Step */
            <form onSubmit={handleSendOtp} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-industrial-800 flex items-center justify-between">
                  <span>10-Digit Mobile Number</span>
                  <span className="text-[10px] text-industrial-400 font-normal">SMS OTP Verification</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile number"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      setPhoneExistsHint(null);
                    }}
                    className="w-full pl-9 pr-4 py-3 bg-industrial-50 border border-industrial-300 rounded-xl text-xs text-industrial-900 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                  />
                  <Smartphone className="w-4 h-4 text-industrial-400 absolute left-3 top-3.5" />
                </div>
              </div>

              {/* If phone exists: Show verified hint */}
              {phoneExistsHint === true && (
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Existing account detected. Sign in with OTP.</span>
                </div>
              )}

              {/* reCAPTCHA Mount Container */}
              <div id="recaptcha-container" className="my-1 empty:hidden flex justify-center" />

              <div className="flex gap-2.5">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-black text-xs shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <span>{isSubmitting ? 'Sending Firebase OTP...' : 'Send 6-Digit OTP'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-3.5 border border-industrial-300 hover:bg-industrial-100 text-industrial-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={handleNavigateToSignUp}
                  className="text-brand-600 hover:underline text-[11px] font-semibold cursor-pointer"
                >
                  Don't have an account? Sign Up
                </button>
              </div>
            </form>
          ) : (
            /* OTP Verification Step */
            <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs">
              <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                isFirebaseConfigured
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-950'
              }`}>
                <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${
                  isFirebaseConfigured ? 'text-emerald-600' : 'text-amber-600'
                }`} />
                <div>
                  <div>
                    {isFirebaseConfigured ? (
                      <>OTP SMS sent to <strong className="font-mono">{profilePhone || identifier}</strong></>
                    ) : (
                      <>Dev Mode: Test Code Pre-filled for <strong className="font-mono">{profilePhone || identifier}</strong></>
                    )}
                  </div>
                  <div className={`text-[11px] mt-0.5 ${
                    isFirebaseConfigured ? 'text-emerald-700' : 'text-amber-800'
                  }`}>
                    {isFirebaseConfigured
                      ? 'Enter the 6-digit SMS code received on your phone to verify.'
                      : 'No real SMS sent because Firebase API keys are not configured in .env. Use test code 123456 and click "Verify OTP & Log In" below.'}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-industrial-800 flex items-center justify-between">
                  <span>Enter 6-Digit Verification Code</span>
                  <button
                    type="button"
                    onClick={() => setOtpStep('send')}
                    className="text-brand-600 hover:underline text-[11px] cursor-pointer"
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

              <div className="flex gap-2.5">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isSubmitting ? 'Verifying & Synchronizing...' : 'Verify OTP & Log In'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-3.5 border border-industrial-300 hover:bg-industrial-100 text-industrial-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Invisible Recaptcha Container for Firebase Phone Verification */}
          <div id="recaptcha-container"></div>

          {/* Security Badges */}
          <div className="pt-3 border-t border-industrial-100 flex items-center justify-between text-[10px] text-industrial-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              256-Bit SSL Encrypted
            </span>
            <span>Firebase & HinchMart Secure Sync</span>
          </div>
        </div>
      </div>
    </div>
  );
};
