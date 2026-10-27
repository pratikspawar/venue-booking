export type SportType = string;

export type BillingMode = 'TIME_PLAYED' | 'FIXED_SLOT';

export type SessionStatus = 'AVAILABLE' | 'IN_PROGRESS' | 'HELD' | 'MAINTENANCE';

export type TabType = 'desk' | 'timeline' | 'resources' | 'bookings' | 'earnings' | 'reports' | 'staff' | 'memberships' | 'promotions' | 'superadmin';

export interface CouponDto {
  id: number;
  code: string;
  discountType: 'PERCENTAGE' | 'FLAT';
  discountValue: number;
  minBookingAmountPaise: number;
  maxDiscountPaise?: number;
  applicableSportCode?: string;
  validFrom: string;
  validTo: string;
  maxUses: number;
  usedCount: number;
  active: boolean;
  createdAt?: string;
}

export interface CreateCouponPayload {
  code: string;
  discountType: 'PERCENTAGE' | 'FLAT';
  discountValue: number;
  minBookingAmountPaise?: number;
  maxDiscountPaise?: number;
  applicableSportCode?: string;
  validFrom: string;
  validTo: string;
  maxUses?: number;
}

export interface PrepaidPackageDto {
  id: number;
  name: string;
  sportCode?: string;
  totalMinutes: number;
  totalHours: number;
  pricePaise: number;
  priceRupees: number;
  validityDays: number;
  active: boolean;
}

export interface CreatePrepaidPackagePayload {
  name: string;
  sportCode?: string;
  totalMinutes: number;
  pricePaise: number;
  validityDays?: number;
}

export interface CustomerPrepaidPackageDto {
  id: number;
  userId: number;
  packageId: number;
  packageName: string;
  sportCode?: string;
  totalMinutes: number;
  totalHours: number;
  remainingMinutes: number;
  remainingHours: number;
  purchasedAt: string;
  expiresAt: string;
  status: string;
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

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  user: string;
  type: 'CHECKIN' | 'EXTEND' | 'SWAP' | 'SETTLE' | 'CANTEEN' | 'CANCEL' | 'BOOKING' | 'NO_SHOW';
}

export interface ExtendConflictResult {
  conflict: boolean;
  message: string;
  alternativeResources: Array<{
    resourceId: number;
    resourceName: string;
    sportName: string;
  }>;
}

export interface DailyEarningsData {
  date: string;
  dayLabel: string;
  grossRevenuePaise: number;
  gameTimeRevenuePaise: number;
  canteenRevenuePaise: number;
  equipmentRentalRevenuePaise: number;
  cashPaise: number;
  upiPaise: number;
  onlinePaise: number;
  discountPaise: number;
  refundPaise: number;
  netEarningsPaise: number;
  totalBookingsCount: number;
  completedCount: number;
}

export interface PaymentMethodEarningsData {
  paymentMode: string;
  label: string;
  amountPaise: number;
  transactionCount: number;
  percentage: number;
}

export interface EarningsSummaryData {
  totalGrossEarningsPaise: number;
  netEarningsPaise: number;
  gameTimeEarningsPaise: number;
  canteenEarningsPaise: number;
  canteenRevenuePaise?: number;
  equipmentRentalEarningsPaise: number;
  totalDiscountsPaise: number;
  totalRefundsPaise: number;
  estimatedGstPaise: number;
  cashInDrawerPaise: number;
  counterUpiPaise: number;
  onlineGatewayPaise: number;
  walletSettledPaise: number;
  totalPaidTransactions: number;
  averageOrderValuePaise: number;
  refundRatePercent: number;
}

export interface StaffCollectionData {
  staffUserId: number;
  staffName: string;
  sessionsHandled: number;
  cashCollectedPaise: number;
  upiCollectedPaise: number;
  totalCollectedPaise: number;
}

export interface EarningsLedgerEntry {
  bookingId: number;
  timestamp: string;
  formattedTime: string;
  customerName: string;
  customerPhone: string;
  resourceName: string;
  sportName: string;
  paymentMode: string;
  gameTimePaise: number;
  canteenPaise: number;
  discountPaise: number;
  taxPaise: number;
  grossPaise: number;
  netPaise: number;
  status: string;
  source: string;
}

