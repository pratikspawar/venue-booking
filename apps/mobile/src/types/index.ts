export type SportCategory = string;

export interface SportItem {
  id: number;
  code: string;
  nameEn: string;
  nameMr?: string;
  nameHi?: string;
  icon?: string;
}

export interface VenueItem {
  id: number;
  tenantId: number;
  name: string;
  address: string;
  city: string;
  distanceKm: number;
  rating: number;
  reviewCount: number;
  sports: SportCategory[];
  startingPricePaise: number;
  payAtVenueAllowed: boolean;
  openTime: string;
  closeTime: string;
  active: boolean;
}

export interface ResourceItem {
  id: number;
  venueId: number;
  name: string;
  sport: SportCategory;
  slotMinutes: number;
  ratePerHourPaise: number;
  status: 'ACTIVE' | 'MAINTENANCE';
}

export interface SlotCell {
  startUtc: string;
  label: string;
  pricePaise: number;
  status: 'AVAILABLE' | 'HELD' | 'BOOKED' | 'MAINTENANCE';
}

export interface BookingTicket {
  bookingId: string;
  venueName: string;
  venueAddress: string;
  resourceName: string;
  sport: SportCategory;
  dateLabel: string;
  timeWindow: string;
  status: 'CONFIRMED' | 'HELD' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  amountPaise: number;
  paymentMode: 'ONLINE' | 'PAY_AT_VENUE';
  qrData: string;
  canCancel: boolean;
  holdExpiresAt?: string;
}

export interface CustomerUser {
  id: number;
  phone: string;
  name: string;
  language: 'en' | 'mr' | 'hi';
  walletBalancePaise: number;
  token: string | null;
}
