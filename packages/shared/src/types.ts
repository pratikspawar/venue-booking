import {
  BillingMode,
  BookingSource,
  BookingStatus,
  DayType,
  PayAtVenueMode,
  PaymentMethod,
  PaymentMode,
  PaymentStatus,
  ResourceStatus,
  TenantStatus,
  UserRole
} from './enums';

export interface Tenant {
  id: number;
  name: string;
  slug: string;
  logoUrl?: string;
  status: TenantStatus;
  planId?: number;
  gstNumber?: string;
  createdAt: string;
}

export interface User {
  id: number;
  phone: string;
  name?: string;
  email?: string;
  language: string;
  isSuperAdmin: boolean;
}

export interface Venue {
  id: number;
  tenantId: number;
  name: string;
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone: string;
  payAtVenueMode: PayAtVenueMode;
  advanceAmountPaise: number;
  holdMinutes: number;
  active: boolean;
}

export interface Resource {
  id: number;
  tenantId: number;
  venueId: number;
  sportId: number;
  name: string;
  capacity: number;
  slotMinutes: number;
  billingMode: BillingMode;
  status: ResourceStatus;
}

export interface SlotAvailability {
  slotStart: string; // ISO 8601 UTC
  slotEnd: string;   // ISO 8601 UTC
  isAvailable: boolean;
  pricePaise: number;
  reason?: 'BOOKED' | 'BLOCKED' | 'PAST';
}

export interface Booking {
  id: number;
  tenantId: number;
  venueId: number;
  resourceId: number;
  customerId?: number;
  walkinName?: string;
  walkinPhone?: string;
  source: BookingSource;
  startUtc: string;
  endUtc: string;
  status: BookingStatus;
  holdExpiresAt?: string;
  amountPaise: number;
  discountPaise: number;
  taxPaise: number;
  paidPaise: number;
  paymentMode: PaymentMode;
  createdAt: string;
}

export interface CreateBookingRequest {
  resourceId: number;
  startUtc: string;
  endUtc: string;
  paymentMode: PaymentMode;
  couponCode?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  fieldErrors?: Record<string, string>;
  timestamp: string;
}
