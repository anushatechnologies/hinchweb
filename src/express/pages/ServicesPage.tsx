import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, ShieldCheck, FileText, Zap } from 'lucide-react';
import { VEHICLE_FLEET } from '../api/logisticsApi';

export const ServicesPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 pb-20">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-extrabold text-orange-600 uppercase tracking-wider">
          Logistics Solutions
        </span>
        <h1 className="text-3xl sm:text-5xl font-black font-outfit text-slate-950">
          Commercial Freight Services & Rate Card
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
          Transparent per-kilometer rate cards, verified commercial drivers, and zero surge pricing for intra-city and intercity industrial carriage.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-card overflow-hidden">
        <div className="p-6 bg-slate-950 text-white flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-lg font-black font-outfit">Standard Vehicle Rate Card</h2>
            <p className="text-xs text-slate-400">Fixed base fares and transparent per-km mileage rates</p>
          </div>
          <Link
            to="/#booking-console"
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Instant Booking
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-4 sm:px-6">Vehicle Type</th>
                <th className="p-4 sm:px-6">Payload Capacity</th>
                <th className="p-4 sm:px-6">Cargo Dimension</th>
                <th className="p-4 sm:px-6">Base Fare (Incl. Km)</th>
                <th className="p-4 sm:px-6">Rate / Extra Km</th>
                <th className="p-4 sm:px-6">Helper Rate</th>
                <th className="p-4 sm:px-6">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {VEHICLE_FLEET.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4 sm:px-6 flex items-center gap-3">
                    <img src={v.imageUrl} alt={v.name} className="w-10 h-10 object-contain" />
                    <div>
                      <div className="font-extrabold text-sm text-slate-900">{v.name}</div>
                      <div className="text-[11px] text-slate-400">{v.tagline}</div>
                    </div>
                  </td>
                  <td className="p-4 sm:px-6 font-bold text-slate-800">{v.capacityFormatted}</td>
                  <td className="p-4 sm:px-6 text-slate-600">{v.dimension}</td>
                  <td className="p-4 sm:px-6 font-bold text-slate-900">?{v.baseFare} (First {v.baseKm} km)</td>
                  <td className="p-4 sm:px-6 font-bold text-orange-600">?{v.perKmRate} / km</td>
                  <td className="p-4 sm:px-6 text-slate-700">{v.helperRate === 0 ? 'N/A' : `?${v.helperRate} / helper`}</td>
                  <td className="p-4 sm:px-6">
                    <Link
                      to="/#booking-console"
                      className="px-3 py-1.5 bg-slate-900 hover:bg-orange-500 text-white rounded-lg font-bold text-[11px] transition-colors inline-block"
                    >
                      Book
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="font-black text-base text-slate-900">Intra-City On Demand</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Move construction raw materials, steel bars, and machinery anywhere within city limits in under 60 minutes.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
            <Truck className="w-5 h-5" />
          </div>
          <h3 className="font-black text-base text-slate-900">Intercity Freight</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Direct dedicated truck transport connecting industrial zones across Telangana, Andhra Pradesh, and Karnataka.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-black text-base text-slate-900">Enterprise Fleet</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Monthly dedicated trucks, recurring route schedules, and customized billing for distributors and factories.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="font-black text-base text-slate-900">Site-to-Site Relocation</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Specialized shifting of scaffolding, site offices, heavy generator sets, and industrial inventory.
          </p>
        </div>
      </div>
    </div>
  );
};
