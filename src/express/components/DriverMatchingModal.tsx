import React, { useEffect, useState } from 'react';
import { Truck, CheckCircle2, Phone, Star, X, ArrowRight } from 'lucide-react';
import { logisticsApi } from '../api/logisticsApi';
import type { TripBooking } from '../types';

interface DriverMatchingModalProps {
  booking: TripBooking;
  onDriverAssigned: (updatedBooking: TripBooking) => void;
  onClose: () => void;
}

export const DriverMatchingModal: React.FC<DriverMatchingModalProps> = ({
  booking,
  onDriverAssigned,
  onClose,
}) => {
  const [stage, setStage] = useState<'searching' | 'assigned'>('searching');
  const [currentBooking, setCurrentBooking] = useState<TripBooking>(booking);
  const [searchPulse, setSearchPulse] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSearchPulse((p) => (p + 1) % 4);
    }, 600);

    const timer = setTimeout(async () => {
      try {
        const updated = await logisticsApi.assignDriver(booking.bookingId);
        setCurrentBooking(updated);
        setStage('assigned');
        onDriverAssigned(updated);
      } catch (err) {
        console.error('Driver assignment failed:', err);
      }
    }, 2500);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [booking.bookingId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden text-center">
        {/* Modal Header */}
        <div className="bg-slate-950 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white">
              <Truck className="w-4 h-4" />
            </div>
            <div className="text-left">
              <h3 className="font-extrabold text-sm text-white font-outfit">HINCH EXPRESS DISPATCH</h3>
              <div className="text-[10px] text-slate-400 font-semibold">Booking ID: {booking.bookingId}</div>
            </div>
          </div>
          {stage === 'assigned' && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Modal Content */}
        <div className="p-6 sm:p-8 space-y-6">
          {stage === 'searching' ? (
            <div className="space-y-6 py-4">
              {/* Radar Pulse Animation */}
              <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-orange-500/20 animate-ping" />
                <div className="absolute inset-3 rounded-full border-2 border-orange-500/40 animate-pulse" />
                <div className="absolute inset-7 rounded-full bg-orange-500/10 border border-orange-500/50" />
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-xl shadow-orange-500/40 relative z-10">
                  <Truck className="w-8 h-8 animate-bounce" />
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-lg font-black text-slate-900">
                  Auto-Matching Nearest {booking.vehicle.shortName}...
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Broadcasting request to verified drivers within 3 km of {booking.pickup.address.split(',')[0]}
                </p>
              </div>

              {/* Status Stepper Ticker */}
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                <span>
                  {searchPulse === 0 && 'Connecting GPS Telemetry...'}
                  {searchPulse === 1 && 'Checking Driver Ratings & KYC...'}
                  {searchPulse === 2 && 'Calculating Fast Route...'}
                  {searchPulse === 3 && 'Assigning Optimal Driver Partner...'}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h4 className="text-xl font-black text-slate-950">Driver Partner Assigned!</h4>
                <p className="text-xs text-slate-500">
                  Your vehicle is confirmed and heading to your pickup location.
                </p>
              </div>

              {currentBooking.driver && (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left space-y-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={currentBooking.driver.photoUrl}
                      alt={currentBooking.driver.name}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-orange-500 shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h5 className="font-black text-base text-slate-900 truncate">
                          {currentBooking.driver.name}
                        </h5>
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-black">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          {currentBooking.driver.rating}
                        </span>
                      </div>
                      <div className="text-xs font-extrabold text-orange-600">
                        {currentBooking.driver.vehiclePlate} � {currentBooking.driver.vehicleModel}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {currentBooking.driver.totalTrips}+ successful trips completed
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Pickup Security OTP</div>
                      <div className="text-lg font-black text-orange-600 tracking-widest">
                        {currentBooking.pickupOtp}
                      </div>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Arriving In</div>
                      <div className="text-lg font-black text-emerald-600">
                        ~{currentBooking.driver.etaToPickupMinutes} mins
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                {currentBooking.driver && (
                  <a
                    href={`tel:${currentBooking.driver.phone}`}
                    className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Phone className="w-4 h-4 text-orange-400" />
                    <span>Call Driver</span>
                  </a>
                )}
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Open Live Map</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