export interface ComprehensiveEarningsReport {
  summary: EarningsSummaryData;
  dailyTrends: DailyEarningsData[];
  paymentBreakdown: PaymentMethodEarningsData[];
  sportBreakdown: Array<{ sportCode?: string; sportName: string; revenuePaise: number; bookingCount: number; percentage: number }>;
  staffCollections: StaffCollectionData[];
  recentTransactions: EarningsLedgerEntry[];
  periodStart: string;
  periodEnd: string;
}

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
  conditionStatus?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'MAINTENANCE' | 'DAMAGED';
  depositPaise?: number;
  serialNumber?: string;
  isLowStock?: boolean;
  icon?: string;
}

export interface EquipmentItemDto {
  id: number;
  tenantId?: number;
  venueId?: number;
  name: string;
  category: 'EQUIPMENT_RENTAL' | 'ACCESSORY';
  pricePaise: number;
  stockCount: number;
  lowStockThreshold: number;
  isEquipment: boolean;
  conditionStatus: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'MAINTENANCE' | 'DAMAGED';
  depositPaise: number;
  serialNumber?: string;
  active: boolean;
  isLowStock?: boolean;
  createdAt?: string;
}

export interface CreateEquipmentPayload {
  name: string;
  category?: 'EQUIPMENT_RENTAL' | 'ACCESSORY';
  pricePaise: number;
  stockCount: number;
  lowStockThreshold?: number;
  isEquipment?: boolean;
  conditionStatus: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'MAINTENANCE' | 'DAMAGED';
  depositPaise: number;
  serialNumber?: string;
}

export interface UpdateEquipmentPayload {
  name?: string;
  pricePaise?: number;
  stockCount?: number;
  lowStockThreshold?: number;
  conditionStatus?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'MAINTENANCE' | 'DAMAGED';
  depositPaise?: number;
  serialNumber?: string;
  active?: boolean;
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
  status: 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'HELD' | 'CANCELLED' | 'NO_SHOW' | 'EXPIRED';
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

export interface PricingRuleDto {
  id?: number;
  resourceId?: number;
  dayType: 'ANY' | 'WEEKDAY' | 'WEEKEND';
  startTime?: string;
  endTime?: string;
  pricePerSlotPaise?: number;
  pricePerHourPaise?: number;
  minChargeMinutes?: number;
  roundingMinutes?: number;
  priority?: number;
}

export interface StaffMemberDto {
  id: number;
  userId: number;
  tenantId: number;
  phone: string;
  name?: string;
  email?: string;
  role: 'OWNER' | 'MANAGER' | 'STAFF';
  active: boolean;
  assignedVenues?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InviteStaffPayload {
  phone: string;
  name?: string;
  email?: string;
  role: 'OWNER' | 'MANAGER' | 'STAFF';
  assignedVenues?: string;
}

export interface UpdateStaffPayload {
  role?: 'OWNER' | 'MANAGER' | 'STAFF';
  active?: boolean;
  assignedVenues?: string;
}

export interface CanteenStockLedgerEntry {
  id: number;
  tenantId: number;
  venueId: number;
  canteenItemId: number;
  itemName: string;
  transactionType: 'RECEIPT' | 'SALE' | 'ADJUSTMENT' | 'WASTAGE' | 'RETURN';
  quantityChange: number;
  previousStock: number;
  newStock: number;
  unitCostPaise?: number;
  reason?: string;
  referenceId?: string;
  performedBy?: number;
  createdAt: string;
}

export interface StockAdjustmentPayload {
  transactionType: 'RECEIPT' | 'SALE' | 'ADJUSTMENT' | 'WASTAGE' | 'RETURN';
  quantityChange: number;
  unitCostPaise?: number;
  reason?: string;
  referenceId?: string;
  performedBy?: number;
}

// --- Platform Super-Admin Types (Task 2.6) ---
export interface PlatformTenantDto {
  id: number;
  name: string;
  slug: string;
  logoUrl?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL';
  planId?: number;
  planName?: string;
  gstNumber?: string;
  razorpayAccountId?: string;
  memberCount: number;
  gmvPaise: number;
  createdAt: string;
  updatedAt?: string;
}

export interface PlatformMetricsDto {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  suspendedTenants: number;
  totalPlatformGmvPaise: number;
  monthlyRecurringRevenuePaise: number;
  totalActiveBookingsCount: number;
  platformUptimePercent: number;
}

export interface OnboardTenantRequestDto {
  name: string;
  slug: string;
  logoUrl?: string;
  planId?: number;
  gstNumber?: string;
  razorpayAccountId?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface ImpersonateRequestDto {
  targetTenantId: number;
  reason: string;
}

export interface ImpersonationAuditDto {
  id: number;
  adminUserId?: number;
  adminUsername: string;
  targetTenantId: number;
  targetTenantName: string;
  reason: string;
  clientIp: string;
  impersonatedAt: string;
}



