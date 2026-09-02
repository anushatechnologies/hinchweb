import React, { useState } from 'react';
import { CheckCircle2, DollarSign, ShieldCheck } from 'lucide-react';
import { VEHICLE_FLEET } from '../api/logisticsApi';

export const DriverOnboardingPage: React.FC = () => {
  const [vehicleCategory, setVehicleCategory] = useState('tata_ace');
  const [dailyTrips, setDailyTrips] = useState(6);
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [city, setCity] = useState('Hyderabad');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const monthlyEarnings = Math.round(dailyTrips * 380 * 26);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 pb-20">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-extrabold text-orange-600 uppercase tracking-wider">
          Partner With Hinch Express
        </span>
        <h1 className="text-3xl sm:text-5xl font-black font-outfit text-slate-950">
          Attach Your Commercial Vehicle & Earn Daily
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
          Join 8,500+ proud driver partners. Daily bank settlements, guaranteed local orders from verified B2B construction sites, and zero idle waiting.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Col: Earnings Calculator & Perks */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold">
                <DollarSign className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black font-outfit">Driver Earnings Calculator</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">Select Your Vehicle Type:</label>
                <div className="grid grid-cols-3 gap-2">
                  {VEHICLE_FLEET.slice(1, 4).map((v) => (
                    <button
                      type="button"
                      key={v.id}
                      onClick={() => setVehicleCategory(v.id)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                        vehicleCategory === v.id
                          ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      {v.shortName.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
                  <span>Estimated Daily Completed Trips:</span>
                  <span className="text-orange-400 font-extrabold text-sm">{dailyTrips} Trips / Day</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="12"
                  value={dailyTrips}
                  onChange={(e) => setDailyTrips(Number(e.target.value))}
                  className="w-full accent-orange-500"
                />
              </div>

              <div className="p-4 rounded-2xl bg-white/10 border border-white/10 text-center">
                <div className="text-xs text-slate-400 font-bold uppercase">Estimated Monthly Take-Home Income</div>
                <div className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 mt-1">
                  ?{monthlyEarnings.toLocaleString('en-IN')} / mo*
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  *Based on average 26 active working days with trip incentives & toll reimbursement.
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <h4 className="font-bold text-slate-900">Daily Payouts</h4>
              <p className="text-[11px] text-slate-500">Direct bank deposit every evening by 7:00 PM.</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <ShieldCheck className="w-5 h-5 text-blue-500" />
              <h4 className="font-bold text-slate-900">Free Accidental Insurance</h4>
              <p className="text-[11px] text-slate-500">?5 Lakh medical and life coverage for driver & family.</p>
            </div>
          </div>
        </div>

        {/* Right Col: Onboarding Form */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-6">
          <div className="space-y-1">
            <h3 className="text-xl font-black text-slate-950 font-outfit">Join as a Driver Partner</h3>
            <p className="text-xs text-slate-500">
              Submit your basic details. Our local onboarding executive will activate your account within 2 hours.
            </p>
          </div>

          {submitted ? (
            <div className="p-8 text-center bg-emerald-50 rounded-2xl border border-emerald-200 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-black text-lg text-emerald-950">Application Received!</h4>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Thank you, <strong>{driverName}</strong>. Our onboarding team will call you at <strong>{driverPhone}</strong> to verify your driving license and attach your vehicle.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Full Name (As on Driving License)</label>
                <input
                  type="text"
                  required
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:border-orange-500 outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Mobile Phone Number (WhatsApp Enabled)</label>
                <input
                  type="tel"
                  required
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  placeholder="e.g. 9849012345"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:border-orange-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Operating City</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:border-orange-500 outline-hidden"
                  >
                    <option>Hyderabad</option>
                    <option>Secunderabad</option>
                    <option>Bengaluru</option>
                    <option>Chennai</option>
                    <option>Warangal</option>
                    <option>Vijayawada</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Vehicle Registration No.</label>
                  <input
                    type="text"
                    required
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    placeholder="e.g. TS 09 UB 4821"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold uppercase focus:border-orange-500 outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-md shadow-orange-500/20 transition-all cursor-pointer"
              >
                Submit Driver Application
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
