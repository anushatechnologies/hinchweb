import type { VehicleType, LocationPoint, FareBreakdown, TripBooking } from '../types';

export const VEHICLE_FLEET: VehicleType[] = [
  {
    id: '2w',
    name: '2 Wheeler Bike',
    shortName: '2 Wheeler',
    tagline: 'Instant courier & documents',
    category: '2w',
    capacityKg: 20,
    capacityFormatted: 'Up to 20 kg',
    dimension: '40 x 40 x 40 cm',
    iconType: 'bike',
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/3198/3198336.png',
    baseFare: 40,
    baseKm: 2,
    perKmRate: 8,
    perMinRate: 1,
    helperRate: 0,
    etaMinutes: 4,
    idealFor: ['Business Documents', 'Hardware Samples', 'Small Electrical Spares', 'Medicines & Lab Parcels'],
  },
  {
    id: '3w',
    name: '3 Wheeler Auto',
    shortName: '3 Wheeler',
    tagline: 'Medium city freight',
    category: '3w',
    capacityKg: 500,
    capacityFormatted: 'Up to 500 kg',
    dimension: '5.5 x 4 x 4.5 ft',
    iconType: 'auto',
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/3774/3774278.png',
    baseFare: 140,
    baseKm: 3,
    perKmRate: 14,
    perMinRate: 2,
    helperRate: 120,
    etaMinutes: 6,
    idealFor: ['Paint Buckets', 'Sanitaryware Fixtures', 'Lighting Cartons', 'Tools & Machinery'],
  },
  {
    id: 'tata_ace',
    name: 'Tata Ace / Mini Truck',
    shortName: 'Tata Ace (Chota Hathi)',
    tagline: 'India�s #1 construction & retail carrier',
    category: 'mini_truck',
    capacityKg: 750,
    capacityFormatted: 'Up to 750 kg',
    dimension: '7 x 4.5 x 5 ft',
    iconType: 'truck_small',
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/2830/2830305.png',
    baseFare: 220,
    baseKm: 4,
    perKmRate: 18,
    perMinRate: 2.5,
    helperRate: 150,
    etaMinutes: 8,
    popularBadge: 'MOST POPULAR',
    idealFor: ['Cement Bags', 'Tile Cartons', 'Electrical Cables', 'Plywood Sheets', 'Steel Pipes'],
  },
  {
    id: 'pickup_8ft',
    name: 'Pickup / 8ft Truck',
    shortName: 'Pickup 8ft (1 Ton)',
    tagline: 'Heavy payload for industrial materials',
    category: 'pickup',
    capacityKg: 1000,
    capacityFormatted: 'Up to 1.2 Ton',
    dimension: '8.5 x 5 x 5.5 ft',
    iconType: 'pickup',
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/1048/1048314.png',
    baseFare: 350,
    baseKm: 5,
    perKmRate: 24,
    perMinRate: 3,
    helperRate: 200,
    etaMinutes: 10,
    idealFor: ['Structural Steel Rebars', 'Scaffolding Frames', 'Heavy Industrial Pumps', 'Bulk Flooring Tiles'],
  },
  {
    id: 'truck_14ft',
    name: '14 ft Canter Truck',
    shortName: '14 ft Truck (2.5 Ton)',
    tagline: 'High volume intercity & bulk warehouse loads',
    category: 'heavy_truck',
    capacityKg: 2500,
    capacityFormatted: 'Up to 2.5 Tons',
    dimension: '14 x 6 x 6.5 ft',
    iconType: 'heavy_truck',
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/2769/2769269.png',
    baseFare: 650,
    baseKm: 6,
    perKmRate: 32,
    perMinRate: 4,
    helperRate: 300,
    etaMinutes: 15,
    idealFor: ['Factory Dispatch', 'Bulk Structural Steel', 'Palletized Consignments', 'Office Shifting'],
  },
];

const POPULAR_LOCATIONS: Record<string, { lat: number; lng: number }> = {
  gachibowli: { lat: 17.4401, lng: 78.3489 },
  'hitec city': { lat: 17.4435, lng: 78.3772 },
  secunderabad: { lat: 17.4399, lng: 78.4983 },
  'jeedimetla industrial area': { lat: 17.5186, lng: 78.4688 },
  uppal: { lat: 17.4018, lng: 78.5602 },
  balanagar: { lat: 17.4667, lng: 78.4417 },
  shamshabad: { lat: 17.2543, lng: 78.4312 },
  cherlapally: { lat: 17.4526, lng: 78.6019 },
  kukatpally: { lat: 17.4947, lng: 78.3996 },
  kondapur: { lat: 17.4699, lng: 78.3578 },
  madhapur: { lat: 17.4483, lng: 78.3915 },
  kothapet: { lat: 17.3713, lng: 78.5476 },
};

