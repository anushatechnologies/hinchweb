import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useAuthModalStore } from '../../store/useAuthModalStore';
import { useToastStore } from '../../store/useToastStore';
import {
  X,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Building2,
  Sparkles,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isOpen, closeAuthModal } = useAuthModalStore();
  const { sendOtp, verifyOtp, loginWithPassword } = useAuthStore();
  const { showToast } = useToastStore();

  const [authMode, setAuthMode] = useState<'otp' | 'password'>('otp');
  const [identifier, setIdentifier] = useState('buyer@demo.com');
  const [otpStep, setOtpStep] = useState<'send' | 'verify'>('send');
  const [otpCode, setOtpCode] = useState('');
  const [password, setPassword] = useState('');
  const [dispatchedOtpHint, setDispatchedOtpHint] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      showToast('error', 'Please enter your registered Email or Mobile Number', 'Required Field');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await sendOtp(identifier.trim());
      if (res.otpCode) {
        setDispatchedOtpHint(res.otpCode);
        setOtpCode(res.otpCode); // Pre-fill for instant demo testing
      }
      setOtpStep('verify');
      showToast('success', res.message || `OTP dispatched to ${identifier}`, 'OTP Sent');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to send OTP. Please try again.', 'OTP Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      showToast('error', 'Please enter the 6-digit verification code', 'Code Required');
      return;
    }

    setIsSubmitting(true);
    try {
      const loggedUser = await verifyOtp(identifier.trim(), otpCode.trim());
      showToast('success', `Welcome back, ${loggedUser.name}!`, 'Authentication Successful');
      closeAuthModal();
      setOtpStep('send');
      setDispatchedOtpHint(null);
    } catch (err: any) {
      showToast('error', err.message || 'Invalid or expired OTP code.', 'Verification Failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      showToast('error', 'Please enter your credentials', 'Incomplete Form');
      return;
    }

    setIsSubmitting(true);
    try {
      const loggedUser = await loginWithPassword(identifier.trim(), password.trim());
      showToast('success', `Authenticated as ${loggedUser.companyName}`, 'Login Successful');
      closeAuthModal();
    } catch (err: any) {
      showToast('error', err.message || 'Invalid credentials.', 'Login Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-industrial-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-industrial-200 relative animate-in zoom-in-95">
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 rounded-full text-industrial-400 hover:text-industrial-700 hover:bg-industrial-100 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="bg-gradient-to-r from-industrial-950 via-slate-900 to-industrial-950 p-6 text-white text-center relative overflow-hidden">
          <div className="flex justify-center mb-3">
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15 shadow-inner">
              <Building2 className="w-8 h-8 text-brand-400" />
            </div>
          </div>
          <h3 className="text-xl font-black tracking-tight text-white">
            HinchMart B2B Enterprise Access
          </h3>
          <p className="text-xs text-industrial-300 mt-1">
            Real-time GST-verified buyer & contractor procurement portal
          </p>

          {/* Mode Switcher */}
          <div className="flex justify-center gap-2 mt-4 bg-white/10 p-1 rounded-xl max-w-xs mx-auto text-xs font-bold">
            <button
              onClick={() => {
                setAuthMode('otp');
                setOtpStep('send');
              }}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                authMode === 'otp' ? 'bg-brand-600 text-white shadow-sm' : 'text-industrial-300 hover:text-white'
              }`}
            >
              Instant OTP Login
            </button>
            <button
              onClick={() => setAuthMode('password')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                authMode === 'password' ? 'bg-brand-600 text-white shadow-sm' : 'text-industrial-300 hover:text-white'
              }`}
            >
              Password
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {authMode === 'otp' ? (
            otpStep === 'send' ? (
              <form onSubmit={handleSendOtp} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-industrial-800 flex items-center justify-between">
                    <span>Email or 10-Digit Mobile</span>
                    <span className="text-[10px] text-industrial-400 font-normal">SMS / Email OTP</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. buyer@demo.com or 9876543210"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full pl-9 pr-4 py-3 bg-industrial-50 border border-industrial-300 rounded-xl text-xs text-industrial-900 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                    />
                    <Mail className="w-4 h-4 text-industrial-400 absolute left-3 top-3.5" />
                  </div>
                </div>

                <div className="p-3 bg-industrial-50 rounded-xl border border-industrial-200 text-[11px] text-industrial-600 space-y-1">
                  <div className="font-bold text-industrial-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                    <span>Quick Demo Buyer Credentials:</span>
                  </div>
                  <div>Email: <strong className="text-industrial-900 font-mono">buyer@demo.com</strong> (Apex Infra Projects)</div>
                  <div>Phone: <strong className="text-industrial-900 font-mono">9876543210</strong></div>
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
              <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div>OTP dispatched to <strong className="font-mono">{identifier}</strong></div>
                    {dispatchedOtpHint && (
                      <div className="text-[11px] text-emerald-700 font-mono mt-0.5">
                        Received Code: <strong>{dispatchedOtpHint}</strong>
                      </div>
                    )}
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
                      Change Identifier
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
                  <span>{isSubmitting ? 'Verifying...' : 'Verify OTP & Authorize Session'}</span>
                </button>
              </form>
            )
          ) : (
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
