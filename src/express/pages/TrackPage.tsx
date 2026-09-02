import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, AlertCircle } from 'lucide-react';
import { logisticsApi } from '../api/logisticsApi';
import { LiveTrackingView } from '../components/LiveTrackingView';
import type { TripBooking } from '../types';

export const TrackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('wb') || 'HEX-894210');
  const [searchedBooking, setSearchedBooking] = useState<TripBooking | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = (trackingId: string) => {
    if (!trackingId.trim()) return;
    setIsLoading(true);
    setNotFound(false);

    setTimeout(() => {
      const booking = logisticsApi.getBooking(trackingId.trim());
      if (booking) {
        setSearchedBooking(booking);
      } else {
        setNotFound(true);
      }
      setIsLoading(false);
    }, 400);
  };

  useEffect(() => {
    if (query) {
      handleSearch(query);
    }
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 pb-20">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold uppercase tracking-wider">
          <Search className="w-3.5 h-3.5" />
          <span>Real-Time Waybill Telemetry</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black font-outfit text-slate-950">
          Track Your Freight & Consignment
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Enter your 9-digit Booking ID (e.g. HEX-894210) or Waybill Number to view live driver GPS coordinates and trip milestones.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(query);
          }}
          className="flex flex-col sm:flex-row items-center gap-3 pt-2"
        >
          <div className="relative w-full">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter Booking ID (e.g. HEX-894210) or Waybill..."
              className="w-full pl-4 pr-10 py-3.5 bg-white border-2 border-slate-300 focus:border-orange-500 rounded-2xl text-sm font-bold text-slate-900 shadow-md outline-hidden uppercase"
            />
            <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto px-8 py-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-500/25 shrink-0 transition-all cursor-pointer"
          >
            {isLoading ? 'Tracking...' : 'Track Now'}
          </button>
        </form>

        <div className="flex items-center justify-center gap-2 pt-1 text-xs text-slate-400">
          <span>Try sample tracking IDs:</span>
          <button
            type="button"
            onClick={() => {
              setQuery('HEX-894210');
              handleSearch('HEX-894210');
            }}
            className="text-orange-600 font-bold hover:underline"
          >
            HEX-894210
          </button>
          <span>�</span>
          <button
            type="button"
            onClick={() => {
              setQuery('HEX-551029');
              handleSearch('HEX-551029');
            }}
            className="text-orange-600 font-bold hover:underline"
          >
            HEX-551029
          </button>
        </div>
      </div>

      {searchedBooking && <LiveTrackingView booking={searchedBooking} />}

      {notFound && (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-card max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Consignment Not Found</h3>
          <p className="text-xs text-slate-500">
            We couldn't locate any active or historical shipment matching <span className="font-bold text-slate-800">"{query}"</span>. Please check the ID or contact dispatch support.
          </p>
        </div>
      )}
    </div>
  );
};
