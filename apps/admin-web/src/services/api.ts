/**
 * Enterprise API Client for VenueOps Admin Web
 * Connects directly through Spring Cloud API Gateway (Port 8080)
 */

/// <reference types="vite/client" />

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
  bookingId: number;
  tenantId: number;
  venueId: number;
  venueName?: string;
  resourceId: number;
  resourceName?: string;
  customerName?: string;
  customerPhone?: string;
  bookingSource?: 'APP' | 'WALKIN';
  bookingStatus?: string;
  startedAt: string;
  endedAt?: string;
  elapsedSeconds: number;
  billedMinutes?: number;
  amountPaise: number;
  paidPaise: number;
  startedBy?: number;
  endedBy?: number;
  active: boolean;
}

class ApiService {
  private token: string | null = null;
  private tenantId: number = 1;

  constructor() {
    this.token = localStorage.getItem('venue_access_token');
    const storedTenant = localStorage.getItem('venue_tenant_id');
    if (storedTenant) {
      this.tenantId = parseInt(storedTenant, 10);
    }
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('venue_access_token', token);
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
      body: JSON.stringify({ phone, otp }),
    });
    const data = await res.json();
    if (data.accessToken) {
      this.setToken(data.accessToken);
    }
    return data;
  }

  // --- Staff Desk Live Sessions Endpoints ---
  async startLiveSession(payload: StartSessionPayload): Promise<PlaySessionData> {
    const res = await fetch(`${API_BASE_URL}/staff/sessions/start`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to start live play session');
    }
    return res.json();
  }

  async stopLiveSession(sessionId: number, payload: StopSessionPayload): Promise<PlaySessionData> {
    const res = await fetch(`${API_BASE_URL}/staff/sessions/${sessionId}/stop`, {
      method: 'POST',
      headers: this.getHeaders(),
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

    const res = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error('Failed to fetch active sessions');
    }
    return res.json();
  }

  async checkinBooking(bookingId: number) {
    const res = await fetch(`${API_BASE_URL}/staff/bookings/${bookingId}/checkin`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    return res.ok;
  }

  // --- Catalog & Venues ---
  async getVenues() {
    const res = await fetch(`${API_BASE_URL}/venues`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return res.json();
  }

  // --- Bookings ---
  async getBookings() {
    const res = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return res.json();
  }

  // --- Sports & Catalog Management ---
  async getSports() {
    const res = await fetch(`${API_BASE_URL}/sports`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return res.json();
  }

  async createSport(payload: { code: string; nameEn: string; nameMr?: string; nameHi?: string }) {
    const res = await fetch(`${API_BASE_URL}/sports`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create sport');
    }
    return res.json();
  }

  async createResource(payload: any) {
    const res = await fetch(`${API_BASE_URL}/owner/resources`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    return res.json();
  }

  // --- Payments & Refunds ---
  async processRefund(bookingId: number, amountPaise: number, reason?: string) {
    const res = await fetch(`${API_BASE_URL}/payments/refund`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ bookingId, amountPaise, reason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to process refund');
    }
    return res.json();
  }

  async cancelBooking(bookingId: number) {
    const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel?isStaff=true`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to cancel booking');
    }
    return res.json();
  }

  // --- Canteen & Equipment Inventory (Module 6) ---
  async getCanteenItems(venueId: number = 1) {
    const res = await fetch(`${API_BASE_URL}/venues/${venueId}/canteen/items`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  }

  async addItemToBooking(bookingId: number, item: { canteenItemId: number; itemName: string; quantity: number; unitPricePaise: number }) {
    const res = await fetch(`${API_BASE_URL}/staff/bookings/${bookingId}/items`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(item),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to add item to session bill');
    }
    return res.json();
  }

  async getShiftSummary(venueId: number = 1) {
    const res = await fetch(`${API_BASE_URL}/staff/shift-summary?venueId=${venueId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!res.ok) return null;
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

    const res = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!res.ok) return null;
    return res.json();
  }

  async downloadReportCsv(venueId?: number, startDate?: string, endDate?: string) {
    let url = `${API_BASE_URL}/reports/export/csv`;
    const params = new URLSearchParams();
    if (venueId) params.append('venueId', String(venueId));
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (params.toString()) url += `?${params.toString()}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
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
}

export const api = new ApiService();
