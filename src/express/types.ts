export interface VehicleType {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  category: '2w' | '3w' | 'mini_truck' | 'pickup' | 'heavy_truck';
  capacityKg: number;
  capacityFormatted: string;
  dimension: string;
  iconType: string;
  imageUrl: string;
  baseFare: number;
  baseKm: number;
  perKmRate: number;
  perMinRate: number;
  helperRate: number;
  etaMinutes: number;
  idealFor: string[];
  popularBadge?: string;
}

export interface LocationPoint {
  address: string;
  city?: string;
  landmark?: string;
  lat?: number;
  lng?: number;
  contactName?: string;
  contactPhone?: string;
}

export interface FareBreakdown {
  vehicleId: string;
  distanceKm: number;
  estimatedMinutes: number;
  baseFare: number;
  distanceFare: number;
  helperFee: number;
  tollFee: number;
  gstAmount: number;
  discountAmount: number;
  totalFare: number;
}

export interface DriverDetails {
  id: string;
  name: string;
  photoUrl: string;
  phone: string;
  rating: number;
  totalTrips: number;
  vehicleModel: string;
  vehiclePlate: string;
  currentLat: number;
  currentLng: number;
  etaToPickupMinutes: number;
}

export type TripStatus =
  | 'searching_driver'
  | 'driver_assigned'
  | 'arrived_at_pickup'
  | 'goods_loaded'
  | 'in_transit'
  | 'completed'
  | 'cancelled';

export interface TripBooking {
  bookingId: string;
  waybillNumber: string;
  createdAt: string;
  status: TripStatus;
  pickup: LocationPoint;
  drop: LocationPoint;
  stops?: LocationPoint[];
  vehicle: VehicleType;
  fare: FareBreakdown;
  goodsType: string;
  estimatedWeightKg: number;
  helpersCount: number;
  hasGstInvoice: boolean;
  gstin?: string;
  paymentMethod: 'online' | 'cash_on_pickup' | 'corporate_credit';
  pickupOtp: string;
  deliveryOtp: string;
  driver?: DriverDetails;
  ePodUrl?: string;
  trackingTimeline: {
    status: TripStatus;
    title: string;
    description: string;
    timestamp: string;
    completed: boolean;
  }[];
}
