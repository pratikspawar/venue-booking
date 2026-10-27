/**
 * Enterprise API Client for VenueOps Admin Web
 * Connects directly through Spring Cloud API Gateway (Port 8080)
 * Includes JWT Refresh-Token Rotation, Auto-Refresh on 401, and Session Invalidation
 */

/// <reference types="vite/client" />

import {
  PricingRuleDto,
  StaffMemberDto,
  InviteStaffPayload,
  UpdateStaffPayload,
  EquipmentItemDto,
  CreateEquipmentPayload,
  UpdateEquipmentPayload,
  MembershipPlan,
  CustomerMembership,
  CouponDto,
  CreateCouponPayload,
  PrepaidPackageDto,
  CreatePrepaidPackagePayload,
  CustomerPrepaidPackageDto,
  CanteenStockLedgerEntry,
  StockAdjustmentPayload,
  PlatformTenantDto,
  PlatformMetricsDto,
  OnboardTenantRequestDto,
  ImpersonateRequestDto,
  ImpersonationAuditDto,
} from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080/api/v1';

export interface StartSessionPayload {
  bookingId?: number;
  resourceId?: number;
  venueId?: number;
  walkinName?: string;
  walkinPhone?: string;
}

export interface StopSessionPayload {
  manualBilledMinutes?: number;
  discountPaise?: number;
  paymentMethod?: 'CASH' | 'UPI_COUNTER' | 'WALLET';
}

export interface PlaySessionData {
  sessionId: number;
  sessionCode?: string;
  bookingId?: number;
  resourceId: number;
  venueId: number;
  walkinName?: string;
  walkinPhone?: string;
  startedAtUtc: string;
  endedAtUtc?: string;
  billedMinutes?: number;
  ratePerHourPaise: number;
  amountPaise: number;
  discountPaise: number;
  finalPaise: number;
  canteenPaise: number;
  totalSettlementPaise: number;
  paymentMethod?: string;
  status: 'ACTIVE' | 'EXTENDED' | 'COMPLETED';
}

export interface ShiftSummaryData {
  venueId: number;
  totalSessions: number;
  activeSessions: number;
  completedSessions: number;
  totalPlayPaise: number;
  totalCanteenPaise: number;
  totalRevenuePaise: number;
  cashPaise: number;
  upiPaise: number;
  walletPaise: number;
  unpaidPaise: number;
  shiftStartTimeUtc: string;
  currentTimeUtc: string;
}

export interface CanteenItemData {
  id: number;
  tenantId: number;
  venueId: number;
  category: string;
  name: string;
  description?: string;
  pricePaise: number;
  costPaise?: number;
  stockQuantity: number;
  lowStockThreshold: number;
  barcode?: string;
  active: boolean;
}

export interface ActiveShiftLedgerData {
  id: number;
  tenantId: number;
  venueId: number;
  userId: number;
  staffName?: string;
  shiftCode: string;
  status: 'OPEN' | 'CLOSED';
  openedAtUtc: string;
  closedAtUtc?: string;
  openingCashPaise: number;
  closingCashPaise?: number;
  systemCashPaise: number;
  cashVariancePaise?: number;
  note?: string;
}

export interface BookingCanteenBillItem {
  id: number;
  canteenItemId: number;
  name: string;
  quantity: number;
  unitPricePaise: number;
  amountPaise: number;
  paidPaise: number;
  startedBy?: number;
  endedBy?: number;
  active: boolean;
}

class ApiService {
  private token: string | null = null;
  private refreshTokenVal: string | null = null;
  private tenantId: number = 1;
  private refreshPromise: Promise<string | null> | null = null;

  constructor() {
    this.token = localStorage.getItem('venue_access_token');
    this.refreshTokenVal = localStorage.getItem('venue_refresh_token');
    const storedTenant = localStorage.getItem('venue_tenant_id');
    if (storedTenant) {
      this.tenantId = parseInt(storedTenant, 10);
    }
  }

  setTokens(accessToken: string, refreshToken?: string) {
    this.token = accessToken;
    localStorage.setItem('venue_access_token', accessToken);
    if (refreshToken) {
      this.refreshTokenVal = refreshToken;
      localStorage.setItem('venue_refresh_token', refreshToken);
    }
  }

