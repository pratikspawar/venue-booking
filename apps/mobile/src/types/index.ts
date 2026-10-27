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
  distanceKm?: number;
  rating?: number;
  reviewCount?: number;
  sports: SportCategory[];
  startingPricePaise?: number;
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
  endUtc?: string;
  label: string;
  pricePaise: number;
  status: 'AVAILABLE' | 'HELD' | 'BOOKED' | 'BLOCKED' | 'PAST' | 'MAINTENANCE';
}

export interface BookingTicket {
  bookingId: string;
  venueName: string;
  venueAddress: string;
  resourceName: string;
  sport: SportCategory;
  dateLabel: string;
  timeWindow: string;
  status: 'CONFIRMED' | 'HELD' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED' | 'NO_SHOW';
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

export interface WalletTransaction {
  id: number;
  amountPaise: number;
  amountRupees: number;
  type: 'CREDIT' | 'DEBIT';
  referenceId?: string;
  description?: string;
  balanceAfterPaise: number;
  balanceAfterRupees: number;
  createdAt: string;
}

export interface WalletInfo {
  walletId: number;
  userId: number;
  balancePaise: number;
  balanceRupees: number;
}

export interface MembershipPlan {
  id: number;
  name: string;
  sportCode: string | null;
  pricePaise: number;
  priceRupees: number;
  durationDays: number;
  discountPercent: number;
  freeMinutes: number;
  active: boolean;
}

export interface CustomerMembership {
  id: number;
  userId: number;
  planId: number;
  planName: string;
  sportCode: string | null;
  discountPercent: number;
  remainingFreeMinutes: number;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
}

export interface PrepaidPackageDto {
  id: number;
  name: string;
  sportCode?: string | null;
  totalMinutes: number;
  totalHours: number;
  pricePaise: number;
  priceRupees: number;
  validityDays: number;
  active: boolean;
}

export interface CustomerPrepaidPackageDto {
  id: number;
  userId: number;
  packageId: number;
  packageName: string;
  sportCode?: string | null;
  totalMinutes: number;
  totalHours: number;
  remainingMinutes: number;
  remainingHours: number;
  purchasedAt: string;
  expiresAt: string;
  status: string;
}

export interface CouponValidationResult {
  valid: boolean;
  couponId?: number;
  code?: string;
  discountPaise?: number;
  discountRupees?: number;
  message?: string;
}
