import { VenueItem, ResourceItem, SlotCell, BookingTicket, SportItem, PrepaidPackageDto, CustomerPrepaidPackageDto, CouponValidationResult } from '../types';

// In Android Emulator localhost is 10.0.2.2; on physical device or web use machine IP or 127.0.0.1
const API_BASE_URL = 'http://localhost:8080/api/v1';

class MobileApiService {
  private token: string | null = null;
  private refreshTokenVal: string | null = null;
  private tenantId: number = 1;
  private refreshPromise: Promise<string | null> | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  setTokens(accessToken: string | null, refreshToken: string | null = null) {
    this.token = accessToken;
    if (refreshToken) {
      this.refreshTokenVal = refreshToken;
    }
  }

  setTenantId(id: number) {
    this.tenantId = id;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Tenant-Id': this.tenantId.toString(),
      'X-Correlation-Id': 'mob-' + Math.random().toString(36).substring(2, 9),
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  // --- Auto-Refresh Interceptor ---
  async refreshSession(): Promise<string | null> {
    if (!this.refreshTokenVal) {
      this.setTokens(null, null);
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
          this.setTokens(null, null);
          return null;
        }

        const data = await res.json();
        if (data.accessToken) {
          this.setTokens(data.accessToken, data.refreshToken);
          return data.accessToken;
        }
      } catch {
        this.setTokens(null, null);
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
    this.setTokens(null, null);
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

    // Auto-refresh token and retry on 401
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

  // --- Auth ---
  async requestOtp(phone: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/otp/request`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Could not send an OTP');
    return data;
  }

  async verifyOtp(phone: string, otp: string): Promise<{ accessToken: string; refreshToken?: string; user: any }> {
    const res = await fetch(`${API_BASE_URL}/auth/otp/verify`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ phone, otp }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'OTP verification failed');
    if (!data.accessToken) throw new Error('The server did not return an access token');
    this.setTokens(data.accessToken, data.refreshToken);
    return data;
  }

  // --- Sports ---
  async fetchSports(): Promise<SportItem[]> {
    const res = await this.request(`${API_BASE_URL}/sports`);
    if (!res.ok) throw new Error('Failed to fetch sports from the server');
    return res.json();
  }

  // --- Venues ---
  async fetchVenues(sport?: string): Promise<VenueItem[]> {
    const url = sport && sport !== 'ALL'
      ? `${API_BASE_URL}/venues?sport=${encodeURIComponent(sport)}`
      : `${API_BASE_URL}/venues`;
    const res = await this.request(url);
    if (!res.ok) throw new Error('Failed to fetch venues from the server');
    const rows = await res.json();
    return rows.map((venue: any) => ({
      ...venue,
      sports: venue.sports ?? [],
      payAtVenueAllowed: venue.payAtVenueMode === 'NO_ADVANCE',
      openTime: venue.operatingHours?.[0]?.openTime ?? '',
      closeTime: venue.operatingHours?.[0]?.closeTime ?? '',
    } as VenueItem));
  }

  // --- Resources ---
  async fetchResources(venueId: number): Promise<ResourceItem[]> {
    const res = await this.request(`${API_BASE_URL}/venues/${venueId}/resources`);
    if (!res.ok) throw new Error('Failed to fetch resources from the server');
    const rows = await res.json();
    return rows.map((resource: any) => ({
      ...resource,
      sport: resource.sportCode,
      ratePerHourPaise: resource.pricingRules?.[0]?.pricePerHourPaise ?? resource.pricingRules?.[0]?.pricePerSlotPaise ?? 0,
    } as ResourceItem));
  }

  // --- Slot Availability ---
  async fetchAvailability(resourceId: number, dateStr: string): Promise<SlotCell[]> {
    const res = await this.request(`${API_BASE_URL}/resources/${resourceId}/availability?date=${dateStr}`);
    if (!res.ok) throw new Error('Failed to fetch slot availability');
    const data = await res.json();
    return (data.slots ?? []).map((slot: any) => ({
      startUtc: slot.slotStart,
      endUtc: slot.slotEnd,
      label: new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: data.venueTimezone }).format(new Date(slot.slotStart)),
      pricePaise: slot.pricePaise ?? 0,
      status: slot.status === 'BLOCKED' ? 'MAINTENANCE' : slot.status,
    }));
  }

  // --- Create Booking Hold ---
  async createBooking(payload: { resourceId: number; startUtc: string; endUtc: string; paymentMode: 'ONLINE' | 'PAY_AT_VENUE'; couponCode?: string }): Promise<any> {
    const res = await this.request(`${API_BASE_URL}/bookings`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error || 'Unable to hold the selected slot');
    return data;
  }

  async choosePayAtVenue(bookingId: number): Promise<any> {
    const res = await this.request(`${API_BASE_URL}/bookings/${bookingId}/pay-at-venue`, {
      method: 'POST',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Pay at venue could not be selected');
    return data;
  }

  async createPaymentOrder(bookingId: number): Promise<any> {
    const res = await this.request(`${API_BASE_URL}/payments/order`, {
      method: 'POST',
      body: JSON.stringify({ bookingId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Could not start payment');
    return data;
  }

  async verifyPayment(orderId: string, paymentId: string, signature: string): Promise<void> {
    const res = await this.request(`${API_BASE_URL}/payments/verify-checkout`, {
      method: 'POST',
      body: JSON.stringify({ orderId, paymentId, signature }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Payment verification failed');
    }
  }

  async fetchMyBookings(): Promise<BookingTicket[]> {
    const res = await this.request(`${API_BASE_URL}/me/bookings`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Could not load your bookings');
    return data.map((booking: any) => {
      const start = new Date(booking.startUtc);
      const end = new Date(booking.endUtc);
      return {
        bookingId: String(booking.id),
        venueName: booking.venueName ?? 'Venue',
        venueAddress: '',
        resourceName: booking.resourceName ?? 'Resource',
        sport: '',
        dateLabel: start.toLocaleDateString(),
        timeWindow: `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        status: booking.status,
        amountPaise: booking.amountPaise,
        paymentMode: booking.paymentMode,
        qrData: '',
        canCancel: ['HELD', 'CONFIRMED'].includes(booking.status),
        holdExpiresAt: booking.holdExpiresAt,
      } as BookingTicket;
    });
  }

  async fetchBooking(bookingId: number): Promise<any> {
    const res = await this.request(`${API_BASE_URL}/bookings/${bookingId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Could not refresh booking status');
    return data;
  }

  async cancelBooking(bookingId: number): Promise<any> {
    const res = await this.request(`${API_BASE_URL}/bookings/${bookingId}/cancel`, {
      method: 'POST',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Could not cancel the booking');
    return data;
  }

  // --- Wallet & Top-up ---
  async fetchWallet(userId: number): Promise<{ walletId: number; userId: number; balancePaise: number; balanceRupees: number }> {
    const res = await this.request(`${API_BASE_URL}/wallets/customer/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch wallet');
    return res.json();
  }

  async fetchWalletTransactions(userId: number): Promise<any[]> {
    const res = await this.request(`${API_BASE_URL}/wallets/customer/${userId}/transactions`);
    if (!res.ok) throw new Error('Failed to fetch wallet transactions');
    return res.json();
  }

  async createWalletTopupOrder(amountPaise: number): Promise<{
    orderId: string;
    amountPaise: number;
    currency: string;
    keyId: string;
    purpose?: string;
  }> {
    const res = await this.request(`${API_BASE_URL}/payments/wallet-topup-order`, {
      method: 'POST',
      body: JSON.stringify({ amountPaise }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Could not initiate wallet top-up');
    return data;
  }

  // --- Memberships & Passes ---
  async fetchMembershipPlans(): Promise<any[]> {
    const res = await this.request(`${API_BASE_URL}/memberships/plans`);
    if (!res.ok) throw new Error('Failed to load membership plans');
    return res.json();
  }

  async fetchActiveMembership(userId: number): Promise<any | null> {
    const res = await this.request(`${API_BASE_URL}/memberships/customer/${userId}/active`);
    if (res.status === 204) return null;
    if (!res.ok) return null;
    return res.json();
  }

  async purchaseMembership(planId: number, paymentMode: 'WALLET' | 'ONLINE' = 'WALLET'): Promise<any> {
    const res = await this.request(`${API_BASE_URL}/memberships/purchase`, {
      method: 'POST',
      body: JSON.stringify({ planId, paymentMode }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to purchase membership');
    return data;
  }

  // --- Coupons & Promotions (Task 2.3) ---
  async validateCoupon(code: string, bookingAmountPaise: number, sportCode?: string): Promise<CouponValidationResult> {
    const res = await this.request(`${API_BASE_URL}/coupons/validate`, {
      method: 'POST',
      body: JSON.stringify({ code, bookingAmountPaise, sportCode }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Coupon validation failed');
    return data;
  }

  // --- Prepaid Game Hours Packages (Task 2.3) ---
  async fetchPrepaidPackages(): Promise<PrepaidPackageDto[]> {
    const res = await this.request(`${API_BASE_URL}/prepaid-packages`);
    if (!res.ok) throw new Error('Failed to load prepaid packages');
    return res.json();
  }

  async fetchCustomerPrepaidPackages(userId: number): Promise<CustomerPrepaidPackageDto[]> {
    const res = await this.request(`${API_BASE_URL}/prepaid-packages/customer/${userId}/active`);
    if (!res.ok) return [];
    return res.json();
  }

  async purchasePrepaidPackage(packageId: number, paymentMode: 'WALLET' | 'ONLINE' = 'WALLET'): Promise<CustomerPrepaidPackageDto> {
    const res = await this.request(`${API_BASE_URL}/prepaid-packages/purchase`, {
      method: 'POST',
      body: JSON.stringify({ packageId, paymentMode }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to purchase prepaid package');
    return data;
  }
}

export const mobileApi = new MobileApiService();