  setToken(token: string) {
    this.setTokens(token);
  }

  clearTokens() {
    this.token = null;
    this.refreshTokenVal = null;
    localStorage.removeItem('venue_access_token');
    localStorage.removeItem('venue_refresh_token');
  }

  setTenantId(id: number) {
    this.tenantId = id;
    localStorage.setItem('venue_tenant_id', id.toString());
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Tenant-Id': this.tenantId.toString(),
      'X-Correlation-Id': 'web-' + Math.random().toString(36).substring(2, 10),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // --- Auto-Refresh Interceptor ---
  async refreshSession(): Promise<string | null> {
    if (!this.refreshTokenVal) {
      this.clearTokens();
      return null;
    }

    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/token/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            refreshToken: this.refreshTokenVal,
            requestedTenantId: this.tenantId,
          }),
        });

        if (!res.ok) {
          this.clearTokens();
          return null;
        }

        const data = await res.json();
        if (data.accessToken) {
          this.setTokens(data.accessToken, data.refreshToken);
          return data.accessToken;
        }
      } catch {
        this.clearTokens();
      } finally {
        this.refreshPromise = null;
      }
      return null;
    })();

    return this.refreshPromise;
  }

  async logout(): Promise<void> {
    const rf = this.refreshTokenVal;
    const at = this.token;
    this.clearTokens();
    if (rf || at) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(at ? { Authorization: `Bearer ${at}` } : {}),
          },
          body: JSON.stringify({ refreshToken: rf }),
        });
      } catch (e) {
        console.warn('Logout notification error:', e);
      }
    }
  }

  async request(url: string, init: RequestInit = {}): Promise<Response> {
    const headers = {
      ...this.getHeaders(),
      ...((init.headers as Record<string, string>) || {}),
    };

    let res = await fetch(url, { ...init, headers });

    // Handle 401 Unauthorized with token refresh & retry
    if (res.status === 401 && this.refreshTokenVal) {
      const newToken = await this.refreshSession();
      if (newToken) {
        const retryHeaders = {
          ...this.getHeaders(),
          ...((init.headers as Record<string, string>) || {}),
          Authorization: `Bearer ${newToken}`,
        };
        res = await fetch(url, { ...init, headers: retryHeaders });
      }
    }

    return res;
  }

  // --- Auth Endpoints ---
  async requestOtp(phone: string) {
    const res = await fetch(`${API_BASE_URL}/auth/otp/request`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ phone }),
    });
    return res.json();
  }

  async verifyOtp(phone: string, otp: string) {
    const res = await fetch(`${API_BASE_URL}/auth/otp/verify`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ phone, otp, tenantId: this.tenantId }),
    });
    const data = await res.json();
    if (data.accessToken) {
      this.setTokens(data.accessToken, data.refreshToken);
    }
    return data;
  }

  // --- Staff Desk Live Sessions Endpoints ---
  async startLiveSession(payload: StartSessionPayload): Promise<PlaySessionData> {
    const res = await this.request(`${API_BASE_URL}/staff/sessions/start`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to start live play session');
    }
    return res.json();
  }

  async stopLiveSession(sessionId: number, payload: StopSessionPayload): Promise<PlaySessionData> {
    const res = await this.request(`${API_BASE_URL}/staff/sessions/${sessionId}/stop`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to stop session');
    }
    return res.json();
  }

  async getActiveSessions(venueId?: number): Promise<PlaySessionData[]> {
    const url = venueId
      ? `${API_BASE_URL}/staff/sessions/active?venueId=${venueId}`
      : `${API_BASE_URL}/staff/sessions/active`;

    const res = await this.request(url, {
      method: 'GET',
    });
    if (!res.ok) {
      throw new Error('Failed to fetch active sessions');
    }
    return res.json();
  }

  async checkinBooking(bookingId: number) {
    const res = await this.request(`${API_BASE_URL}/staff/bookings/${bookingId}/checkin`, {
      method: 'POST',
    });
    return res.ok;
  }

  async markNoShow(bookingId: number | string) {
    const res = await this.request(`${API_BASE_URL}/staff/bookings/${bookingId}/no-show`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to mark booking as no-show');
    }
    return true;
  }

  // --- Catalog & Venues ---
  async getVenues() {
    const res = await this.request(`${API_BASE_URL}/venues`, {
      method: 'GET',
    });
    return res.json();
  }

  // --- Bookings ---
  async getBookings() {
    const res = await this.request(`${API_BASE_URL}/bookings`, {
      method: 'GET',
    });
    return res.json();
  }

  // --- Sports & Catalog Management ---
  async getSports() {
    const res = await this.request(`${API_BASE_URL}/sports`, {
      method: 'GET',
    });
    return res.json();
  }

  async createSport(payload: { code: string; nameEn: string; nameMr?: string; nameHi?: string }) {
    const res = await this.request(`${API_BASE_URL}/sports`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create sport');
    }
    return res.json();
  }

  async createResource(payload: any) {
    const res = await this.request(`${API_BASE_URL}/owner/resources`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.json();
  }

  // --- Resource Pricing Rules (Module 6) ---
  async getResourcePricingRules(resourceId: number): Promise<PricingRuleDto[]> {
    const res = await this.request(`${API_BASE_URL}/owner/resources/${resourceId}/pricing-rules`, {
      method: 'GET',
    });
    if (!res.ok) return [];
    return res.json();
  }

  async updateResourcePricingRules(resourceId: number, rules: PricingRuleDto[]): Promise<{ message: string }> {
    const res = await this.request(`${API_BASE_URL}/owner/resources/${resourceId}/pricing-rules`, {
      method: 'PUT',
      body: JSON.stringify(rules),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update pricing rules');
    }
    return res.json();
  }

  // --- Payments & Refunds ---
  async processRefund(bookingId: number, amountPaise: number, reason?: string) {
    const res = await this.request(`${API_BASE_URL}/payments/refund`, {
      method: 'POST',
      body: JSON.stringify({ bookingId, amountPaise, reason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to process refund');
    }
    return res.json();
  }

  async cancelBooking(bookingId: number, payload?: {
    reason?: string;
    reasonCode?: string;
    managerApprovalCode?: string;
    customRefundPaise?: number;
  }) {
    const res = await this.request(`${API_BASE_URL}/bookings/${bookingId}/cancel`, {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to cancel booking');
    }
    return res.json();
  }

  // --- Canteen & Equipment Inventory (Module 6) ---
  async getCanteenItems(venueId: number = 1) {
    const res = await this.request(`${API_BASE_URL}/venues/${venueId}/canteen/items`, {
      method: 'GET',
    });
    if (!res.ok) return [];
    return res.json();
  }

  async addItemToBooking(bookingId: number, item: { canteenItemId: number; itemName: string; quantity: number; unitPricePaise: number }) {
    const res = await this.request(`${API_BASE_URL}/staff/bookings/${bookingId}/items`, {
      method: 'POST',
      body: JSON.stringify(item),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to add item to session bill');
    }
    return res.json();
  }

  async getShiftSummary(venueId: number = 1) {
    const res = await this.request(`${API_BASE_URL}/staff/shift-summary?venueId=${venueId}`, {
      method: 'GET',
    });
    if (!res.ok) return null;
    return res.json();
  }

  // --- Live Session Extension, Resource Swap & QR Check-in ---
  async extendSession(sessionId: number, extraMinutes: number = 30): Promise<{
    success: boolean;
    conflict: boolean;
    message: string;
    sessionId: number;
    currentResourceId: number;
    newEndUtc: string;
    alternativeResources: Array<{
      resourceId: number;
      resourceName: string;
      sportName: string;
    }>;
  }> {
    const res = await this.request(`${API_BASE_URL}/staff/sessions/${sessionId}/extend`, {
      method: 'POST',
      body: JSON.stringify({ extraMinutes }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to extend session');
    }
    return res.json();
  }

  async swapSessionResource(sessionId: number, targetResourceId: number, reason?: string) {
    const res = await this.request(`${API_BASE_URL}/staff/sessions/${sessionId}/swap-resource`, {
      method: 'POST',
      body: JSON.stringify({ targetResourceId, reason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to swap session table');
    }
    return res.json();
  }

  async qrCheckin(qrData: string): Promise<{
    success: boolean;
    message: string;
    bookingId: number;
    sessionId: number;
    customerName: string;
    customerPhone: string;
    resourceName: string;
    sportName: string;
    timeWindow: string;
    status: string;
  }> {
    const res = await this.request(`${API_BASE_URL}/staff/checkin/qr`, {
      method: 'POST',
      body: JSON.stringify({ qrData }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Invalid or unverified ticket QR code');
    }
    return res.json();
  }

  // --- Reports & Analytics Engine (Module 7) ---
  async getComprehensiveReport(venueId?: number, startDate?: string, endDate?: string) {
    let url = `${API_BASE_URL}/reports/summary`;
    const params = new URLSearchParams();
    if (venueId) params.append('venueId', String(venueId));
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (params.toString()) url += `?${params.toString()}`;

    const res = await this.request(url, {
      method: 'GET',
    });
    if (!res.ok) return null;
    return res.json();
  }

  // --- Activity Audit Trail ---

  async getAuditLogs(): Promise<Array<{
    id: string;
    timestamp: string;
    action: string;
    details: string;
    user: string;
    type: 'CHECKIN' | 'EXTEND' | 'SWAP' | 'SETTLE' | 'CANTEEN' | 'CANCEL' | 'BOOKING' | 'NO_SHOW';
  }>> {
    const res = await this.request(`${API_BASE_URL}/staff/audit-logs`, {
      method: 'GET',
    });
    if (!res.ok) return [];
    return res.json();
  }

  async downloadReportCsv(venueId?: number, startDate?: string, endDate?: string) {
    let url = `${API_BASE_URL}/reports/export/csv`;
    const params = new URLSearchParams();
    if (venueId) params.append('venueId', String(venueId));
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (params.toString()) url += `?${params.toString()}`;

    const res = await this.request(url, {
      method: 'GET',
    });
    if (!res.ok) throw new Error('Failed to export CSV report');
    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', `venue-booking-report-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
  }

  // --- Financial & Earnings Intelligence Engine ---
  async getEarningsReport(venueId?: number, startDate?: string, endDate?: string) {
    let url = `${API_BASE_URL}/reports/earnings`;
    const params = new URLSearchParams();
    if (venueId) params.append('venueId', String(venueId));
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (params.toString()) url += `?${params.toString()}`;

    const res = await this.request(url, {
      method: 'GET',
    });
    if (!res.ok) return null;
    return res.json();
  }

  async downloadEarningsCsv(venueId?: number, startDate?: string, endDate?: string) {
    let url = `${API_BASE_URL}/reports/export/csv`;
    const params = new URLSearchParams();
    if (venueId) params.append('venueId', String(venueId));
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (params.toString()) url += `?${params.toString()}`;

    const res = await this.request(url, {
      method: 'GET',
    });
    if (!res.ok) throw new Error('Failed to export earnings statement CSV');
    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', `venue-earnings-statement-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
  }

  // --- Payment Gateway Configuration (Owner / Manager BYOK) ---
  async getPaymentGatewaySettings(): Promise<{
    id?: number;
    tenantId: number;
    gateway: string;
    keyId: string;
    maskedKeySecret: string;
    maskedWebhookSecret: string;
    isConfigured: boolean;
    isActive: boolean;
    webhookCallbackUrl: string;
    updatedAt?: string;
  }> {
    const res = await this.request(`${API_BASE_URL}/payments/settings/gateway`, {
      method: 'GET',
    });
    if (!res.ok) throw new Error('Failed to fetch gateway settings');
    return res.json();
  }

  async updatePaymentGatewaySettings(payload: {
    gateway: string;
    keyId: string;
    keySecret: string;
    webhookSecret?: string;
    isActive?: boolean;
  }) {
    const res = await this.request(`${API_BASE_URL}/payments/settings/gateway`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update gateway settings');
    }
    return res.json();
  }

  async testPaymentGatewayConnection(payload?: {
    gateway?: string;
    keyId?: string;
    keySecret?: string;
  }): Promise<{ success: boolean; message: string }> {
    const res = await this.request(`${API_BASE_URL}/payments/settings/gateway/test`, {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, message: err.message || 'Connection test failed' };
    }
    return res.json();
  }

  // --- Staff & Member Management Endpoints ---
  async getStaffMembers(): Promise<StaffMemberDto[]> {
    const res = await this.request(`${API_BASE_URL}/auth/members`, {
      method: 'GET',
    });
    if (!res.ok) throw new Error('Failed to fetch staff members');
    return res.json();
  }

  async inviteStaffMember(payload: InviteStaffPayload): Promise<StaffMemberDto> {
    const res = await this.request(`${API_BASE_URL}/auth/members/invite`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to invite staff member');
    }
    return res.json();
  }

  async updateStaffMember(id: number, payload: UpdateStaffPayload): Promise<StaffMemberDto> {
    const res = await this.request(`${API_BASE_URL}/auth/members/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update staff member');
    }
    return res.json();
  }

  async deleteStaffMember(id: number): Promise<void> {
    const res = await this.request(`${API_BASE_URL}/auth/members/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to deactivate staff member');
    }
  }

  // --- Equipment Tracking & Rental Inventory Endpoints ---
  async getVenueEquipment(venueId: number): Promise<EquipmentItemDto[]> {
    const res = await this.request(`${API_BASE_URL}/venues/${venueId}/equipment`, {
      method: 'GET',
    });
    if (!res.ok) throw new Error('Failed to fetch venue equipment inventory');
    return res.json();
  }

  async createEquipment(venueId: number, payload: CreateEquipmentPayload): Promise<EquipmentItemDto> {
    const res = await this.request(`${API_BASE_URL}/venues/${venueId}/canteen/items`, {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        isEquipment: true,
        category: payload.category || 'EQUIPMENT_RENTAL',
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to register equipment');
    }
    return res.json();
  }

  async updateEquipment(venueId: number, itemId: number, payload: UpdateEquipmentPayload): Promise<EquipmentItemDto> {
    const res = await this.request(`${API_BASE_URL}/venues/${venueId}/equipment/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update equipment');
    }
    return res.json();
  }

  async updateEquipmentCondition(venueId: number, itemId: number, condition: string): Promise<EquipmentItemDto> {
    const res = await this.request(
      `${API_BASE_URL}/venues/${venueId}/equipment/${itemId}/condition?condition=${encodeURIComponent(condition)}`,
      {
        method: 'PATCH',
      }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update equipment condition');
    }
    return res.json();
  }

  async adjustCanteenStock(itemId: number, delta: number): Promise<any> {
    const res = await this.request(`${API_BASE_URL}/canteen/items/${itemId}/stock?delta=${delta}`, {
      method: 'PATCH',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to adjust stock');
    }
    return res.json();
  }

  // --- Memberships & VIP Passes ---
  async getMembershipPlans(): Promise<MembershipPlan[]> {
    const res = await this.request(`${API_BASE_URL}/memberships/plans/all`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch membership plans');
    }
    return res.json();
  }

  async createMembershipPlan(payload: {
    name: string;
    sportCode?: string | null;
    pricePaise: number;
    durationDays: number;
    discountPercent?: number;
    freeMinutes?: number;
  }): Promise<MembershipPlan> {
    const res = await this.request(`${API_BASE_URL}/memberships/plans`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create membership plan');
    }
    return res.json();
  }

  async toggleMembershipPlan(planId: number): Promise<MembershipPlan> {
    const res = await this.request(`${API_BASE_URL}/memberships/plans/${planId}/toggle`, {
      method: 'PUT',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to toggle membership plan');
    }
    return res.json();
  }

  async getCustomerMembershipsLedger(): Promise<CustomerMembership[]> {
    const res = await this.request(`${API_BASE_URL}/memberships/ledger`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch membership ledger');
    }
    return res.json();
  }

  // --- Coupons & Promotions (Task 2.3) ---
  async getCoupons(): Promise<CouponDto[]> {
    const res = await this.request(`${API_BASE_URL}/coupons`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch coupons');
    }
    return res.json();
  }

  async createCoupon(payload: CreateCouponPayload): Promise<CouponDto> {
    const res = await this.request(`${API_BASE_URL}/coupons`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create coupon');
    }
    return res.json();
  }

  async deleteCoupon(couponId: number): Promise<void> {
    const res = await this.request(`${API_BASE_URL}/coupons/${couponId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to delete coupon');
    }
  }

  // --- Prepaid Hours Packages (Task 2.3) ---
  async getPrepaidPackages(): Promise<PrepaidPackageDto[]> {
    const res = await this.request(`${API_BASE_URL}/prepaid-packages/all`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch prepaid packages');
    }
    return res.json();
  }

  async createPrepaidPackage(payload: CreatePrepaidPackagePayload): Promise<PrepaidPackageDto> {
    const res = await this.request(`${API_BASE_URL}/prepaid-packages`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create prepaid package');
    }
    return res.json();
  }

  async togglePrepaidPackage(packageId: number): Promise<PrepaidPackageDto> {
    const res = await this.request(`${API_BASE_URL}/prepaid-packages/${packageId}/toggle`, {
      method: 'PUT',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to toggle package');
    }
    return res.json();
  }

  async getCustomerPrepaidLedger(): Promise<CustomerPrepaidPackageDto[]> {
    const res = await this.request(`${API_BASE_URL}/prepaid-packages/ledger`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch prepaid packages ledger');
    }
    return res.json();
  }

  // --- Canteen Stock Ledger & Low-Stock Alerts (Task 2.4) ---
  async recordStockAdjustment(venueId: number, itemId: number, payload: StockAdjustmentPayload): Promise<CanteenStockLedgerEntry> {
    const res = await this.request(`${API_BASE_URL}/venues/${venueId}/canteen/items/${itemId}/stock-adjustment`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to record stock adjustment');
    }
    return res.json();
  }

  async getItemStockLedger(venueId: number, itemId: number): Promise<CanteenStockLedgerEntry[]> {
    const res = await this.request(`${API_BASE_URL}/venues/${venueId}/canteen/items/${itemId}/stock-ledger`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch item stock ledger');
    }
    return res.json();
  }

  async getVenueStockLedger(venueId: number): Promise<CanteenStockLedgerEntry[]> {
    const res = await this.request(`${API_BASE_URL}/venues/${venueId}/canteen/stock-ledger`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch venue stock ledger');
    }
    return res.json();
  }

  async getLowStockAlerts(venueId: number): Promise<CanteenItemData[]> {
    const res = await this.request(`${API_BASE_URL}/venues/${venueId}/canteen/low-stock-alerts`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch low-stock alerts');
    }
    return res.json();
  }

  // --- Platform Super-Admin API (Task 2.6) ---
  async getSuperAdminTenants(): Promise<PlatformTenantDto[]> {
    const res = await this.request(`${API_BASE_URL}/superadmin/tenants`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch platform tenants');
    }
    return res.json();
  }

  async onboardTenant(payload: OnboardTenantRequestDto): Promise<PlatformTenantDto> {
    const res = await this.request(`${API_BASE_URL}/superadmin/tenants`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to onboard tenant venue');
    }
    return res.json();
  }

  async updateTenantStatus(tenantId: number, status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL'): Promise<PlatformTenantDto> {
    const res = await this.request(`${API_BASE_URL}/superadmin/tenants/${tenantId}/status?status=${status}`, {
      method: 'PATCH',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update tenant status');
    }
    return res.json();
  }

  async getSuperAdminMetrics(): Promise<PlatformMetricsDto> {
    const res = await this.request(`${API_BASE_URL}/superadmin/metrics`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch platform metrics');
    }
    return res.json();
  }

  async impersonateTenant(payload: ImpersonateRequestDto): Promise<ImpersonationAuditDto> {
    const res = await this.request(`${API_BASE_URL}/superadmin/impersonate`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to perform support impersonation');
    }
    return res.json();
  }

  async getImpersonationAuditLogs(): Promise<ImpersonationAuditDto[]> {
    const res = await this.request(`${API_BASE_URL}/superadmin/impersonate/audit`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch impersonation audit logs');
    }
    return res.json();
  }
}

export const api = new ApiService();
