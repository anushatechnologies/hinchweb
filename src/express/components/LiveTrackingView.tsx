import React, { useState, useEffect } from 'react';
import {
  Truck,
  MapPin,
  Phone,
  Star,
  Navigation,
  Share2,
  Copy,
  Check,
} from 'lucide-react';
import type { TripBooking, TripStatus } from '../types';

interface LiveTrackingViewProps {
  booking: TripBooking;
  onResetBooking?: () => void;
}

export const LiveTrackingView: React.FC<LiveTrackingViewProps> = ({ booking, onResetBooking }) => {
  const [copied, setCopied] = useState(false);
  const [vehicleProgress, setVehicleProgress] = useState(35);
  const [etaRemaining, setEtaRemaining] = useState(booking.fare.estimatedMinutes);

  useEffect(() => {
    const timer = setInterval(() => {
      setVehicleProgress((prev) => {
        if (prev >= 95) return 95;
        return prev + 1;
      });
      setEtaRemaining((prev) => Math.max(1, prev - 1));
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  const handleCopyWaybill = () => {
    navigator.clipboard.writeText(booking.waybillNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status: TripStatus) => {
    switch (status) {
      case 'searching_driver':
        return { label: 'Finding Driver', color: 'bg-amber-100 text-amber-800 border-amber-300' };
      case 'driver_assigned':
        return { label: 'Driver En Route to Pickup', color: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'arrived_at_pickup':
        return { label: 'Arrived at Pickup', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' };
      case 'in_transit':
        return { label: 'In Transit to Destination', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'completed':
        return { label: 'Delivered', color: 'bg-green-100 text-green-800 border-green-300' };
      default:
        return { label: 'Active Trip', color: 'bg-slate-100 text-slate-800 border-slate-300' };
    }
  };

  const statusBadge = getStatusBadge(booking.status);

  return (
    <div className="space-y-6 animate-in fade-in pb-16">
      {/* Top Waybill & Status Card */}
      <div className="bg-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-black uppercase tracking-wider">
                Live GPS Trip
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${statusBadge.color}`}>
                {statusBadge.label}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black font-outfit text-white">
              Trip #{booking.bookingId}
            </h2>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Waybill / Consignment No:</span>
              <span className="font-bold text-slate-200">{booking.waybillNumber}</span>
              <button
                onClick={handleCopyWaybill}
                className="p-1 hover:text-orange-400 text-slate-400 cursor-pointer"
                title="Copy Waybill Number"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 text-right flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500 text-white flex items-center justify-center font-black">
              <Navigation className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-300">Live ETA Remaining</div>
              <div className="text-2xl font-black text-white">~{etaRemaining} mins</div>
              <div className="text-[10px] text-emerald-400 font-semibold">{booking.fare.distanceKm} km total route</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Map & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Simulated GPS Map */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-card overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span>Live Telemetry Broadcast (Hyderabad Central Grid)</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">GPS: 17.4420� N, 78.3510� E</span>
            </div>

            {/* Visual Vector GPS Map Simulation */}
            <div className="relative h-80 sm:h-96 bg-slate-950 p-6 flex flex-col justify-between overflow-hidden">
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <path
                  d="M 60 70 Q 200 120 280 200 T 520 310"
                  stroke="#334155"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M 60 70 Q 200 120 280 200 T 520 310"
                  stroke="#f97316"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray="6 4"
                  className="animate-pulse"
                />
              </svg>

              <div className="relative z-10 flex items-center gap-2 self-start bg-slate-900/90 text-white px-3 py-1.5 rounded-xl border border-emerald-500/40 backdrop-blur-xs shadow-lg">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                <div>
                  <div className="text-[9px] font-black text-emerald-400 uppercase">Pickup Location</div>
                  <div className="text-xs font-bold truncate max-w-[200px]">{booking.pickup.address}</div>
                </div>
              </div>

              <div
                className="relative z-20 transition-all duration-1000 ease-out flex items-center gap-2"
                style={{
                  transform: `translate(${vehicleProgress * 4.2}px, -${vehicleProgress * 0.4}px)`,
                }}
              >
                <div className="relative">
                  <div className="absolute -inset-2 rounded-full bg-orange-500/30 animate-ping" />
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-2xl border-2 border-white">
                    <Truck className="w-6 h-6" />
                  </div>
                </div>
                <div className="bg-slate-900/95 border border-orange-500/40 text-white px-2.5 py-1 rounded-lg text-[10px] font-black shadow-xl whitespace-nowrap">
                  {booking.driver ? booking.driver.vehiclePlate : 'Vehicle Active'} � 38 km/h
                </div>
              </div>

              <div className="relative z-10 flex items-center gap-2 self-end bg-slate-900/90 text-white px-3 py-1.5 rounded-xl border border-red-500/40 backdrop-blur-xs shadow-lg">
                <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                <div>
                  <div className="text-[9px] font-black text-red-400 uppercase">Destination Drop</div>
                  <div className="text-xs font-bold truncate max-w-[200px]">{booking.drop.address}</div>
                </div>
              </div>
            </div>

            {booking.driver && (
              <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={booking.driver.photoUrl}
                    alt={booking.driver.name}
                    className="w-13 h-13 rounded-2xl object-cover border-2 border-orange-500 shadow-sm"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-slate-900">{booking.driver.name}</h4>
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-black">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        {booking.driver.rating}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-orange-600">
                      {booking.driver.vehiclePlate} ({booking.vehicle.shortName})
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Verified Commercial Driver � {booking.driver.totalTrips} Trips
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <a
                    href={`tel:${booking.driver.phone}`}
                    className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    <Phone className="w-3.5 h-3.5 text-orange-400" />
                    <span>Call Driver</span>
                  </a>
                  <button
                    onClick={() => alert(`Tracking link copied: https://express.hinchmart.com/track?wb=${booking.waybillNumber}`)}
                    className="px-3.5 py-2.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-center">
              <div className="text-[10px] font-extrabold uppercase text-slate-400">Pickup Security OTP</div>
              <div className="text-xl font-black text-orange-600 tracking-wider mt-1">{booking.pickupOtp}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Share with driver at loading</div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-center">
              <div className="text-[10px] font-extrabold uppercase text-slate-400">Delivery Confirmation OTP</div>
              <div className="text-xl font-black text-emerald-600 tracking-wider mt-1">{booking.deliveryOtp}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Share with receiver at drop</div>
            </div>
          </div>
        </div>

        {/* Right Column: Milestone Timeline & Consignment Specs */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card space-y-5">
            <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
              Consignment Journey Timeline
            </h3>

            <div className="space-y-4 relative pl-6 border-l-2 border-orange-500/30 ml-2">
              {booking.trackingTimeline.map((milestone, idx) => (
                <div key={idx} className="relative">
                  <div
                    className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${
                      milestone.completed ? 'bg-orange-500 text-white' : 'bg-slate-300'
                    }`}
                  />

                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-slate-900">{milestone.title}</h4>
                      <span className="text-[10px] font-bold text-slate-400">{milestone.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{milestone.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
              Consignment Specifications
            </h3>

            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">Material Category:</span>
                <span className="font-bold text-slate-900">{booking.goodsType}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">Estimated Weight:</span>
                <span className="font-bold text-slate-900">{booking.estimatedWeightKg} kg</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">Allocated Fleet:</span>
                <span className="font-bold text-slate-900">{booking.vehicle.name}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">Loading Helpers:</span>
                <span className="font-bold text-slate-900">{booking.helpersCount} Helper(s)</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">B2B GST Tax Invoice:</span>
                <span className="font-bold text-emerald-600">
                  {booking.hasGstInvoice ? `Included (${booking.gstin || 'ITC Eligible'})` : 'Exempt'}
                </span>
              </div>
              <div className="py-2.5 flex justify-between text-sm">
                <span className="font-extrabold text-slate-900">Total Paid Amount:</span>
                <span className="font-black text-slate-950">?{booking.fare.totalFare}</span>
              </div>
            </div>

            {onResetBooking && (
              <button
                onClick={onResetBooking}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer mt-2"
              >
                Book Another Consignment
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
