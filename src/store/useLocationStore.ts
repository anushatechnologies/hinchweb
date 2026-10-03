import { create } from 'zustand';
import { locationApi } from '../api/locationApi';

interface LocationState {
  pincode: string;
  city: string;
  state: string;
  isInterState: boolean;
  serviceable: boolean;
  estimatedDays: number;
  isExpressAvailable: boolean;
  isOpenModal: boolean;
  openPincodeModal: () => void;
  closePincodeModal: () => void;
  setPincode: (pincode: string, city?: string, state?: string) => Promise<void> | void;
}

const PINCODE_MAP: Record<string, { city: string; state: string; isInterState: boolean }> = {
  '500081': { city: 'Hyderabad', state: 'Telangana', isInterState: false },
  '500034': { city: 'Hyderabad', state: 'Telangana', isInterState: false },
  '560100': { city: 'Bengaluru', state: 'Karnataka', isInterState: true },
  '560001': { city: 'Bengaluru', state: 'Karnataka', isInterState: true },
  '400001': { city: 'Mumbai', state: 'Maharashtra', isInterState: true },
  '400051': { city: 'Mumbai', state: 'Maharashtra', isInterState: true },
  '110001': { city: 'New Delhi', state: 'Delhi', isInterState: true },
  '110020': { city: 'New Delhi', state: 'Delhi', isInterState: true },
  '600001': { city: 'Chennai', state: 'Tamil Nadu', isInterState: true },
  '700001': { city: 'Kolkata', state: 'West Bengal', isInterState: true },
  '380001': { city: 'Ahmedabad', state: 'Gujarat', isInterState: true },
};

export const useLocationStore = create<LocationState>((set) => ({
  pincode: '500081',
  city: 'Hyderabad',
  state: 'Telangana',
  isInterState: false,
  serviceable: true,
  estimatedDays: 2,
  isExpressAvailable: true,
  isOpenModal: false,

  openPincodeModal: () => set({ isOpenModal: true }),
  closePincodeModal: () => set({ isOpenModal: false }),

  setPincode: async (pincode: string, customCity?: string, customState?: string) => {
    const cleanPin = pincode.trim().slice(0, 6);
    const lookup = PINCODE_MAP[cleanPin];

    // Optimistically set location
    set({
      pincode: cleanPin,
      city: lookup?.city || customCity || 'Delivery Destination',
      state: lookup?.state || customState || 'Telangana',
      isInterState: lookup ? lookup.isInterState : false,
      isOpenModal: false,
    });

    // Check live serviceability from backend API
    try {
      const res = await locationApi.checkServiceability(cleanPin);
      if (res && res.city) {
        set({
          pincode: cleanPin,
          city: res.city,
          state: res.state,
          serviceable: res.serviceable,
          estimatedDays: res.estimatedDays,
          isExpressAvailable: res.isExpressAvailable,
          isInterState: res.state !== 'Telangana',
        });
      }
    } catch {
      // Keep optimistic values if network error
    }
  },
}));

