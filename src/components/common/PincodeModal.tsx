import React, { useState } from 'react';
import { useLocationStore } from '../../store/useLocationStore';
import { useToastStore } from '../../store/useToastStore';
import { MapPin, X, Check, Building2, Truck } from 'lucide-react';

const POPULAR_LOCATIONS = [
  { pin: '500081', city: 'Hyderabad', state: 'Telangana', hub: 'Hitec Industrial Corridor' },
  { pin: '560100', city: 'Bengaluru', state: 'Karnataka', hub: 'Electronic City Mega Hub' },
  { pin: '400051', city: 'Mumbai', state: 'Maharashtra', hub: 'BKC / Bhiwandi Freight Depot' },
  { pin: '110020', city: 'New Delhi', state: 'Delhi', hub: 'Okhla Industrial Yard' },
  { pin: '600001', city: 'Chennai', state: 'Tamil Nadu', hub: 'Sriperumbudur Hub' },
  { pin: '380001', city: 'Ahmedabad', state: 'Gujarat', hub: 'Sanand Industrial Estate' },
];

export const PincodeModal: React.FC = () => {
  const { isOpenModal, closePincodeModal, pincode, city, state, setPincode } = useLocationStore();
  const { showToast } = useToastStore();
  const [inputPin, setInputPin] = useState(pincode);

  if (!isOpenModal) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPin.trim().length === 6) {
      setPincode(inputPin.trim());
      showToast('success', `Delivery destination updated to Pincode ${inputPin.trim()}`, 'Location Set');
    } else {
      showToast('error', 'Please enter a valid 6-digit Indian PIN code', 'Invalid PIN Code');
    }
  };

  const handleSelectLocation = (loc: typeof POPULAR_LOCATIONS[0]) => {
    setPincode(loc.pin, loc.city, loc.state);
    showToast('success', `Delivery set to ${loc.city}, ${loc.state} (${loc.pin})`, 'Location Updated');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-industrial-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-industrial-200 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-industrial-900 via-industrial-800 to-industrial-900 text-white p-6 relative">
          <button
            onClick={closePincodeModal}
            className="absolute top-4 right-4 text-industrial-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center border border-brand-500/30">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Select Delivery Destination</h3>
              <p className="text-xs text-industrial-300">
                Accurate freight calculation & verified stockyard transit times
              </p>
            </div>
          </div>
          <div className="mt-3 text-xs bg-white/10 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 text-industrial-200">
            <Truck className="w-3.5 h-3.5 text-brand-400" />
            Current Location: <span className="font-semibold text-white">{city}, {state} ({pincode})</span>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-industrial-600">
              Enter 6-Digit Delivery Site PIN Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                value={inputPin}
                onChange={(e) => setInputPin(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 500081"
                className="flex-1 px-4 py-3 bg-industrial-50 border border-industrial-300 rounded-xl text-base font-semibold text-industrial-900 placeholder:text-industrial-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                autoFocus
              />
              <button
                type="submit"
                className="px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl transition-all shadow-md shadow-brand-600/20 flex items-center gap-2"
              >
                Apply
              </button>
            </div>
          </form>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-industrial-500 mb-3">
              Major Industrial & Construction Corridors
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {POPULAR_LOCATIONS.map((loc) => {
                const isSelected = pincode === loc.pin;
                return (
                  <button
                    key={loc.pin}
                    type="button"
                    onClick={() => handleSelectLocation(loc)}
                    className={`flex items-start gap-2.5 p-3 text-left rounded-xl border transition-all ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/60 ring-1 ring-brand-500'
                        : 'border-industrial-200 hover:border-industrial-300 hover:bg-industrial-50/80'
                    }`}
                  >
                    <Building2
                      className={`w-4 h-4 mt-0.5 shrink-0 ${
                        isSelected ? 'text-brand-600' : 'text-industrial-400'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-industrial-900 truncate">
                          {loc.city}
                        </span>
                        <span className="text-[10px] font-mono bg-industrial-200/70 text-industrial-700 px-1.5 py-0.5 rounded">
                          {loc.pin}
                        </span>
                      </div>
                      <div className="text-[11px] text-industrial-500 truncate mt-0.5">
                        {loc.hub}
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
