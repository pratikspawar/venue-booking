export type SportType = string;

export type BillingMode = 'TIME_PLAYED' | 'FIXED_SLOT';

export type SessionStatus = 'AVAILABLE' | 'IN_PROGRESS' | 'HELD' | 'MAINTENANCE';

export type TabType = 'desk' | 'resources' | 'bookings' | 'reports';

export interface SportItem {
  id?: number;
  code: string;
  nameEn: string;
  nameMr?: string;
  nameHi?: string;
  icon?: string;
}

export interface BookingItemData {
  id: number;
  canteenItemId: number;
  itemName: string;
  quantity: number;
  unitPricePaise: number;
  totalPaise: number;
}

export interface CanteenItem {
  id: number;
  name: string;
  category: 'FOOD' | 'BEVERAGE' | 'EQUIPMENT_RENTAL' | 'ACCESSORY';
  pricePaise: number;
  stockCount: number;
  lowStockThreshold: number;
  isEquipment: boolean;
  isLowStock?: boolean;
  icon?: string;
}

export interface ShiftSummaryData {
  venueId?: number;
  date: string;
  totalSessionsCount: number;
  gameTimeRevenuePaise: number;
  canteenRevenuePaise: number;
  totalRevenuePaise: number;
  cashCollectedPaise: number;
  upiCollectedPaise: number;
}

export interface ResourceSession {
  id: number;
  name: string;
  sport: SportType;
  billingMode: BillingMode;
  status: SessionStatus;
  ratePerHour: number;
  ratePerSlot?: number;
  customerName?: string;
  customerPhone?: string;
  startedAt?: Date;
  scheduledSlot?: string;
  backendSessionId?: number;
  slotMinutes?: number;
  canteenItems?: BookingItemData[];
}

export interface BookingItem {
  id: string;
  customerName: string;
  customerPhone: string;
  resourceName: string;
  sport?: string;
  source?: 'APP' | 'WALKIN';
  timeWindow: string;
  amountPaise: number;
  paidPaise?: number;
  refundPaise?: number;
  paymentMode: 'RAZORPAY_ONLINE' | 'COUNTER_CASH' | 'COUNTER_UPI' | 'WALLET';
  status: 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'HELD' | 'CANCELLED';
  gatewayPaymentId?: string;
  startUtc?: string;
  createdAt: string;
}

export interface RefundItem {
  id: number;
  paymentId: number;
  bookingId: number;
  amountPaise: number;
  status: 'REQUESTED' | 'PROCESSED' | 'FAILED';
  gatewayRefundId: string;
  reason: string;
  createdAt: string;
}

export interface TenantInfo {
  id: number;
  name: string;
  slug: string;
  plan: string;
  staffName: string;
  role: string;
  city: string;
}

export interface ReportSummary {
  totalGrossRevenuePaise: number;
  gameTimeRevenuePaise: number;
  canteenRevenuePaise: number;
  equipmentRentalRevenuePaise: number;
  totalBookingsCount: number;
  completedCount: number;
  activeCount: number;
  cancelledCount: number;
  noShowCount: number;
  overallUtilizationPercent: number;
  averageSessionMinutes: number;
  cashCollectionPaise: number;
  upiCollectionPaise: number;
  onlineCollectionPaise: number;
}

export interface SportRevenueBreakdown {
  sportCode: string;
  sportName: string;
  revenuePaise: number;
  bookingCount: number;
  percentage: number;
}

export interface PeakHourAnalysis {
  hourOfDay: number;
  hourLabel: string;
  bookingCount: number;
  revenuePaise: number;
  peakLevel: 'PEAK' | 'MODERATE' | 'OFF_PEAK';
}

export interface ResourceUtilization {
  resourceId: number;
  resourceName: string;
  sportCode: string;
  sportName: string;
  totalBookedMinutes: number;
  revenuePaise: number;
  utilizationPercent: number;
}

export interface StaffCollection {
  staffUserId: number;
  staffName: string;
  sessionsHandled: number;
  cashCollectedPaise: number;
  upiCollectedPaise: number;
  totalCollectedPaise: number;
}

export interface ComprehensiveReport {
  summary: ReportSummary;
  sportBreakdown: SportRevenueBreakdown[];
  peakHours: PeakHourAnalysis[];
  resourceUtilization: ResourceUtilization[];
  staffCollections: StaffCollection[];
  periodStart: string;
  periodEnd: string;
}

