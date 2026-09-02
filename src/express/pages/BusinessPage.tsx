import React, { useState } from 'react';
import { ShieldCheck, FileText, Users, CheckCircle2, TrendingUp } from 'lucide-react';

export const BusinessPage: React.FC = () => {
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [monthlyTrips, setMonthlyTrips] = useState('50-100');
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 pb-20">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-extrabold text-orange-600 uppercase tracking-wider">
          Enterprise Logistics
        </span>
        <h1 className="text-3xl sm:text-5xl font-black font-outfit text-slate-950">
          Scale Your Supply Chain With Dedicated Fleets
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
          Custom corporate freight contracts, API integrations for your ERP/WMS, and 30-day post-paid credit terms for manufacturing and construction enterprises.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Features */}
        <div className="lg:col-span-7 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">30-Day Credit Line</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Consolidated monthly billing with complete itemized GST tax invoices and trip logs.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">Dedicated Account Key</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                A dedicated logistics coordinator managing all driver allocations and site escalations.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">Priority Dispatch SLA</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Guaranteed vehicle placement in under 10 minutes at all major industrial parks.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">Logistics API & Webhooks</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Integrate live booking and telemetry directly into SAP, Oracle, Tally, or custom ERPs.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Contact Desk */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-6">
          <div className="space-y-1">
            <h3 className="text-xl font-black text-slate-950 font-outfit">Request Corporate Account</h3>
            <p className="text-xs text-slate-500">
              Speak with our regional B2B logistics consultant for tailored freight pricing.
            </p>
          </div>

          {submitted ? (
            <div className="p-8 text-center bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-base text-emerald-950">Inquiry Submitted!</h4>
              <p className="text-xs text-emerald-800">
                Our enterprise logistics specialist will contact <strong>{contactName}</strong> at <strong>{phone}</strong> within 1 business hour.
              </p>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(true);
              }}
              className="space-y-4"
            >
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Company / Enterprise Name</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Hyderabad Infra Construction Ltd"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:border-orange-500 outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Contact Person Name</label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. S. Vardhan"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:border-orange-500 outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Business Phone / Mobile</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9848012345"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:border-orange-500 outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Estimated Monthly Commercial Shipments</label>
                <select
                  value={monthlyTrips}
                  onChange={(e) => setMonthlyTrips(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:border-orange-500 outline-hidden"
                >
                  <option>10 - 50 Trips / month</option>
                  <option>50 - 100 Trips / month</option>
                  <option>100 - 500 Trips / month</option>
                  <option>500+ Trips / month (Dedicated Fleet)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-slate-950 hover:bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
              >
                Request Enterprise Quote
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