function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const rawDist = R * c;
  return Math.max(2.5, Math.round(rawDist * 1.25 * 10) / 10);
}

const activeBookings = new Map<string, TripBooking>();

export const logisticsApi = {
  getVehicleTypes(): VehicleType[] {
    return VEHICLE_FLEET;
  },

  getVehicleById(id: string): VehicleType | undefined {
    return VEHICLE_FLEET.find((v) => v.id === id);
  },

  calculateDistance(pickupAddress: string, dropAddress: string): { distanceKm: number; estimatedMinutes: number } {
    if (!pickupAddress || !dropAddress) {
      return { distanceKm: 8.5, estimatedMinutes: 28 };
    }

    const pNorm = pickupAddress.toLowerCase();
    const dNorm = dropAddress.toLowerCase();

    let pCoords = { lat: 17.4401, lng: 78.3489 };
    let dCoords = { lat: 17.4018, lng: 78.5602 };

    for (const [key, val] of Object.entries(POPULAR_LOCATIONS)) {
      if (pNorm.includes(key)) pCoords = val;
      if (dNorm.includes(key)) dCoords = val;
    }

    const distanceKm = calculateHaversineDistance(pCoords.lat, pCoords.lng, dCoords.lat, dCoords.lng);
    const estimatedMinutes = Math.round((distanceKm / 22) * 60 + 8);

    return { distanceKm, estimatedMinutes };
  },

  calculateFare(
    vehicle: VehicleType,
    distanceKm: number,
    helpersCount = 0,
    hasGst = false
  ): FareBreakdown {
    const extraKm = Math.max(0, distanceKm - vehicle.baseKm);
    const distanceFare = Math.round(extraKm * vehicle.perKmRate);
    const baseFare = vehicle.baseFare;
    const helperFee = helpersCount * vehicle.helperRate;
    const tollFee = distanceKm > 18 ? 45 : 0;
    const subtotal = baseFare + distanceFare + helperFee + tollFee;
    const gstAmount = hasGst ? Math.round(subtotal * 0.18) : 0;
    const totalFare = subtotal + gstAmount;
    const estimatedMinutes = Math.round((distanceKm / 22) * 60 + 8);

    return {
      vehicleId: vehicle.id,
      distanceKm,
      estimatedMinutes,
      baseFare,
      distanceFare,
      helperFee,
      tollFee,
      gstAmount,
      discountAmount: 0,
      totalFare,
    };
  },

  async createBooking(payload: {
    pickup: LocationPoint;
    drop: LocationPoint;
    stops?: LocationPoint[];
    vehicleId: string;
    goodsType: string;
    estimatedWeightKg: number;
    helpersCount: number;
    hasGstInvoice: boolean;
    gstin?: string;
    paymentMethod?: 'online' | 'cash_on_pickup' | 'corporate_credit';
  }): Promise<TripBooking> {
    const vehicle = this.getVehicleById(payload.vehicleId) || VEHICLE_FLEET[2];
    const { distanceKm } = this.calculateDistance(payload.pickup.address, payload.drop.address);
    const fare = this.calculateFare(vehicle, distanceKm, payload.helpersCount, payload.hasGstInvoice);

    const bookingId = `HEX-${Math.floor(100000 + Math.random() * 900000)}`;
    const waybillNumber = `WB-${Date.now().toString().slice(-8)}`;
    const now = new Date().toISOString();

    const booking: TripBooking = {
      bookingId,
      waybillNumber,
      createdAt: now,
      status: 'searching_driver',
      pickup: payload.pickup,
      drop: payload.drop,
      stops: payload.stops,
      vehicle,
      fare,
      goodsType: payload.goodsType || 'Industrial & Building Supplies',
      estimatedWeightKg: payload.estimatedWeightKg || 350,
      helpersCount: payload.helpersCount,
      hasGstInvoice: payload.hasGstInvoice,
      gstin: payload.gstin,
      paymentMethod: payload.paymentMethod || 'online',
      pickupOtp: String(Math.floor(1000 + Math.random() * 9000)),
      deliveryOtp: String(Math.floor(1000 + Math.random() * 9000)),
      trackingTimeline: [
        {
          status: 'searching_driver',
          title: 'Booking Placed',
          description: `Consignment registered. Dispatching nearby ${vehicle.name} driver.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          completed: true,
        },
      ],
    };

    activeBookings.set(bookingId, booking);
    activeBookings.set(waybillNumber, booking);
    return booking;
  },

  async assignDriver(bookingId: string): Promise<TripBooking> {
    const booking = activeBookings.get(bookingId);
    if (!booking) throw new Error('Booking not found');

    const drivers = [
      {
        id: 'DRV-1082',
        name: 'Ramesh Kumar Goud',
        photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        phone: '+91 98492 48102',
        rating: 4.9,
        totalTrips: 1840,
        vehicleModel: booking.vehicle.name,
        vehiclePlate: 'TS 09 UB 4821',
        currentLat: 17.442,
        currentLng: 78.351,
        etaToPickupMinutes: 4,
      },
      {
        id: 'DRV-1094',
        name: 'Suresh Reddy',
        photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        phone: '+91 97011 29401',
        rating: 4.85,
        totalTrips: 1220,
        vehicleModel: booking.vehicle.name,
        vehiclePlate: 'TS 08 FA 9134',
        currentLat: 17.446,
        currentLng: 78.358,
        etaToPickupMinutes: 6,
      },
    ];

    const driver = drivers[Math.floor(Math.random() * drivers.length)];

    booking.driver = driver;
    booking.status = 'driver_assigned';
    booking.trackingTimeline.push({
      status: 'driver_assigned',
      title: 'Driver Assigned',
      description: `${driver.name} (${driver.vehiclePlate}) is en route to pickup location.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      completed: true,
    });

    activeBookings.set(bookingId, booking);
    return booking;
  },

  getBooking(bookingIdOrWaybill: string): TripBooking | null {
    if (activeBookings.has(bookingIdOrWaybill)) {
      return activeBookings.get(bookingIdOrWaybill)!;
    }

    const sample: TripBooking = {
      bookingId: bookingIdOrWaybill.toUpperCase().startsWith('HEX') ? bookingIdOrWaybill : 'HEX-894210',
      waybillNumber: 'WB-78219034',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      status: 'in_transit',
      pickup: {
        address: 'Balanagar Industrial Area, Plot 42, Hyderabad',
        contactName: 'Naveen Rao (Site Incharge)',
        contactPhone: '+91 98480 12345',
      },
      drop: {
        address: 'Financial District, Nanakramguda, Hyderabad',
        contactName: 'Vijay Kumar (Project Manager)',
        contactPhone: '+91 91234 56789',
      },
      vehicle: VEHICLE_FLEET[2],
      fare: {
        vehicleId: 'tata_ace',
        distanceKm: 16.4,
        estimatedMinutes: 42,
        baseFare: 220,
        distanceFare: 223,
        helperFee: 150,
        tollFee: 0,
        gstAmount: 107,
        discountAmount: 0,
        totalFare: 700,
      },
      goodsType: 'Electrical Switchgears & Cables',
      estimatedWeightKg: 620,
      helpersCount: 1,
      hasGstInvoice: true,
      gstin: '36AAACH7821P1Z5',
      paymentMethod: 'online',
      pickupOtp: '4821',
      deliveryOtp: '9103',
      driver: {
        id: 'DRV-1082',
        name: 'Ramesh Kumar Goud',
        photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        phone: '+91 98492 48102',
        rating: 4.92,
        totalTrips: 1840,
        vehicleModel: 'Tata Ace Gold Diesel',
        vehiclePlate: 'TS 09 UB 4821',
        currentLat: 17.432,
        currentLng: 78.368,
        etaToPickupMinutes: 0,
      },
      trackingTimeline: [
        {
          status: 'searching_driver',
          title: 'Booking Placed',
          description: 'Consignment booked online by HinchMart Business User.',
          timestamp: '10:15 AM',
          completed: true,
        },
        {
          status: 'driver_assigned',
          title: 'Driver Assigned',
          description: 'Ramesh Kumar (TS 09 UB 4821) accepted the trip.',
          timestamp: '10:18 AM',
          completed: true,
        },
        {
          status: 'arrived_at_pickup',
          title: 'Arrived at Pickup',
          description: 'Driver reached Balanagar warehouse.',
          timestamp: '10:32 AM',
          completed: true,
        },
        {
          status: 'in_transit',
          title: 'Goods Loaded & In Transit',
          description: 'OTP 4821 verified. Vehicle moving towards Financial District.',
          timestamp: '10:48 AM',
          completed: true,
        },
        {
          status: 'completed',
          title: 'Delivered',
          description: 'Pending drop-off verification.',
          timestamp: 'Est. 11:35 AM',
          completed: false,
        },
      ],
    };

    activeBookings.set(sample.bookingId, sample);
    return sample;
  },
};
