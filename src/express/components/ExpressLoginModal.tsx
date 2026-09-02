import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface ExpressLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: (user: { name: string; phone: string }) => void;
}

export const ExpressLoginModal: React.FC<ExpressLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [step, setStep] = useState<'phone' | 'otp' | 'success'>('phone');
  const [timer, setTimer] = useState(30);

  if (!isOpen) return null;

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.trim().length < 10) {
      alert('Please enter a valid 10-digit mobile number');
      return;
    }
    setStep('otp');
    setTimer(30);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const enteredOtp = otp.join('');
    if (enteredOtp.length !== 4) {
      alert('Please enter the complete 4-digit OTP');
      return;
    }

    setStep('success');
    setTimeout(() => {
      if (onLoginSuccess) {
        onLoginSuccess({
          name: 'Hyderabad Business User',
          phone: `+91 ${phone}`,
        });
      }
      onClose();
      setStep('phone');
      setPhone('');
      setOtp(['', '', '', '']);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl sm:rounded-[36px] max-w-4xl w-full overflow-hidden shadow-2xl border border-gray-100 relative grid grid-cols-1 md:grid-cols-12 min-h-[500px]">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-all cursor-pointer shadow-xs"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* LEFT COLUMN: LOGIN / SIGNUP FORM (Screenshot Layout) */}
        <div className="md:col-span-6 p-6 sm:p-10 flex flex-col justify-between bg-slate-50/50">
          <div className="space-y-6">
            {/* Top Phone & Package Graphic Illustration Card */}
            <div className="w-28 h-24 mx-auto sm:mx-0 relative flex items-center justify-center">
              <div className="w-20 h-20 bg-red-100/60 rounded-full absolute -top-1 left-2 -z-0" />
              <div className="relative z-10 flex items-center gap-1.5">
                {/* 3D Phone Icon Graphic */}
                <div className="w-12 h-20 bg-slate-900 rounded-xl p-1 border-2 border-white shadow-lg flex flex-col justify-between">
                  <div className="w-4 h-1 bg-slate-700 rounded-full mx-auto" />
                  <div className="bg-white rounded-lg p-1 space-y-1 text-center">
                    <div className="w-4 h-4 rounded-full bg-red-500 mx-auto" />
                    <div className="w-6 h-1 bg-red-200 rounded mx-auto" />
                  </div>
                  <div className="w-2 h-2 rounded-full bg-slate-700 mx-auto" />
                </div>
                {/* 3D Parcel Box & Shield Graphic */}
                <div className="flex flex-col items-center -ml-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 border border-amber-600 shadow-md flex items-center justify-center text-white text-xs font-black">
                    📦
                  </div>
                  <div className="w-6 h-6 rounded-full bg-red-600 border-2 border-white shadow-md flex items-center justify-center text-white text-[10px] -mt-2">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>

            {step === 'phone' && (
              <div className="space-y-2 text-left">
                <h3 className="text-2xl font-black text-gray-900 font-outfit">
                  Login/Signup
                </h3>
                <p className="text-xs text-gray-500 font-medium">
                  Please use your mobile number for quick access for your bookings
                </p>

                <form onSubmit={handlePhoneSubmit} className="space-y-4 pt-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700">
                      Phone No
                    </label>
                    <div className="flex items-center rounded-2xl border border-gray-300 bg-white px-4 py-3.5 focus-within:border-[#d9232d] focus-within:ring-2 focus-within:ring-red-100 transition-all shadow-2xs">
                      <span className="text-sm font-bold text-gray-800 tracking-wider">
                        +91&nbsp;&nbsp;-&nbsp;&nbsp;
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="0000000000"
                        className="w-full text-sm font-extrabold text-gray-900 bg-transparent outline-hidden tracking-widest placeholder:text-gray-300"
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={phone.length < 10}
                    className={`w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-wider transition-all cursor-pointer shadow-md ${
                      phone.length === 10
                        ? 'bg-[#d9232d] hover:bg-[#b91c1c] text-white shadow-red-600/30 active:scale-95'
                        : 'bg-red-200 text-white cursor-not-allowed'
                    }`}
                  >
                    Continue
                  </button>
                </form>
              </div>
            )}

            {step === 'otp' && (
              <div className="space-y-3 text-left animate-in fade-in">
                <h3 className="text-2xl font-black text-gray-900 font-outfit">
                  Enter 4-Digit OTP
                </h3>
                <p className="text-xs text-gray-500 font-medium">
                  Sent to <span className="font-bold text-gray-900">+91 {phone}</span>
                </p>

                <form onSubmit={handleOtpSubmit} className="space-y-4 pt-2">
                  <div className="flex items-center gap-3 justify-between max-w-[260px]">
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`otp-input-${idx}`}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        className="w-13 h-14 text-center text-xl font-black text-gray-900 bg-white border-2 border-gray-300 rounded-2xl focus:border-[#d9232d] focus:ring-2 focus:ring-red-100 outline-hidden shadow-2xs transition-all"
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                    <span>Didn't receive code?</span>
                    <button
                      type="button"
                      disabled={timer > 0}
                      onClick={() => setTimer(30)}
                      className="font-bold text-[#d9232d] hover:underline disabled:opacity-50 cursor-pointer"
                    >
                      {timer > 0 ? `Resend OTP in ${timer}s` : 'Resend OTP'}
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-[#d9232d] hover:bg-[#b91c1c] text-white rounded-2xl font-bold text-sm uppercase tracking-wider shadow-lg shadow-red-600/30 transition-all cursor-pointer active:scale-95"
                  >
                    Verify & Login
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep('phone')}
                    className="w-full text-center text-xs font-bold text-gray-500 hover:text-gray-800"
                  >
                    ← Change Phone Number
                  </button>
                </form>
              </div>
            )}

            {step === 'success' && (
              <div className="space-y-3 text-center py-8 animate-in zoom-in-95">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h4 className="text-xl font-black text-gray-900 font-outfit">
                  Welcome to Hinch Express!
                </h4>
                <p className="text-xs text-gray-500">
                  Logged in successfully as <strong>+91 {phone}</strong>
                </p>
              </div>
            )}
          </div>

          {/* Privacy & Terms Note (Screenshot Bottom) */}
          <div className="text-center pt-6 space-y-1 text-[11px] text-gray-400">
            <div>Your details are safe with us</div>
            <div>
              By continuing, you agree to our{' '}
              <a href="#terms" className="text-gray-600 font-bold hover:underline">
                Terms of Use
              </a>{' '}
              &&nbsp;
              <a href="#privacy" className="text-gray-600 font-bold hover:underline">
                Privacy Policy
              </a>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: HERO DELIVERY ILLUSTRATION & HEADLINE (Screenshot Right) */}
        <div className="md:col-span-6 bg-gradient-to-br from-red-50/50 via-white to-amber-50/30 p-6 sm:p-10 flex flex-col justify-between border-t md:border-t-0 md:border-l border-gray-100 text-left relative overflow-hidden">
          {/* Header Texts */}
          <div className="space-y-2 pr-8 z-10">
            <h3 className="text-2xl sm:text-3xl font-black text-gray-900 font-outfit leading-snug">
              Experience reliable and safe package delivery.
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 font-medium leading-relaxed">
              Reliable delivery for business and individual needs across Hyderabad.
            </p>
          </div>

          {/* 3D Courier Boy + Mini Truck + Delivery Bike Composite Artwork */}
          <div className="relative pt-6 pb-2 flex items-end justify-center z-10">
            {/* Background Mini Truck (Red & Yellow) */}
            <div className="relative w-full max-w-[340px]">
              {/* Composite SVG Illustration matching Screenshot 3D Scene */}
              <div className="relative flex items-end justify-center">
                {/* Red Mini Truck with Yellow Cargo Box */}
                <div className="w-56 h-36 bg-red-600 rounded-3xl relative shadow-2xl flex items-center justify-start overflow-hidden border-2 border-red-700">
                  {/* Yellow Cargo Container with hinchEXpress Logo */}
                  <div className="w-36 h-full bg-[#f59e0b] border-r-4 border-red-700 flex flex-col items-center justify-center p-2">
                    <div className="bg-slate-950 px-2 py-1 rounded-md text-white font-black text-[10px] tracking-tight">
                      hinch<span className="text-red-500 italic">EXpress</span>
                    </div>
                  </div>
                  {/* Truck Cabin & Window */}
                  <div className="flex-1 h-full flex flex-col justify-between p-2">
                    <div className="w-12 h-10 bg-sky-200 rounded-lg border border-sky-300 shadow-inner" />
                    <div className="w-6 h-6 rounded-full bg-slate-900 border-2 border-slate-700 self-end -mb-3" />
                  </div>
                </div>

                {/* Red Scooter / Bike in Foreground */}
                <div className="absolute right-0 bottom-0 w-32 h-28 flex items-end">
                  <img
                    src="https://cdn-icons-png.flaticon.com/512/3198/3198336.png"
                    alt="Delivery Scooter"
                    className="w-24 h-24 object-contain drop-shadow-xl -mr-4"
                  />
                  {/* Yellow Delivery Box on Scooter */}
                  <div className="w-10 h-10 rounded-xl bg-amber-400 border-2 border-amber-500 flex items-center justify-center text-white font-black text-xs shadow-lg -ml-6 -mb-2">
                    ✦
                  </div>
                </div>

                {/* 3D Delivery Courier Character */}
                <div className="absolute left-16 bottom-0 flex flex-col items-center">
                  <div className="w-14 h-14 rounded-full bg-amber-200 border-2 border-amber-300 shadow-md flex items-center justify-center text-2xl">
                    🧢
                  </div>
                  {/* Courier holding parcel box */}
                  <div className="w-16 h-12 bg-red-500 rounded-xl flex items-center justify-center text-white shadow-lg -mt-2">
                    <div className="w-8 h-8 bg-amber-600 rounded-md border border-amber-700 flex items-center justify-center text-[10px] font-black">
                      📦
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Accent Decor */}
          <div className="text-right text-[10px] text-gray-400 font-bold uppercase tracking-wider">
            Verified Intra-City Fleet • Hyderabad
          </div>
        </div>
      </div>
    </div>
  );
};
