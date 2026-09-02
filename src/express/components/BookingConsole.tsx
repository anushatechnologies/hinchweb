import React, { useState, useMemo } from 'react';
import {
  Crosshair,
  ArrowUpDown,
  Sparkles,
} from 'lucide-react';
import { logisticsApi, VEHICLE_FLEET } from '../api/logisticsApi';
import type { TripBooking } from '../types';

interface BookingConsoleProps {
  onBookingCreated: (booking: TripBooking) => void;
}

const HYDERABAD_ZONES = [
  'HITEC City Cyber Towers',
  'Gachibowli Financial District',
  'Balanagar Industrial Area',
  'Jeedimetla Phase 2',
  'Secunderabad Station',
  'Uppal Industrial Area',
  'Shamshabad Cargo Hub',
  'Cherlapally Industrial Estate',
  'Kukatpally Housing Board',
  'Madhapur Image Gardens',
];

export const BookingConsole: React.FC<BookingConsoleProps> = ({ onBookingCreated }) => {
  const [selectedTab, setSelectedTab] = useState<'2w' | '3w' | 'tata_ace'>('2w');
  const [pickupAddress, setPickupAddress] = useState('HITEC City Cyber Towers, Hyderabad');
  const [dropAddress, setDropAddress] = useState('Jeedimetla Industrial Area, Hyderabad');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Selected vehicle object
  const selectedVehicle = useMemo(() => {
    return logisticsApi.getVehicleById(selectedTab) || VEHICLE_FLEET[0];
  }, [selectedTab]);

  // Distance & fare estimation
  const { distanceKm, estimatedMinutes } = useMemo(() => {
    return logisticsApi.calculateDistance(pickupAddress, dropAddress);
  }, [pickupAddress, dropAddress]);

  const fare = useMemo(() => {
    return logisticsApi.calculateFare(selectedVehicle, distanceKm, 0, true);
  }, [selectedVehicle, distanceKm]);

  const handleSwapAddresses = () => {
    const temp = pickupAddress;
    setPickupAddress(dropAddress);
    setDropAddress(temp);
  };

  const handleUseCurrentLocation = () => {
    setPickupAddress('Gachibowli ORR Junction, Hyderabad (Current GPS Location)');
  };

  const handleCalculatePrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupAddress.trim() || !dropAddress.trim()) {
      alert('Please enter both pickup and drop locations in Hyderabad');
      return;
    }
    setShowDetailsModal(true);
  };

  const handleConfirmAndDispatch = async () => {
    setIsSubmitting(true);
    try {
      const booking = await logisticsApi.createBooking({
        pickup: {
          address: pickupAddress,
          city: 'Hyderabad',
          contactName: 'Site Coordinator',
          contactPhone: '9849012345',
        },
        drop: {
          address: dropAddress,
          city: 'Hyderabad',
          contactName: 'Store Incharge',
          contactPhone: '9876543210',
        },
        vehicleId: selectedVehicle.id,
        goodsType: selectedTab === '2w' ? 'Documents & Parcels' : 'Commercial & Construction Cargo',
        estimatedWeightKg: selectedTab === '2w' ? 12 : 380,
        helpersCount: selectedTab === '2w' ? 0 : 1,
        hasGstInvoice: true,
        gstin: '36AAACH7821P1Z5',
        paymentMethod: 'online',
      });

      setShowDetailsModal(false);
      onBookingCreated(booking);
    } catch (err) {
      console.error('Booking failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4">
      {/* Main Elevated White Booking Card (MogliExpress Reference Layout) */}
      <div className="bg-white rounded-3xl sm:rounded-[32px] border border-gray-200/80 shadow-xl shadow-slate-200/50 p-6 sm:p-8 space-y-6">
        {/* Top Vehicle Tabs */}
        <div className="flex items-center justify-center sm:justify-start gap-4 sm:gap-10 border-b border-gray-100 pb-4 overflow-x-auto no-scrollbar">
          {/* 2 Wheeler Tab */}
          <button
            type="button"
            onClick={() => setSelectedTab('2w')}
            className="flex items-center gap-3 pb-2 relative transition-all cursor-pointer group shrink-0"
          >
            <div className="w-12 h-12 flex items-center justify-center">
              <img
                src="https://cdn-icons-png.flaticon.com/512/3198/3198336.png"
                alt="2 Wheeler"
                className="w-10 h-10 object-contain group-hover:scale-105 transition-transform"
              />
            </div>
            <div className="text-left">
              <div className={`text-sm font-extrabold transition-colors ${selectedTab === '2w' ? 'text-[#d9232d]' : 'text-gray-800'}`}>
                2 Wheeler
              </div>
              <div className="text-[11px] text-gray-500 font-semibold">Upto 20 kg</div>
            </div>
            {selectedTab === '2w' && (
              <div className="absolute -bottom-4 left-0 right-0 h-[3px] bg-[#d9232d] rounded-full shadow-xs" />
            )}
          </button>

          {/* 3 Wheeler Tab */}
          <button
            type="button"
            onClick={() => setSelectedTab('3w')}
            className="flex items-center gap-3 pb-2 relative transition-all cursor-pointer group shrink-0"
          >
            <div className="w-12 h-12 flex items-center justify-center">
              <img
                src="https://cdn-icons-png.flaticon.com/512/3774/3774278.png"
                alt="3 Wheeler"
                className="w-10 h-10 object-contain group-hover:scale-105 transition-transform"
              />
            </div>
            <div className="text-left">
              <div className={`text-sm font-extrabold transition-colors ${selectedTab === '3w' ? 'text-[#d9232d]' : 'text-gray-800'}`}>
                3 Wheeler
              </div>
              <div className="text-[11px] text-gray-500 font-semibold">Upto 500 kg</div>
            </div>
            {selectedTab === '3w' && (
              <div className="absolute -bottom-4 left-0 right-0 h-[3px] bg-[#d9232d] rounded-full shadow-xs" />
            )}
          </button>

          {/* 4 Wheeler / Tata Ace Tab */}
          <button
            type="button"
            onClick={() => setSelectedTab('tata_ace')}
            className="flex items-center gap-3 pb-2 relative transition-all cursor-pointer group shrink-0"
          >
            <div className="w-12 h-12 flex items-center justify-center">
              <img
                src="https://cdn-icons-png.flaticon.com/512/2830/2830305.png"
                alt="4 Wheeler"
                className="w-10 h-10 object-contain group-hover:scale-105 transition-transform"
              />
            </div>
            <div className="text-left">
              <div className={`text-sm font-extrabold transition-colors ${selectedTab === 'tata_ace' ? 'text-[#d9232d]' : 'text-gray-800'}`}>
                4 Wheeler
              </div>
              <div className="text-[11px] text-gray-500 font-semibold">Upto 750 kg</div>
            </div>
            {selectedTab === 'tata_ace' && (
              <div className="absolute -bottom-4 left-0 right-0 h-[3px] bg-[#d9232d] rounded-full shadow-xs" />
            )}
          </button>
        </div>

        {/* Pickup & Drop Inline Bar (Screenshot 1 Format) */}
        <form onSubmit={handleCalculatePrice} className="space-y-4">
          <div className="flex flex-col lg:flex-row items-center border border-gray-300 rounded-2xl lg:rounded-full bg-white p-2 sm:p-2.5 shadow-xs focus-within:border-[#d9232d] transition-all gap-2">
            {/* Pickup Location Field */}
            <div className="flex-1 w-full flex items-center px-3 py-1.5 min-w-0">
              <div className="w-full">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Pickup Location
                </label>
                <input
                  type="text"
                  required
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder="Enter Address in Hyderabad..."
                  className="w-full text-xs sm:text-sm font-extrabold text-gray-900 bg-transparent outline-hidden truncate"
                />
              </div>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="p-2 text-[#d9232d] hover:bg-red-50 rounded-full transition-colors cursor-pointer shrink-0"
                title="Use Current GPS Location"
              >
                <Crosshair className="w-5 h-5" />
              </button>
            </div>

            {/* Swap Divider Button */}
            <button
              type="button"
              onClick={handleSwapAddresses}
              className="w-8 h-8 rounded-full border border-gray-200 bg-gray-50 hover:bg-red-50 hover:border-[#d9232d] text-gray-600 hover:text-[#d9232d] flex items-center justify-center transition-all cursor-pointer shrink-0"
              title="Swap Locations"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>

            {/* Drop Location Field */}
            <div className="flex-1 w-full flex items-center px-3 py-1.5 min-w-0 border-t lg:border-t-0 lg:border-l border-gray-200">
              <div className="w-full">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Drop Location
                </label>
                <input
                  type="text"
                  required
                  value={dropAddress}
                  onChange={(e) => setDropAddress(e.target.value)}
                  placeholder="Enter Address in Hyderabad..."
                  className="w-full text-xs sm:text-sm font-extrabold text-gray-900 bg-transparent outline-hidden truncate"
                />
              </div>
            </div>

            {/* Calculate Price Red Pill Button (Screenshot 1) */}
            <button
              type="submit"
              className="w-full lg:w-auto px-8 py-3.5 bg-[#d9232d] hover:bg-[#b91c1c] text-white rounded-xl lg:rounded-full font-bold text-sm tracking-wide shadow-md shadow-red-600/30 shrink-0 transition-all active:scale-95 cursor-pointer"
            >
              Calculate Price
            </button>
          </div>

          {/* Micro-copy footer below inputs (Screenshot 1) */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500 font-semibold pt-1">
            <span>No Hidden Charges</span>
            <span>�</span>
            <span>Insured Delivery</span>
            <span>�</span>
            <span>1000+ Delivery Partners in Hyderabad</span>
          </div>
        </form>
      </div>

      {/* Quick Hyderabad Zone Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
        <span className="font-bold text-gray-500">Popular Hyderabad Hubs:</span>
        {HYDERABAD_ZONES.slice(0, 6).map((zone) => (
          <button
            type="button"
            key={zone}
            onClick={() => setDropAddress(`${zone}, Hyderabad`)}
            className="px-2.5 py-1 rounded-full bg-white hover:bg-red-50 text-gray-700 hover:text-[#d9232d] border border-gray-200 hover:border-red-300 font-medium transition-all shadow-2xs cursor-pointer"
          >
            {zone}
          </button>
        ))}
      </div>

      {/* Instant Fare & Confirmation Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-black text-lg text-gray-900 font-outfit">
                  Hyderabad Delivery Estimation
                </h3>
                <div className="text-xs text-gray-500 font-semibold">
                  {selectedVehicle.name} � {distanceKm} km route (~{estimatedMinutes} mins)
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-black font-bold text-sm cursor-pointer"
              >
                ?
              </button>
            </div>

            {/* Price & Specs Breakdown */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Base Fare (First {selectedVehicle.baseKm} km):</span>
                <span className="font-bold text-gray-900">?{fare.baseFare}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Distance Fare ({distanceKm} km @ ?{selectedVehicle.perKmRate}/km):</span>
                <span className="font-bold text-gray-900">?{fare.distanceFare}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">18% GST (ITC Eligible):</span>
                <span className="font-bold text-emerald-600">?{fare.gstAmount}</span>
              </div>
              <div className="pt-2 border-t border-gray-200 flex justify-between text-base font-black text-gray-950">
                <span>Estimated Net Total:</span>
                <span className="text-[#d9232d]">?{fare.totalFare}</span>
              </div>
            </div>

            {/* Pickup & Drop Confirmation */}
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500 mt-1 shrink-0" />
                <div>
                  <span className="font-bold text-gray-900">Pickup: </span>
                  <span className="text-gray-600">{pickupAddress}</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 mt-1 shrink-0" />
                <div>
                  <span className="font-bold text-gray-900">Drop: </span>
                  <span className="text-gray-600">{dropAddress}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleConfirmAndDispatch}
              disabled={isSubmitting}
              className="w-full py-4 bg-[#d9232d] hover:bg-[#b91c1c] text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Dispatching...' : `Confirm & Dispatch ${selectedVehicle.shortName}`}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
